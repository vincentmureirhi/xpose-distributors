import { apiClient } from "./client";
import { normalizeProduct } from "./products";
import type { Product } from "@/types/shop";

export interface FlashSaleData {
  id: number;
  name: string;
  description?: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  product_count: number;
  sale_status?: "active" | "upcoming" | "ended";
  products: Product[];
}

export interface FlashSaleSummary extends Omit<FlashSaleData, "products"> {
  products: Array<{ id: number | string; discounted_price?: number | null }>;
}

export interface FlashSaleFeed {
  active: FlashSaleData[];
  upcoming: FlashSaleData[];
}

const ENABLE_PUBLIC_FLASH_FEED = import.meta.env.VITE_FLASH_SALE_PUBLIC_FEED === "true";

function freshFlashSaleParams() {
  return { _fresh: Date.now().toString() };
}

function normalizeSaleRows(rows: unknown): FlashSaleData[] {
  if (!Array.isArray(rows)) return [];
  return (rows as FlashSaleData[]).map((sale) => ({
    ...sale,
    products: Array.isArray(sale.products) ? sale.products.map(normalizeProduct) : [],
  }));
}

export async function getActiveFlashSaleSummary(): Promise<FlashSaleSummary[]> {
  try {
    const { data } = await apiClient.get("/flash-sales/active-summary", { params: freshFlashSaleParams() });
    return (data?.data ?? data ?? []) as FlashSaleSummary[];
  } catch {
    return [];
  }
}

export async function getActiveFlashSales(): Promise<FlashSaleData[]> {
  try {
    const { data } = await apiClient.get("/flash-sales/active", { params: freshFlashSaleParams() });
    return normalizeSaleRows(data?.data ?? data ?? []);
  } catch {
    return [];
  }
}

export async function getFlashSaleFeed(): Promise<FlashSaleFeed> {
  const active = await getActiveFlashSales();

  if (!ENABLE_PUBLIC_FLASH_FEED) {
    return { active, upcoming: [] };
  }

  try {
    const { data } = await apiClient.get("/flash-sales/public", { params: freshFlashSaleParams() });
    const payload = data?.data ?? data ?? {};
    return {
      active: normalizeSaleRows(payload.active),
      upcoming: normalizeSaleRows(payload.upcoming),
    };
  } catch {
    return { active, upcoming: [] };
  }
}
