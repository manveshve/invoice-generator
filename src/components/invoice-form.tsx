import { useEffect, useMemo, useState } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { InvoiceInput, InvoiceUpdate } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/format";

const lineItemSchema = z.object({
  lineNumber: z.number(),
  productName: z.string().min(1, "Product name is required"),
  quantity: z.coerce.number().min(0.001, "Quantity must be greater than 0"),
  price: z.coerce.number().min(0, "Price must be positive"),
});

const invoiceSchema = z.object({
  invoiceDate: z.string().min(1, "Invoice date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  customerName: z.string().min(1, "Customer name is required"),
  customerPhone: z.string().min(1, "Phone number is required"),
  lineItems: z.array(lineItemSchema).min(1, "At least one item is required"),
  notes: z.string().optional(),
  status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]).default("draft"),
});

type FormValues = z.infer<typeof invoiceSchema>;

type Product = {
  id: number;
  name: string;
  unit: string;
  price: number;
};

interface InvoiceFormProps {
  defaultValues?: Partial<FormValues>;
  onSubmit: (data: InvoiceInput | InvoiceUpdate) => void;
  isSubmitting?: boolean;
}

export function InvoiceForm({ defaultValues, onSubmit, isSubmitting }: InvoiceFormProps) {
  const [products, setProducts] = useState<Product[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoiceDate: defaultValues?.invoiceDate || new Date().toISOString().split('T')[0],
      dueDate: defaultValues?.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      customerName: defaultValues?.customerName || "",
      customerPhone: (defaultValues as any)?.customerPhone || "",
      lineItems: defaultValues?.lineItems?.length ? defaultValues.lineItems : [{ lineNumber: 1, productName: "", quantity: 1, price: 0 }],
      notes: defaultValues?.notes || "",
      status: (defaultValues?.status as "draft" | "sent" | "paid" | "overdue" | "cancelled") || "draft",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "lineItems",
  });

  const watchLineItems = useWatch({ control: form.control, name: "lineItems" });

  useEffect(() => {
    const saved = window.localStorage.getItem("products");
    if (!saved) return;

    try {
      setProducts(JSON.parse(saved));
    } catch {
      setProducts([]);
    }
  }, []);

  const productOptions = useMemo(() => {
    const selectedProducts = (watchLineItems || [])
      .map((item) => item.productName)
      .filter(Boolean)
      .map((name, index) => ({
        id: `selected-${index}`,
        name,
        unit: "",
        price: Number(watchLineItems[index]?.price) || 0,
      }));

    const productsByName = new Map<string, Product | (typeof selectedProducts)[number]>();
    [...products, ...selectedProducts].forEach((product) => {
      if (!productsByName.has(product.name)) {
        productsByName.set(product.name, product);
      }
    });

    return Array.from(productsByName.values());
  }, [products, watchLineItems]);

  const subtotal = watchLineItems.reduce((acc, item) => {
    return acc + (Number(item.quantity) || 0) * (Number(item.price) || 0);
  }, 0);

  const totalAmount = subtotal;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Customer Details */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-4 border-b border-border/50">
              <CardTitle className="text-lg">Customer Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Acme Corp" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="customerPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="+91 98765 43210" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Invoice Details */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-4 border-b border-border/50">
              <CardTitle className="text-lg">Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="invoiceDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Issue Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>

        {/* Line Items */}
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-4 border-b border-border/50 flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Line Items</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-primary border-primary/20 hover:bg-primary/5"
              onClick={() => append({ lineNumber: fields.length + 1, productName: "", quantity: 1, price: 0 })}
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Header row for large screens */}
              <div className="hidden md:grid grid-cols-12 gap-4 px-2 text-sm font-medium text-muted-foreground pb-2 border-b border-border">
                <div className="col-span-5">Product/Service</div>
                <div className="col-span-2 text-right">Quantity</div>
                <div className="col-span-2 text-right">Price</div>
                <div className="col-span-2 text-right">Amount</div>
                <div className="col-span-1"></div>
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start bg-muted/20 md:bg-transparent p-4 md:p-0 rounded-lg md:rounded-none">
                  <div className="col-span-1 md:col-span-5">
                    <FormField
                      control={form.control}
                      name={`lineItems.${index}.productName`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="md:hidden">Product/Service</FormLabel>
                          <FormControl>
                            <Select
                              value={field.value}
                              onValueChange={(value) => {
                                const product = productOptions.find((item) => item.name === value);
                                field.onChange(value);

                                if (product) {
                                  form.setValue(`lineItems.${index}.price`, product.price, {
                                    shouldDirty: true,
                                    shouldValidate: true,
                                  });
                                }
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select product/service" />
                              </SelectTrigger>
                              <SelectContent>
                                {productOptions.length === 0 ? (
                                  <div className="px-2 py-2 text-sm text-muted-foreground">
                                    Add products from the Products page first.
                                  </div>
                                ) : (
                                  productOptions.map((product) => (
                                    <SelectItem key={`${product.id}-${product.name}`} value={product.name}>
                                      {product.name}
                                      {product.unit ? ` (${product.unit})` : ""}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <FormField
                      control={form.control}
                      name={`lineItems.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="md:hidden">Qty</FormLabel>
                          <FormControl>
                            <Input type="number" min="0.001" step="any" className="md:text-right" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <FormField
                      control={form.control}
                      name={`lineItems.${index}.price`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="md:hidden">Price</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" step="0.01" className="md:text-right" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2 flex items-center md:justify-end h-10 mt-6 md:mt-0 font-medium">
                    <span className="md:hidden text-muted-foreground mr-2">Amount: </span>
                    {formatCurrency((Number(watchLineItems[index]?.quantity) || 0) * (Number(watchLineItems[index]?.price) || 0))}
                  </div>
                  <div className="col-span-1 md:col-span-1 flex items-center justify-end h-10 mt-2 md:mt-0">
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mt-8 pt-6 border-t border-border flex justify-end">
              <div className="w-full max-w-sm space-y-3 text-sm">
                <div className="flex justify-between text-lg font-bold pt-3 border-t border-border">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(totalAmount)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardContent className="pt-6">
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Thank you for your business!" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="submit" size="lg" disabled={isSubmitting} className="min-w-32 shadow-md">
            {isSubmitting ? "Saving..." : "Save Invoice"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
