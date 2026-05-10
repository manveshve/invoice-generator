import { readBody, sendJson, sendMethodNotAllowed, supabaseRequest, toProduct } from "./_supabase.mjs";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const rows = await supabaseRequest("/products?select=*&order=id.asc");
      sendJson(res, 200, rows.map(toProduct));
      return;
    }

    if (req.method === "POST") {
      const body = await readBody(req);
      const product = {
        name: String(body.name || "").trim(),
        unit: String(body.unit || "").trim(),
        price: Number(body.price || 0),
      };

      if (!product.name || !product.unit || Number.isNaN(product.price) || product.price < 0) {
        sendJson(res, 400, { error: "Invalid product" });
        return;
      }

      const [created] = await supabaseRequest("/products", {
        method: "POST",
        headers: { prefer: "return=representation" },
        body: JSON.stringify(product),
      });

      sendJson(res, 201, toProduct(created));
      return;
    }

    sendMethodNotAllowed(res);
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Server error" });
  }
}
