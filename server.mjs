import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "data");
const dataFile = path.join(dataDir, "store.json");
const distDir = path.join(__dirname, "dist");
const port = Number(process.env.PORT || 5173);
const isProduction = process.env.NODE_ENV === "production";

const defaultStore = {
  products: [],
  invoices: [],
};

async function ensureStore() {
  await fs.mkdir(dataDir, { recursive: true });

  try {
    await fs.access(dataFile);
  } catch {
    await fs.writeFile(dataFile, JSON.stringify(defaultStore, null, 2));
  }
}

async function readStore() {
  await ensureStore();

  try {
    const raw = await fs.readFile(dataFile, "utf8");
    return { ...defaultStore, ...JSON.parse(raw) };
  } catch {
    return defaultStore;
  }
}

async function writeStore(store) {
  await fs.writeFile(dataFile, JSON.stringify(store, null, 2));
}

function calculateTotal(lineItems = []) {
  return lineItems.reduce(
    (sum, item) => sum + Number(item.quantity || 0) * Number(item.price || 0),
    0,
  );
}

function invoiceNumber(id) {
  return `INV-${String(id).padStart(5, "0")}`;
}

function normalizeInvoice(data) {
  return {
    invoiceDate: data.invoiceDate || new Date().toISOString().split("T")[0],
    dueDate: data.dueDate || new Date().toISOString().split("T")[0],
    customerName: data.customerName || "",
    customerPhone: data.customerPhone || "",
    lineItems: data.lineItems || [],
    notes: data.notes || "",
    status: data.status || "draft",
  };
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function sendJson(res, status, data) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(data));
}

function sendError(res, status, message) {
  sendJson(res, status, { error: message });
}

const mimeTypes = {
  ".css": "text/css",
  ".gif": "image/gif",
  ".html": "text/html",
  ".jpg": "image/jpeg",
  ".js": "text/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain",
  ".webp": "image/webp",
};

async function fileExists(filePath) {
  try {
    const stats = await fs.stat(filePath);
    return stats.isFile();
  } catch {
    return false;
  }
}

async function serveStatic(req, res) {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  const pathname = decodeURIComponent(url.pathname);
  const requestedPath = path.normalize(path.join(distDir, pathname));

  if (!requestedPath.startsWith(distDir)) {
    sendError(res, 403, "Forbidden");
    return;
  }

  const filePath = (await fileExists(requestedPath))
    ? requestedPath
    : path.join(distDir, "index.html");

  try {
    const content = await fs.readFile(filePath);
    const contentType = mimeTypes[path.extname(filePath)] || "application/octet-stream";
    res.writeHead(200, { "content-type": contentType });
    res.end(content);
  } catch {
    sendError(res, 404, "Not found");
  }
}

