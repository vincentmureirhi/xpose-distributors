import { apiClient } from "./client";
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
  const { data } = await apiClient.get("/flash-sales/active");
  return data?.data || data || [];
}
