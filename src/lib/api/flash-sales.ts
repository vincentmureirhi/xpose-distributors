import { apiClient } from "./client";
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

export interface FlashSaleFeed {
  active: FlashSaleData[];
  upcoming: FlashSaleData[];
}

const ENABLE_PUBLIC_FLASH_FEED = import.meta.env.VITE_FLASH_SALE_PUBLIC_FEED === "true";

function normalizeSaleRows(rows: unknown): FlashSaleData[] {
  if (!Array.isArray(rows)) return [];
  return (rows as FlashSaleData[]).map((sale) => ({
    ...sale,
    products: Array.isArray(sale.products) ? sale.products : [],
  }));
}

export async function getActiveFlashSales(): Promise<FlashSaleData[]> {
  try {
    const { data } = await apiClient.get("/flash-sales/active");
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
    const { data } = await apiClient.get("/flash-sales/public");
    const payload = data?.data ?? data ?? {};
    return {
      active: normalizeSaleRows(payload.active),
      upcoming: normalizeSaleRows(payload.upcoming),
    };
  } catch {
    const active = await getActiveFlashSales();
    return { active, upcoming: [] };
  }
}