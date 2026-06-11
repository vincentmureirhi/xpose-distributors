import { apiClient } from "./client";
import type { Product } from "@/types/shop";

const STOCK_FIELD_CANDIDATES = [
  "current_stock",
  "stock",
  "inventory_stock",
  "available_stock",
  "quantity_available",
  "qty_available",
  "stock_quantity",
];

function readStockValue(raw: any) {
  for (const key of STOCK_FIELD_CANDIDATES) {
    const value = raw?.[key];
    if (value === undefined || value === null || value === "") continue;

    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return { known: true, value: parsed };
    }
  }

  return { known: false, value: undefined };
}

export function normalizeProduct(raw: any): Product {
  const stock = readStockValue(raw);
  const minOrderQty = Math.max(1, Number(raw?.min_order_qty || raw?.minimum_order_qty || 1));
  const limitedThreshold = Math.max(minOrderQty, 10);
  const stockStatus =
    raw?.stock_status ||
    raw?.stock_status_override ||
    (!stock.known
      ? "unknown"
      : stock.value! <= 0
        ? "out_of_stock"
        : stock.value! <= limitedThreshold
          ? "limited_stock"
          : "in_stock");

  const product: Product = {
    ...raw,
    selling_unit_label:
      raw?.selling_unit_label ||
      raw?.selling_unit ||
      raw?.unit_label ||
      raw?.order_unit_label ||
      "piece",
    stock_status: stockStatus,
  };

  if (stock.known) {
    product.stock = stock.value;
    product.current_stock = stock.value;
  }

  return product;
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
