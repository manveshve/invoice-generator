import { useLocation, useParams } from "wouter";
import { useGetInvoice, useUpdateInvoice, getGetInvoiceQueryKey, getListInvoicesQueryKey, getGetInvoiceSummaryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { InvoiceForm } from "@/components/invoice-form";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function InvoiceEdit() {
  const { id } = useParams();
  const invoiceId = parseInt(id || "0", 10);
  
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: invoice, isLoading } = useGetInvoice(invoiceId, { 
    query: { enabled: !!invoiceId } as any
  });
  
  const updateInvoice = useUpdateInvoice();

  const handleSubmit = (data: any) => {
    updateInvoice.mutate({ id: invoiceId, data }, {
      onSuccess: () => {
        toast({ title: "Invoice updated successfully" });
        queryClient.invalidateQueries({ queryKey: getGetInvoiceQueryKey(invoiceId) });
        queryClient.invalidateQueries({ queryKey: getListInvoicesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetInvoiceSummaryQueryKey() });
        setLocation(`/invoices/${invoiceId}`);
      },
      onError: () => {
        toast({ title: "Failed to update invoice", variant: "destructive" });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!invoice) {
    return <div>Invoice not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => setLocation(`/invoices/${invoiceId}`)} className="shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Edit Invoice {invoice.invoiceNumber}</h1>
          <p className="text-muted-foreground mt-1">Update invoice details.</p>
        </div>
      </div>

      <InvoiceForm 
        defaultValues={{
          ...invoice,
          notes: invoice.notes || "",
          status: invoice.status as any,
        }}
        onSubmit={handleSubmit} 
        isSubmitting={updateInvoice.isPending} 
      />
    </div>
  );
}