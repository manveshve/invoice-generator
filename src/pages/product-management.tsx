
import React, { useEffect, useState } from "react";

type Product = {
  id: number;
  name: string;
  unit: string;
  price: number;
};

export default function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("products");
    if (saved) {
      setProducts(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("products", JSON.stringify(products));
  }, [products]);

  const addProduct = () => {
    const name = prompt("Enter product name");
    if (!name) return;

    const unit = prompt("Enter unit (KG/Piece)", "KG") || "KG";
    const price = Number(prompt("Enter price", "0"));

    setProducts([
      ...products,
      {
        id: Date.now(),
        name,
        unit,
        price,
      },
    ]);
  };

  const editProduct = (id: number) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;

    const name = prompt("Edit product name", product.name) || product.name;
    const unit = prompt("Edit unit", product.unit) || product.unit;
    const price = Number(prompt("Edit price", String(product.price)));

    setProducts(
      products.map((p) =>
        p.id === id ? { ...p, name, unit, price } : p
      )
    );
  };

  const deleteProduct = (id: number) => {
    setProducts(products.filter((p) => p.id !== id));
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>Product Management</h1>

      <button
        onClick={addProduct}
        style={{
          padding: 10,
          marginBottom: 20,
          borderRadius: 8,
          cursor: "pointer",
        }}
      >
        Add Product
      </button>

      <div style={{ display: "grid", gap: 12 }}>
        {products.map((product) => (
          <div
            key={product.id}
            style={{
              border: "1px solid #ddd",
              padding: 16,
              borderRadius: 12,
            }}
          >
            <h3>{product.name}</h3>
            <p>
              ₹{product.price} / {product.unit}
            </p>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => editProduct(product.id)}>
                Edit
              </button>

              <button onClick={() => deleteProduct(product.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
