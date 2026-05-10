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

export const getListInvoicesQueryKey = () => ["invoices"] as const;
export const getGetInvoiceQueryKey = (id: number) => ["invoices", id] as const;
export const getGetInvoiceSummaryQueryKey = () => ["invoices", "summary"] as const;

let legacyInvoiceMigration: Promise<void> | null = null;

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: { "content-type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
}

async function migrateLegacyInvoicesIfNeeded(invoices: Invoice[]) {
  if (invoices.length > 0 || typeof window === "undefined") return;

  const raw = window.localStorage.getItem("invoice-generator-v2:invoices");
  if (!raw) return;

  try {
    const legacyInvoices = JSON.parse(raw) as Invoice[];
    if (!Array.isArray(legacyInvoices) || legacyInvoices.length === 0) return;

    await Promise.all(
      legacyInvoices.map((invoice) =>
        request<Invoice>("/api/invoices", {
          method: "POST",
          body: JSON.stringify({
            invoiceDate: invoice.invoiceDate,
            dueDate: invoice.dueDate,
            customerName: invoice.customerName,
            customerPhone: invoice.customerPhone,
            lineItems: invoice.lineItems,
            notes: invoice.notes,
            status: invoice.status,
          }),
        }),
      ),
    );
  } catch {
    // Keep the app usable if old browser data is malformed.
  }
}

async function ensureLegacyInvoicesMigrated() {
  if (!legacyInvoiceMigration) {
    legacyInvoiceMigration = request<Invoice[]>("/api/invoices").then(migrateLegacyInvoicesIfNeeded);
  }

  await legacyInvoiceMigration;
}

export function useListInvoices() {
  return useQuery({
    queryKey: getListInvoicesQueryKey(),
    queryFn: async () => {
      await ensureLegacyInvoicesMigrated();
      return request<Invoice[]>("/api/invoices");
    },
  });
}

export function useGetInvoice(id: number, options?: { query?: { enabled?: boolean } }) {
  return useQuery({
    queryKey: getGetInvoiceQueryKey(id),
    queryFn: async () => {
      await ensureLegacyInvoicesMigrated();
      return request<Invoice | null>(`/api/invoices/${id}`);
    },
    enabled: options?.query?.enabled ?? true,
  });
}

export function useGetInvoiceSummary() {
  return useQuery({
    queryKey: getGetInvoiceSummaryQueryKey(),
    queryFn: async () => {
      await ensureLegacyInvoicesMigrated();
      return request<InvoiceSummary>("/api/invoices/summary");
    },
  });
}

export function useCreateInvoice() {
  return useMutation<Invoice, Error, { data: InvoiceInput }>({
    mutationFn: async ({ data }) =>
      request<Invoice>("/api/invoices", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}

export function useUpdateInvoice() {
  return useMutation<Invoice, Error, { id: number; data: InvoiceUpdate }>({
    mutationFn: async ({ id, data }) =>
      request<Invoice>(`/api/invoices/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
  });
}

export function useDeleteInvoice() {
  return useMutation<{ id: number }, Error, { id: number }>({
    mutationFn: async ({ id }) =>
      request<{ id: number }>(`/api/invoices/${id}`, {
        method: "DELETE",
      }),
  });
}
