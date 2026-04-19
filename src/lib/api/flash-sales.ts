import { apiClient, USE_MOCK } from "./client";
import type { Product } from "@/types/shop";

export interface FlashSaleData {
  id: number;
  name: string;
  discount_percentage?: number;
  start_date?: string;
  end_date?: string;
  products: Product[];
}

export async function getActiveFlashSales(): Promise<FlashSaleData[]> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 200));
    return [];
  }
  const { data } = await apiClient.get("/flash-sales/active");
  return data?.data || data || [];
}