async function handleApi(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const store = await readStore();

  if (url.pathname === "/api/products") {
    if (req.method === "GET") {
      sendJson(res, 200, store.products);
      return true;
    }

    if (req.method === "POST") {
      const body = await readJsonBody(req);
      const product = {
        id: Date.now(),
        name: String(body.name || "").trim(),
        unit: String(body.unit || "").trim(),
        price: Number(body.price || 0),
      };

      if (!product.name || !product.unit || Number.isNaN(product.price) || product.price < 0) {
        sendError(res, 400, "Invalid product");
        return true;
      }

      store.products.push(product);
      await writeStore(store);
      sendJson(res, 201, product);
      return true;
    }
  }

  const productMatch = url.pathname.match(/^\/api\/products\/(\d+)$/);
  if (productMatch) {
    const id = Number(productMatch[1]);

    if (req.method === "PUT") {
      const body = await readJsonBody(req);
      const existing = store.products.find((product) => product.id === id);
      if (!existing) {
        sendError(res, 404, "Product not found");
        return true;
      }

      const updated = {
        ...existing,
        name: String(body.name || "").trim(),
        unit: String(body.unit || "").trim(),
        price: Number(body.price || 0),
      };

      if (!updated.name || !updated.unit || Number.isNaN(updated.price) || updated.price < 0) {
        sendError(res, 400, "Invalid product");
        return true;
      }

      store.products = store.products.map((product) => (product.id === id ? updated : product));
      await writeStore(store);
      sendJson(res, 200, updated);
      return true;
    }

    if (req.method === "DELETE") {
      store.products = store.products.filter((product) => product.id !== id);
      await writeStore(store);
      sendJson(res, 200, { id });
      return true;
    }
  }

  if (url.pathname === "/api/invoices") {
    if (req.method === "GET") {
      sendJson(
        res,
        200,
        store.invoices
          .map((invoice) => ({
            ...invoice,
            invoiceNumber: invoice.invoiceNumber || invoiceNumber(invoice.id),
            totalAmount: calculateTotal(invoice.lineItems),
          }))
          .sort((a, b) => b.id - a.id),
      );
      return true;
    }

    if (req.method === "POST") {
      const body = await readJsonBody(req);
      const id = store.invoices.reduce((max, invoice) => Math.max(max, invoice.id), 0) + 1;
      const input = normalizeInvoice(body);
      const invoice = {
        ...input,
        id,
        invoiceNumber: invoiceNumber(id),
        totalAmount: calculateTotal(input.lineItems),
      };

      store.invoices.push(invoice);
      await writeStore(store);
      sendJson(res, 201, invoice);
      return true;
    }
  }

  if (url.pathname === "/api/invoices/summary" && req.method === "GET") {
    const summary = store.invoices.reduce(
      (totals, invoice) => ({
        total: totals.total + 1,
        totalAmount: totals.totalAmount + calculateTotal(invoice.lineItems),
        paid: totals.paid + (invoice.status === "paid" ? 1 : 0),
        overdue: totals.overdue + (invoice.status === "overdue" ? 1 : 0),
        draft: totals.draft + (invoice.status === "draft" ? 1 : 0),
      }),
      { total: 0, totalAmount: 0, paid: 0, overdue: 0, draft: 0 },
    );

    sendJson(res, 200, summary);
    return true;
  }

  const invoiceMatch = url.pathname.match(/^\/api\/invoices\/(\d+)$/);
  if (invoiceMatch) {
    const id = Number(invoiceMatch[1]);

    if (req.method === "GET") {
      const invoice = store.invoices.find((item) => item.id === id);
      sendJson(
        res,
        200,
        invoice
          ? {
              ...invoice,
              invoiceNumber: invoice.invoiceNumber || invoiceNumber(invoice.id),
              totalAmount: calculateTotal(invoice.lineItems),
            }
          : null,
      );
      return true;
    }

    if (req.method === "PUT") {
      const body = await readJsonBody(req);
      const existing = store.invoices.find((invoice) => invoice.id === id);
      if (!existing) {
        sendError(res, 404, "Invoice not found");
        return true;
      }

      const input = normalizeInvoice({ ...existing, ...body });
      const updated = {
        ...existing,
        ...input,
        totalAmount: calculateTotal(input.lineItems),
      };

      store.invoices = store.invoices.map((invoice) => (invoice.id === id ? updated : invoice));
      await writeStore(store);
      sendJson(res, 200, updated);
      return true;
    }

    if (req.method === "DELETE") {
      store.invoices = store.invoices.filter((invoice) => invoice.id !== id);
      await writeStore(store);
      sendJson(res, 200, { id });
      return true;
    }
  }

  return false;
}

let vite = null;

if (!isProduction) {
  const { createServer: createViteServer } = await import("vite");

  vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
}

const server = http.createServer(async (req, res) => {
  if (req.url?.startsWith("/api/")) {
    try {
      const handled = await handleApi(req, res);
      if (!handled) sendError(res, 404, "Not found");
    } catch (error) {
      console.error(error);
      sendError(res, 500, "Server error");
    }
    return;
  }

  if (isProduction) {
    await serveStatic(req, res);
  } else {
    vite.middlewares(req, res, () => {
      if (!res.writableEnded) {
        sendError(res, 404, "Not found");
      }
    });
  }
});

server.listen(port, "0.0.0.0");

console.log(`Persistent data file: ${dataFile}`);
console.log(`Local:   http://localhost:${port}/`);
