import type { PriceTier, Product } from "@/types/shop";

export function getPriceTiers(product: Product): PriceTier[] {
  if (product.price_tiers && product.price_tiers.length) return product.price_tiers;
  // Fallback: derive tiers from legacy retail/wholesale fields.
  // Backend pricing rules take precedence; these tiers are only used when no
  // price_tiers are returned by the API.
  const retail = Number(product.retail_price || product.price || 0);
  const wholesale = Number(product.wholesale_price || 0);
  const list: PriceTier[] = [{ unit: "piece", qty_per_unit: 1, price: retail, label: "Retail" }];
  if (wholesale > 0 && wholesale < retail) {
    list.push({ unit: "wholesale", qty_per_unit: 1, price: wholesale, label: "Bulk Discount" });
  }
  return list;
}

export const unitLabel = (t: PriceTier) =>
  t.label || `1 ${t.unit}${t.qty_per_unit && t.qty_per_unit > 1 ? ` (${t.qty_per_unit} pcs)` : ""}`;

/** Maps a backend pricing_rule_type to a customer-friendly display label. */
export function pricingTypeLabel(ruleType?: string | null): string {
  switch (ruleType) {
    case "FIXED_PRICE": return "Retail";
    case "BULK_DISCOUNT": return "Bulk Discount";
    case "GROUP_WHOLESALE": return "Group Wholesale";
    case "TIERED": return "Volume Pricing";
    default: return "";
  }
}
