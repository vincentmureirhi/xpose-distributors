import type { PriceTier, Product } from "@/types/shop";

export function getPriceTiers(product: Product): PriceTier[] {
  if (product.price_tiers && product.price_tiers.length) {
    return product.price_tiers
      .map((tier, index) => {
        const minQty = Number(tier.min_qty || 0) || undefined;
        const maxQty = tier.max_qty != null ? Number(tier.max_qty) : null;
        const backendUnitPrice = tier.unit_price != null ? Number(tier.unit_price) : undefined;
        const price = Number(tier.price ?? backendUnitPrice ?? 0);

        if (!Number.isFinite(price) || price <= 0) return null;

        if (tier.unit && tier.price != null) {
          return {
            ...tier,
            price,
            qty_per_unit: Number(tier.qty_per_unit || 1),
            min_qty: minQty,
            max_qty: maxQty,
          };
        }

        const rangeLabel = minQty
          ? maxQty
            ? `${minQty}-${maxQty} pcs`
            : `${minQty}+ pcs`
          : `${index + 1} tier`;

        return {
          id: tier.id ?? `tier-${index}`,
          unit: rangeLabel,
          qty_per_unit: 1,
          price,
          min_qty: minQty,
          max_qty: maxQty,
          unit_price: backendUnitPrice,
          label: rangeLabel,
        };
      })
      .filter(Boolean) as PriceTier[];
  }

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
