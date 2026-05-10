import { calculateTotal, sendJson, sendMethodNotAllowed, supabaseRequest } from "../_supabase.mjs";

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      sendMethodNotAllowed(res);
      return;
    }

    const rows = await supabaseRequest("/invoices?select=status,line_items");
    const summary = rows.reduce(
      (totals, invoice) => ({
        total: totals.total + 1,
        totalAmount: totals.totalAmount + calculateTotal(invoice.line_items || []),
        paid: totals.paid + (invoice.status === "paid" ? 1 : 0),
        overdue: totals.overdue + (invoice.status === "overdue" ? 1 : 0),
        draft: totals.draft + (invoice.status === "draft" ? 1 : 0),
      }),
      { total: 0, totalAmount: 0, paid: 0, overdue: 0, draft: 0 },
    );

    sendJson(res, 200, summary);
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Server error" });
  }
}
