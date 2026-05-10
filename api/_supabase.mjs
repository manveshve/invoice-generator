const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable.");
}

const restUrl = `${supabaseUrl}/rest/v1`;

export function sendJson(res, status, data) {
  res.status(status).json(data);
}

export function sendMethodNotAllowed(res) {
  sendJson(res, 405, { error: "Method not allowed" });
}

export async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string" && req.body.length > 0) return JSON.parse(req.body);
  return {};
}

export async function supabaseRequest(path, options = {}) {
  const response = await fetch(`${restUrl}${path}`, {
    ...options,
    headers: {
      apikey: supabaseServiceRoleKey,
      authorization: `Bearer ${supabaseServiceRoleKey}`,
      "content-type": "application/json",
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.message || `Supabase request failed: ${response.status}`);
  }

  return data;
}

export function calculateTotal(lineItems = []) {
  return lineItems.reduce(
    (sum, item) => sum + Number(item.quantity || 0) * Number(item.price || 0),
    0,
  );
}

export function invoiceNumber(id) {
  return `INV-${String(id).padStart(5, "0")}`;
}

export function toProduct(row) {
  return {
    id: row.id,
    name: row.name,
    unit: row.unit,
    price: Number(row.price || 0),
  };
}

export function toInvoice(row) {
  const lineItems = row.line_items || [];

  return {
    id: row.id,
    invoiceNumber: row.invoice_number || invoiceNumber(row.id),
    invoiceDate: row.invoice_date,
    dueDate: row.due_date,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    lineItems,
    notes: row.notes || "",
    status: row.status || "draft",
    totalAmount: calculateTotal(lineItems),
  };
}

export function fromInvoice(data) {
  return {
    invoice_date: data.invoiceDate,
    due_date: data.dueDate,
    customer_name: data.customerName,
    customer_phone: data.customerPhone,
    line_items: data.lineItems || [],
    notes: data.notes || "",
    status: data.status || "draft",
  };
}
