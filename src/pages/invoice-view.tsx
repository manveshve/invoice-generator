import { useLocation, useParams } from "wouter";
import { useGetInvoice, useDeleteInvoice, getListInvoicesQueryKey, getGetInvoiceSummaryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatCurrency, formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { InvoiceDeleteDialog } from "@/components/invoice-delete-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Printer, FileEdit, Trash2, Mail, Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function InvoiceView() {
  const { id } = useParams();
  const invoiceId = parseInt(id || "0", 10);
  
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: invoice, isLoading } = useGetInvoice(invoiceId, { 
    query: { enabled: !!invoiceId } as any
  });
  
  const deleteInvoice = useDeleteInvoice();
  const [showDelete, setShowDelete] = useState(false);

  const handleDelete = () => {
    deleteInvoice.mutate({ id: invoiceId }, {
      onSuccess: () => {
        toast({ title: "Invoice deleted successfully" });
        queryClient.invalidateQueries({ queryKey: getListInvoicesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetInvoiceSummaryQueryKey() });
        setLocation("/invoices");
      },
      onError: () => {
        toast({ title: "Failed to delete invoice", variant: "destructive" });
        setShowDelete(false);
      }
    });
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-64" />
        </div>
        <Card className="p-8 space-y-8">
          <div className="flex justify-between">
            <Skeleton className="h-16 w-32" />
            <Skeleton className="h-16 w-48" />
          </div>
          <Skeleton className="h-64 w-full" />
        </Card>
      </div>
    );
  }

  if (!invoice) {
    return <div className="p-8 text-center">Invoice not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
      {/* Actions Bar - Hidden when printing */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <Button variant="outline" onClick={() => setLocation("/invoices")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Invoices
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Print</span>
          </Button>
          <Button variant="outline" onClick={() => toast({ title: "PDF export coming soon" })} className="gap-2">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">PDF</span>
          </Button>
          <Button variant="outline" onClick={() => toast({ title: "Email functionality coming soon" })} className="gap-2">
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">Send</span>
          </Button>
          <Button variant="default" onClick={() => setLocation(`/invoices/${invoiceId}/edit`)} className="gap-2">
            <FileEdit className="h-4 w-4" />
            <span className="hidden sm:inline">Edit</span>
          </Button>
          <Button variant="destructive" onClick={() => setShowDelete(true)} size="icon">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Print-Ready Invoice Card */}
      <Card className="overflow-hidden border-border bg-white shadow-lg print:shadow-none print:border-none print:w-full print:max-w-none mx-auto">
        {/* Header Strip */}
        <div className="h-3 w-full bg-primary print:bg-black" />
        
        <div className="p-8 md:p-12">
          {/* Invoice Header */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold tracking-tighter text-slate-900">INVOICE</h1>
                <div className="print:hidden">
                  <StatusBadge status={invoice.status} />
                </div>
              </div>
              <p className="text-xl font-medium text-slate-500">#{invoice.invoiceNumber}</p>
            </div>
            
            <div className="text-right text-slate-600 space-y-1">
              <div className="flex justify-end gap-8">
                <span className="font-medium">Issue Date:</span>
                <span className="text-slate-900 font-medium w-32 text-right">{formatDate(invoice.invoiceDate)}</span>
              </div>
              <div className="flex justify-end gap-8">
                <span className="font-medium">Due Date:</span>
                <span className="text-slate-900 font-medium w-32 text-right">{formatDate(invoice.dueDate)}</span>
              </div>
            </div>
          </div>

          <div className="mb-12">
            {/* Billed To */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Billed To</h3>
              <p className="font-bold text-lg text-slate-900">{invoice.customerName}</p>
              <p className="text-slate-600">{invoice.customerPhone?.startsWith("+91") ? invoice.customerPhone : `+91 ${invoice.customerPhone}`}</p>
            </div>
          </div>

          {/* Line Items */}
          <div className="mb-8">
            <div className="grid grid-cols-12 gap-4 border-b-2 border-slate-200 pb-3 text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">
              <div className="col-span-6">Description</div>
              <div className="col-span-2 text-right">Qty</div>
              <div className="col-span-2 text-right">Price</div>
              <div className="col-span-2 text-right">Amount</div>
            </div>
            
            <div className="space-y-4">
              {invoice.lineItems.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-4 pb-4 border-b border-slate-100 text-slate-700">
                  <div className="col-span-6 font-medium text-slate-900">{item.productName}</div>
                  <div className="col-span-2 text-right">{item.quantity}</div>
                  <div className="col-span-2 text-right">{formatCurrency(item.price)}</div>
                  <div className="col-span-2 text-right font-medium text-slate-900">
                    {formatCurrency(item.quantity * item.price)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-12">
            <div className="w-full max-w-sm space-y-3 text-slate-600">
              <div className="flex justify-between py-4 border-t-2 border-slate-900 text-lg font-bold mt-2">
                <span className="text-slate-900">Total Due</span>
                <span className="text-primary print:text-black">{formatCurrency(invoice.lineItems.reduce((sum, item) => sum + item.quantity * item.price, 0))}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="mt-12 pt-8 border-t border-slate-100">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2">Notes & Terms</h3>
              <p className="text-slate-600 whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}
        </div>
      </Card>

      <InvoiceDeleteDialog 
        open={showDelete} 
        onOpenChange={setShowDelete}
        onConfirm={handleDelete}
        isDeleting={deleteInvoice.isPending}
      />
    </div>
  );
}