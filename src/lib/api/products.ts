import { apiClient } from "./client";
import type { Product } from "@/types/shop";

export interface ProductPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ProductListResult {
  products: Product[];
  pagination: ProductPagination;
  meta?: Record<string, unknown>;
}

const DEFAULT_PAGINATION: ProductPagination = {
  page: 1,
  limit: 24,
  total: 0,
  totalPages: 1,
  hasNext: false,
  hasPrev: false,
};

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

function normalizeStockStatus(value: any) {
  const status = String(value || "").trim().toLowerCase();
  if (!status) return "";

  if (status === "limited_stock" || status === "low_stock" || status === "reorder_now") {
    return "limited_stock";
  }

  if (status === "out_of_stock" || status === "sold_out" || status === "unavailable") {
    return "out_of_stock";
  }

  if (status === "in_stock" || status === "healthy" || status === "available") {
    return "in_stock";
  }

  if (status === "unknown") return "unknown";

  return status;
}

export function normalizeProduct(raw: any): Product {
  const stock = readStockValue(raw);
  const minOrderQty = Math.max(1, Number(raw?.min_order_qty || raw?.minimum_order_qty || 1));
  const limitedThreshold = Math.max(minOrderQty, 10);
  const overrideStatus = normalizeStockStatus(raw?.stock_status_override);
  const apiStatus = normalizeStockStatus(raw?.stock_status);
  const stockStatus =
    overrideStatus ||
    apiStatus ||
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
    stock_status_override: overrideStatus || raw?.stock_status_override,
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

export async function listStorefrontProducts(params: Record<string, any> = {}): Promise<ProductListResult> {
  const { data } = await apiClient.get("/v1/storefront/products", { params });
  const rows = data?.data || [];
  const products = Array.isArray(rows)
    ? rows.map(normalizeProduct).filter((product: any) => product.is_active !== false)
    : [];

  return {
    products,
    pagination: {
      ...DEFAULT_PAGINATION,
      ...(data?.pagination || {}),
    },
    meta: data?.meta || {},
  };
}

export async function listFeaturedStorefrontProducts(limit = 16): Promise<Product[]> {
  const { data } = await apiClient.get("/v1/storefront/products/featured", {
    params: { limit },
  });
  const rows = data?.data || [];
  return Array.isArray(rows)
    ? rows.map(normalizeProduct).filter((product: any) => product.is_active !== false)
    : [];
}

export async function searchStorefrontProducts(q: string, limit = 12): Promise<Product[]> {
  const { data } = await apiClient.get("/v1/storefront/products/search", {
    params: { q, limit },
  });
  const rows = data?.data || [];
  return Array.isArray(rows)
    ? rows.map(normalizeProduct).filter((product: any) => product.is_active !== false)
    : [];
}

export async function getProductById(id: string | number): Promise<Product | null> {
  const { data } = await apiClient.get(`/v1/storefront/products/${id}`);
  const product = data?.data || data || null;
  return product ? normalizeProduct(product) : null;
}
