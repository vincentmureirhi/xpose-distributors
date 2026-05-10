import { apiClient } from "./client";
import type { PricingEvaluation } from "@/types/shop";

export async function evaluatePricing(
  items: { product_id: string | number; quantity: number }[]
): Promise<PricingEvaluation[]> {
  const { data } = await apiClient.post("/pricing/evaluate", { items });
  return data?.data || data || [];
}
