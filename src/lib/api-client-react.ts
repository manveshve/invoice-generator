import { useMutation, useQuery } from "@tanstack/react-query";

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";

export interface InvoiceLineItem {
  lineNumber: number;
  productName: string;
  quantity: number;
  price: number;
}

export interface InvoiceInput {
  invoiceDate: string;
  dueDate: string;
  customerName: string;
  customerPhone: string;
  lineItems: InvoiceLineItem[];
  notes?: string;
  status: InvoiceStatus;
}

export type InvoiceUpdate = Partial<InvoiceInput>;

export interface Invoice extends InvoiceInput {
  id: number;
  invoiceNumber: string;
  totalAmount: number;
}

export interface InvoiceSummary {
  total: number;
  totalAmount: number;
  paid: number;
  overdue: number;
  draft: number;
}

const STORAGE_KEY = "invoice-generator-v2:invoices";

export const getListInvoicesQueryKey = () => ["invoices"] as const;
export const getGetInvoiceQueryKey = (id: number) => ["invoices", id] as const;
export const getGetInvoiceSummaryQueryKey = () => ["invoices", "summary"] as const;

function calculateTotal(lineItems: InvoiceLineItem[] = []) {
  return lineItems.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.price || 0), 0);
}

function invoiceNumber(id: number) {
  return `INV-${String(id).padStart(5, "0")}`;
}

function readInvoices(): Invoice[] {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const invoices = JSON.parse(raw) as Invoice[];
    return invoices.map((invoice) => ({
      ...invoice,
      invoiceNumber: invoice.invoiceNumber || invoiceNumber(invoice.id),
      totalAmount: calculateTotal(invoice.lineItems),
    }));
  } catch {
    return [];
  }
}

function writeInvoices(invoices: Invoice[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
}

function normalizeInput(data: InvoiceInput | InvoiceUpdate): InvoiceInput {
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

export function useListInvoices() {
  return useQuery({
    queryKey: getListInvoicesQueryKey(),
    queryFn: () => readInvoices().sort((a, b) => b.id - a.id),
  });
}

export function useGetInvoice(id: number, options?: { query?: { enabled?: boolean } }) {
  return useQuery({
    queryKey: getGetInvoiceQueryKey(id),
    queryFn: () => readInvoices().find((invoice) => invoice.id === id) ?? null,
    enabled: options?.query?.enabled ?? true,
  });
}

export function useGetInvoiceSummary() {
  return useQuery({
    queryKey: getGetInvoiceSummaryQueryKey(),
    queryFn: () => {
      const invoices = readInvoices();
      return invoices.reduce<InvoiceSummary>(
        (summary, invoice) => ({
          total: summary.total + 1,
          totalAmount: summary.totalAmount + invoice.totalAmount,
          paid: summary.paid + (invoice.status === "paid" ? 1 : 0),
          overdue: summary.overdue + (invoice.status === "overdue" ? 1 : 0),
          draft: summary.draft + (invoice.status === "draft" ? 1 : 0),
        }),
        { total: 0, totalAmount: 0, paid: 0, overdue: 0, draft: 0 },
      );
    },
  });
}

export function useCreateInvoice() {
  return useMutation<Invoice, Error, { data: InvoiceInput }>({
    mutationFn: async ({ data }) => {
      const invoices = readInvoices();
      const id = invoices.reduce((max, invoice) => Math.max(max, invoice.id), 0) + 1;
      const input = normalizeInput(data);
      const invoice: Invoice = {
        ...input,
        id,
        invoiceNumber: invoiceNumber(id),
        totalAmount: calculateTotal(input.lineItems),
      };

      writeInvoices([...invoices, invoice]);
      return invoice;
    },
  });
}

export function useUpdateInvoice() {
  return useMutation<Invoice, Error, { id: number; data: InvoiceUpdate }>({
    mutationFn: async ({ id, data }) => {
      const invoices = readInvoices();
      const existing = invoices.find((invoice) => invoice.id === id);
      if (!existing) throw new Error("Invoice not found");

      const input = normalizeInput({ ...existing, ...data });
      const updated: Invoice = {
        ...existing,
        ...input,
        totalAmount: calculateTotal(input.lineItems),
      };

      writeInvoices(invoices.map((invoice) => (invoice.id === id ? updated : invoice)));
      return updated;
    },
  });
}

export function useDeleteInvoice() {
  return useMutation<{ id: number }, Error, { id: number }>({
    mutationFn: async ({ id }) => {
      const invoices = readInvoices();
      writeInvoices(invoices.filter((invoice) => invoice.id !== id));
      return { id };
    },
  });
}
