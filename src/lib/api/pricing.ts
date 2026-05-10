import { apiClient } from "./client";
import type { PricingEvaluation } from "@/types/shop";

export async function evaluatePricing(
  items: { product_id: string | number; quantity: number }[]
): Promise<PricingEvaluation[]> {
  const { data } = await apiClient.post("/pricing/evaluate", { items });
  const rows = data?.data || data || [];
  return Array.isArray(rows)
    ? rows.map((row) => ({
        ...row,
        wholesale_eligible: row.wholesale_eligible ?? row.is_wholesale_eligible,
      }))
    : [];
}
