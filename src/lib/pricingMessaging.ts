import { formatPrice } from "@/context/CartContext";
import type { PricingEvaluation, PricingRuleType, Product } from "@/types/shop";

export const isRuleType = (ruleType?: PricingRuleType, expected?: PricingRuleType) =>
  !!ruleType && String(ruleType).toUpperCase() === String(expected).toUpperCase();

export const isRuleDrivenType = (ruleType?: PricingRuleType) => {
  const rule = String(ruleType || "").toUpperCase();
  return (
    rule === "SKU_THRESHOLD" ||
    rule === "GROUP_THRESHOLD" ||
    rule === "SKU_TIERED" ||
    rule === "GROUP_TIERED" ||
    rule === "TIERED"
  );
};

export const isWholesaleEligible = (ev?: Pick<PricingEvaluation, "is_wholesale_eligible" | "wholesale_eligible">) =>
  Boolean(ev?.is_wholesale_eligible ?? ev?.wholesale_eligible);

export function getProductPricingMessages(product: Product) {
  const retail = Number(product.retail_price ?? product.price ?? 0);
  const wholesale = Number(product.wholesale_price ?? 0);
  const threshold = Number(product.wholesale_threshold_qty ?? product.min_qty_wholesale ?? 0);
  const tiers = product.price_tiers || [];
  const ruleType = product.pricing_rule_type;
  const groupName = product.pricing_group_name;
  const flashPrice = Number(product.discounted_price || 0);

  if (flashPrice > 0 && retail > 0 && flashPrice < retail) {
    return {
      primary: `Flash price: ${formatPrice(flashPrice)} | Was ${formatPrice(retail)}`,
      secondary: product.flash_sale_end_date
        ? `Ends ${new Date(product.flash_sale_end_date).toLocaleString()}`
        : "Deal price",
    };
  }

  if (isRuleType(ruleType, "SKU_THRESHOLD")) {
    return {
      primary:
        wholesale > 0 && threshold > 0
          ? `Retail: ${formatPrice(retail)} | Wholesale: ${formatPrice(wholesale)} from ${threshold} pcs`
          : `Retail: ${formatPrice(retail)}`,
      secondary: threshold > 0 ? `Wholesale from ${threshold} pcs` : "Wholesale available",
    };
  }

  if (isRuleType(ruleType, "GROUP_THRESHOLD")) {
    return {
      primary:
        wholesale > 0 && threshold > 0
          ? `Retail: ${formatPrice(retail)} | Wholesale: ${formatPrice(wholesale)} from ${threshold} pcs`
          : `Retail: ${formatPrice(retail)}`,
      secondary:
        threshold > 0
          ? `${groupName ? `${groupName}: ` : ""}mix ${threshold}+ qualifying items`
          : "Mix-and-save pricing",
    };
  }

  if (isRuleType(ruleType, "SKU_TIERED") || isRuleType(ruleType, "TIERED")) {
    return {
      primary: `Retail from ${formatPrice(retail)}`,
      secondary: tiers.length > 1 ? "Quantity bands available" : "Quantity pricing",
    };
  }

  if (isRuleType(ruleType, "GROUP_TIERED")) {
    return {
      primary: `Retail from ${formatPrice(retail)}`,
      secondary: `${groupName ? `${groupName}: ` : ""}combined quantity bands`,
    };
  }

  if (retail > 0 && wholesale > 0 && wholesale < retail && threshold > 0) {
    return {
      primary: `Retail: ${formatPrice(retail)} | Wholesale: ${formatPrice(wholesale)} from ${threshold} pcs`,
      secondary: `Wholesale from ${threshold} pcs`,
    };
  }

  return {
    primary: retail > 0 ? `Retail: ${formatPrice(retail)}` : "Ask for price",
    secondary: undefined,
  };
}

export function getCartPricingMessage(ev: PricingEvaluation | undefined, quantity: number) {
  if (!ev) return null;

  const eligible = isWholesaleEligible(ev);
  const threshold = Number(ev.threshold_quantity || 0);
  const effectiveQty = Number(ev.effective_quantity || quantity || 0);
  const ruleType = String(ev.rule_type || "").toUpperCase();
  const group = ev.pricing_group_name;

  if (ev.flash_sale_id || String(ev.pricing_label || "").toLowerCase() === "flash sale") {
    if (ev.flash_sale_end_date) {
      return `Flash price until ${new Date(ev.flash_sale_end_date).toLocaleString()}`;
    }
    return "Flash price";
  }

  if (ruleType === "SKU_THRESHOLD") {
    if (eligible) return "Wholesale unlocked";
    if (threshold > quantity) return `Add ${threshold - quantity} more for wholesale`;
    return "Retail price";
  }

  if (ruleType === "GROUP_THRESHOLD") {
    if (eligible) return "Group wholesale unlocked";
    if (threshold > 0) {
      return `Group total: ${effectiveQty} / ${threshold}${group ? ` (${group})` : ""}`;
    }
    return "Group wholesale pending";
  }

  if (ruleType === "SKU_TIERED" || ruleType === "GROUP_TIERED" || ruleType === "TIERED") {
    return `Tier price${group ? ` (${group})` : ""}`;
  }

  return eligible ? "Wholesale price" : "Retail price";
}
