import { useLocation } from "wouter";
import { useCreateInvoice, InvoiceInput, getListInvoicesQueryKey, getGetInvoiceSummaryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { InvoiceForm } from "@/components/invoice-form";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function InvoiceNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createInvoice = useCreateInvoice();

  const handleSubmit = (data: any) => {
    // Coerce data properly
    const payload: InvoiceInput = {
      ...data,
      lineItems: data.lineItems.map((item: any, i: number) => ({
        ...item,
        lineNumber: i + 1,
      }))
    };

    createInvoice.mutate({ data: payload }, {
      onSuccess: (invoice) => {
        toast({ title: "Invoice created successfully" });
        queryClient.invalidateQueries({ queryKey: getListInvoicesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetInvoiceSummaryQueryKey() });
        setLocation(`/invoices/${invoice.id}`);
      },
      onError: () => {
        toast({ title: "Failed to create invoice", variant: "destructive" });
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => setLocation("/invoices")} className="shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Create Invoice</h1>
          <p className="text-muted-foreground mt-1">Draft a new invoice to send to your client.</p>
        </div>
      </div>

      <InvoiceForm 
        onSubmit={handleSubmit} 
        isSubmitting={createInvoice.isPending} 
      />
    </div>
  );
}