import { readBody, sendJson, sendMethodNotAllowed, supabaseRequest, toProduct } from "../_supabase.mjs";

export default async function handler(req, res) {
  const id = Number(req.query.id);

  try {
    if (!id) {
      sendJson(res, 400, { error: "Invalid product id" });
      return;
    }

    if (req.method === "PUT") {
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

      const rows = await supabaseRequest(`/products?id=eq.${id}`, {
        method: "PATCH",
        headers: { prefer: "return=representation" },
        body: JSON.stringify(product),
      });

      if (rows.length === 0) {
        sendJson(res, 404, { error: "Product not found" });
        return;
      }

      sendJson(res, 200, toProduct(rows[0]));
      return;
    }

    if (req.method === "DELETE") {
      await supabaseRequest(`/products?id=eq.${id}`, {
        method: "DELETE",
      });

      sendJson(res, 200, { id });
      return;
    }

    sendMethodNotAllowed(res);
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Server error" });
  }
}
