import { fromInvoice, readBody, sendJson, sendMethodNotAllowed, supabaseRequest, toInvoice } from "../_supabase.mjs";

export default async function handler(req, res) {
  const id = Number(req.query.id);

  try {
    if (!id) {
      sendJson(res, 400, { error: "Invalid invoice id" });
      return;
    }

    if (req.method === "GET") {
      const rows = await supabaseRequest(`/invoices?select=*&id=eq.${id}&limit=1`);
      sendJson(res, 200, rows[0] ? toInvoice(rows[0]) : null);
      return;
    }

    if (req.method === "PUT") {
      const body = await readBody(req);
      const rows = await supabaseRequest(`/invoices?id=eq.${id}`, {
        method: "PATCH",
        headers: { prefer: "return=representation" },
        body: JSON.stringify(fromInvoice(body)),
      });

      if (rows.length === 0) {
        sendJson(res, 404, { error: "Invoice not found" });
        return;
      }

      sendJson(res, 200, toInvoice(rows[0]));
      return;
    }

    if (req.method === "DELETE") {
      await supabaseRequest(`/invoices?id=eq.${id}`, {
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
