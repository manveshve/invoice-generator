import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/format";
import { createProduct, deleteProductById, listProducts, type Product, updateProduct } from "@/lib/products";
import { Check, FileEdit, Package, PlusCircle, Trash2, X } from "lucide-react";

type ProductForm = {
  name: string;
  unit: string;
  price: string;
};

export default function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const [form, setForm] = useState<ProductForm>({ name: "", unit: "KG", price: "0" });
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const refreshProducts = async () => {
      try {
        setProducts(await listProducts());
      } finally {
        setIsLoading(false);
      }
    };

    void refreshProducts();
    window.addEventListener("focus", refreshProducts);

    return () => {
      window.removeEventListener("focus", refreshProducts);
    };
  }, []);

  const beginAddProduct = () => {
    setEditingId("new");
    setForm({ name: "", unit: "KG", price: "0" });
    setFormError("");
  };

  const beginEditProduct = (product: Product) => {
    setEditingId(product.id);
    setForm({ name: product.name, unit: product.unit, price: String(product.price) });
    setFormError("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ name: "", unit: "KG", price: "0" });
    setFormError("");
  };

  const saveProduct = async () => {
    const name = form.name.trim();
    const unit = form.unit.trim();
    const price = Number(form.price);

    if (!name) {
      setFormError("Product name is required.");
      return;
    }

    if (!unit) {
      setFormError("Unit is required.");
      return;
    }

    if (Number.isNaN(price) || price < 0) {
      setFormError("Price must be 0 or greater.");
      return;
    }

    if (editingId === "new") {
      const product = await createProduct({ name, unit, price });
      setProducts([...products, product]);
    } else if (editingId !== null) {
      const updatedProduct = await updateProduct(editingId, { name, unit, price });
      setProducts(products.map((product) => (product.id === editingId ? updatedProduct : product)));
    }

    cancelEdit();
  };

  const deleteProduct = async (id: number) => {
    await deleteProductById(id);
    setProducts(products.filter((p) => p.id !== id));
    if (editingId === id) {
      cancelEdit();
    }
  };

  const renderEditRow = (key: string) => (
    <tr key={key} className="bg-muted/20">
      <td className="px-6 py-4 align-top">
        <Input
          autoFocus
          placeholder="Product or service name"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
        />
        {formError && <p className="mt-2 text-xs text-destructive">{formError}</p>}
      </td>
      <td className="px-6 py-4 align-top">
        <Input
          placeholder="KG/Piece"
          value={form.unit}
          onChange={(event) => setForm({ ...form, unit: event.target.value })}
        />
      </td>
      <td className="px-6 py-4 align-top">
        <Input
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          value={form.price}
          onChange={(event) => setForm({ ...form, price: event.target.value })}
        />
      </td>
      <td className="px-6 py-4 text-right align-top">
        <div className="flex justify-end gap-2">
          <Button size="sm" onClick={saveProduct} className="gap-2">
            <Check className="h-4 w-4" />
            Save
          </Button>
          <Button size="sm" variant="outline" onClick={cancelEdit} className="gap-2">
            <X className="h-4 w-4" />
            Cancel
          </Button>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Products</h1>
          <p className="text-muted-foreground mt-1">Manage products and services used in invoices.</p>
        </div>
        <Button onClick={beginAddProduct} className="flex items-center gap-2">
          <PlusCircle className="w-4 h-4" />
          Add Product
        </Button>
      </div>

      <Card className="overflow-hidden border-border shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground bg-muted/50 border-b border-border uppercase">
              <tr>
                <th className="px-6 py-4 font-medium">Product/Service</th>
                <th className="px-6 py-4 font-medium">Unit</th>
                <th className="px-6 py-4 font-medium">Price</th>
                <th className="px-6 py-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {editingId === "new" && renderEditRow("new-product")}
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground bg-card">
                    Loading products...
                  </td>
                </tr>
              ) : products.length === 0 && editingId !== "new" ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground bg-card">
                    <div className="flex flex-col items-center justify-center">
                      <Package className="w-8 h-8 text-muted-foreground mb-3 opacity-50" />
                      <p className="text-base font-medium text-foreground">No products found</p>
                      <p className="text-sm mt-1">Add products to use them in invoice line items.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  editingId === product.id ? (
                    renderEditRow(`edit-product-${product.id}`)
                  ) : (
                    <tr key={product.id} className="bg-card hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">{product.name}</td>
                      <td className="px-6 py-4 text-muted-foreground">{product.unit}</td>
                      <td className="px-6 py-4 font-medium text-foreground">{formatCurrency(product.price)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => beginEditProduct(product)}
                            className="gap-2"
                          >
                            <FileEdit className="h-4 w-4" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => void deleteProduct(product.id)}
                            className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
