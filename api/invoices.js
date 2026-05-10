import { fromInvoice, readBody, sendJson, sendMethodNotAllowed, supabaseRequest, toInvoice } from "./_supabase.mjs";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const rows = await supabaseRequest("/invoices?select=*&order=id.desc");
      sendJson(res, 200, rows.map(toInvoice));
      return;
    }

    if (req.method === "POST") {
      const body = await readBody(req);
      const [created] = await supabaseRequest("/invoices", {
        method: "POST",
        headers: { prefer: "return=representation" },
        body: JSON.stringify(fromInvoice(body)),
      });

      const invoice = {
        ...toInvoice(created),
        invoiceNumber: `INV-${String(created.id).padStart(5, "0")}`,
      };

      await supabaseRequest(`/invoices?id=eq.${created.id}`, {
        method: "PATCH",
        body: JSON.stringify({ invoice_number: invoice.invoiceNumber }),
      });

      sendJson(res, 201, invoice);
      return;
    }

    sendMethodNotAllowed(res);
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Server error" });
  }
}
