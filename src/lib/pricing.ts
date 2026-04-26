import type { PriceTier, Product } from "@/types/shop";

export function getPriceTiers(product: Product): PriceTier[] {
  if (product.price_tiers && product.price_tiers.length) return product.price_tiers;
  // Fallback: derive tiers from retail/wholesale
  const retail = Number(product.retail_price || product.price || 0);
  const wholesale = Number(product.wholesale_price || 0);
  const list: PriceTier[] = [{ unit: "piece", qty_per_unit: 1, price: retail }];
  if (wholesale > 0 && wholesale < retail) {
    const minQty = product.min_qty_wholesale ? Number(product.min_qty_wholesale) : undefined;
    list.push({ unit: "wholesale", qty_per_unit: 1, price: wholesale, ...(minQty ? { min_qty: minQty } : {}) });
  }
  return list;
}

export const unitLabel = (t: PriceTier) =>
  t.label || `1 ${t.unit}${t.qty_per_unit && t.qty_per_unit > 1 ? ` (${t.qty_per_unit} pcs)` : ""}`;
