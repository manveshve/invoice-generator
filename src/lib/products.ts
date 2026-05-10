export type Product = {
  id: number;
  name: string;
  unit: string;
  price: number;
};

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

async function migrateLegacyProductsIfNeeded(products: Product[]) {
  if (products.length > 0 || typeof window === "undefined") return products;

  const raw = window.localStorage.getItem("products");
  if (!raw) return products;

  try {
    const legacyProducts = JSON.parse(raw) as Product[];
    if (!Array.isArray(legacyProducts) || legacyProducts.length === 0) {
      return products;
    }

    await Promise.all(
      legacyProducts.map((product) =>
        createProduct({
          name: product.name,
          unit: product.unit,
          price: product.price,
        }),
      ),
    );

    return request<Product[]>("/api/products");
  } catch {
    return products;
  }
}

export async function listProducts() {
  const products = await request<Product[]>("/api/products");
  return migrateLegacyProductsIfNeeded(products);
}

export function createProduct(data: Omit<Product, "id">) {
  return request<Product>("/api/products", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateProduct(id: number, data: Omit<Product, "id">) {
  return request<Product>(`/api/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteProductById(id: number) {
  return request<{ id: number }>(`/api/products/${id}`, {
    method: "DELETE",
  });
}
