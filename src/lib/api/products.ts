import { apiClient } from "./client";
import type { Product } from "@/types/shop";

function normalizeProduct(raw: any): Product {
  const currentStock = Number(raw?.current_stock ?? raw?.stock ?? 0);
  return {
    ...raw,
    stock: Number.isFinite(currentStock) ? currentStock : 0,
    current_stock: Number.isFinite(currentStock) ? currentStock : 0,
    selling_unit_label:
      raw?.selling_unit_label ||
      raw?.selling_unit ||
      raw?.unit_label ||
      raw?.order_unit_label ||
      "piece",
    stock_status:
      raw?.stock_status ||
      (Number.isFinite(currentStock) && currentStock <= 0 ? "out_of_stock" : "in_stock"),
  };
}

export async function listProducts(params: Record<string, any> = {}): Promise<Product[]> {
  const { data } = await apiClient.get("/products", { params });
  const rows = data?.data || data?.products || data || [];
  return Array.isArray(rows)
    ? rows.map(normalizeProduct).filter((product: any) => product.is_active !== false)
    : [];
}

export async function getProductById(id: string | number): Promise<Product | null> {
  const { data } = await apiClient.get(`/products/${id}`);
  const product = data?.data || data || null;
  return product ? normalizeProduct(product) : null;
}
