import { useGetInvoiceSummary, useListInvoices } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { Link } from "wouter";
import { FileText, PlusCircle, CheckCircle, Clock, FileEdit, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetInvoiceSummary();
  const { data: invoices, isLoading: isLoadingInvoices } = useListInvoices();

  const recentInvoices = invoices?.slice(0, 5) || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your invoicing and revenue.</p>
        </div>
        <Button asChild>
          <Link href="/invoices/new" className="flex items-center gap-2">
            <PlusCircle className="w-4 h-4" />
            New Invoice
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <div className="p-2 bg-primary/10 rounded-full text-primary">
              <FileText className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold">{formatCurrency(summary?.totalAmount)}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Across {summary?.total || 0} invoices</p>
          </CardContent>
        </Card>
        
        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Paid</CardTitle>
            <div className="p-2 bg-emerald-100 rounded-full text-emerald-600">
              <CheckCircle className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{summary?.paid || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Invoices fully paid</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle>
            <div className="p-2 bg-red-100 rounded-full text-red-600">
              <Clock className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{summary?.overdue || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Require immediate action</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Drafts</CardTitle>
            <div className="p-2 bg-slate-100 rounded-full text-slate-600">
              <FileEdit className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{summary?.draft || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Pending to be sent</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">Recent Invoices</h2>
          <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
            <Link href="/invoices" className="flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>

        <Card className="overflow-hidden">
          <div className="divide-y divide-border">
            {isLoadingInvoices ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))
            ) : recentInvoices.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="font-medium text-lg">No invoices yet</h3>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-4">
                  Create your first invoice to start getting paid by your clients.
                </p>
                <Button asChild>
                  <Link href="/invoices/new">Create Invoice</Link>
                </Button>
              </div>
            ) : (
              recentInvoices.map((invoice) => (
                <Link key={invoice.id} href={`/invoices/${invoice.id}`} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-muted/50 transition-colors gap-4">
                  <div className="flex items-start sm:items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 hidden sm:flex">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{invoice.invoiceNumber}</span>
                        <StatusBadge status={invoice.status} />
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {invoice.customerName} • Due {formatDate(invoice.dueDate)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                    <div className="text-right">
                      <div className="font-bold text-foreground">{formatCurrency(invoice.totalAmount)}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground hidden sm:block" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}