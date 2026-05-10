import { formatPrice } from "@/context/CartContext";
import type { PricingEvaluation, PricingRuleType, Product } from "@/types/shop";

const isRule = (ruleType?: PricingRuleType, expected?: PricingRuleType) =>
  String(ruleType || "").toUpperCase() === String(expected || "").toUpperCase();

const isWholesaleEligible = (ev?: PricingEvaluation) =>
  Boolean(ev?.is_wholesale_eligible ?? ev?.wholesale_eligible);

export function getProductPricingMessages(product: Product) {
  const retail = Number(product.retail_price || product.price || 0);
  const wholesale = Number(product.wholesale_price || 0);
  const threshold = Number(product.wholesale_threshold_qty || product.min_qty_wholesale || 0);
  const tiers = product.price_tiers || [];
  const ruleType = product.pricing_rule_type;
  const groupName = product.pricing_group_name;

  if (isRule(ruleType, "SKU_THRESHOLD")) {
    return {
      primary:
        wholesale > 0 && threshold > 0
          ? `Retail: ${formatPrice(retail)} | Wholesale: ${formatPrice(wholesale)} from ${threshold} pcs`
          : `Retail: ${formatPrice(retail)}`,
      secondary:
        threshold > 0
          ? `Buy ${threshold} or more of this item to qualify for wholesale price`
          : "Wholesale price applies once quantity requirement is met",
    };
  }

  if (isRule(ruleType, "GROUP_THRESHOLD")) {
    return {
      primary:
        wholesale > 0 && threshold > 0
          ? `Retail: ${formatPrice(retail)} | Wholesale: ${formatPrice(wholesale)} from ${threshold} pcs`
          : `Retail: ${formatPrice(retail)}`,
      secondary:
        threshold > 0
          ? `Mix products${groupName ? ` in ${groupName}` : ""} to qualify once total reaches ${threshold}`
          : "Mix qualifying products to unlock wholesale pricing",
    };
  }

  if (isRule(ruleType, "SKU_TIERED") || isRule(ruleType, "TIERED")) {
    return {
      primary: `Retail from ${formatPrice(retail)}`,
      secondary: tiers.length > 1 ? "Price depends on quantity band" : "Quantity pricing applies",
    };
  }

  if (isRule(ruleType, "GROUP_TIERED")) {
    return {
      primary: `Retail from ${formatPrice(retail)}`,
      secondary: `Tiered group pricing applies when combined quantity${groupName ? ` in ${groupName}` : ""} increases`,
    };
  }

  if (retail > 0 && wholesale > 0 && wholesale < retail && threshold > 0) {
    return {
      primary: `Retail: ${formatPrice(retail)} | Wholesale: ${formatPrice(wholesale)} from ${threshold} pcs`,
      secondary: `Buy ${threshold} or more of this item to qualify for wholesale price`,
    };
  }

  return {
    primary: retail > 0 ? `Retail: ${formatPrice(retail)}` : "Price available at checkout",
    secondary: null,
  };
}

export function getCartPricingMessage(ev: PricingEvaluation | undefined, quantity: number) {
  if (!ev) return null;

  const eligible = isWholesaleEligible(ev);
  const threshold = Number(ev.threshold_quantity || 0);
  const effectiveQty = Number(ev.effective_quantity || quantity || 0);
  const ruleType = String(ev.rule_type || "").toUpperCase();
  const group = ev.pricing_group_name;

  if (ruleType === "SKU_THRESHOLD") {
    if (eligible) return "Wholesale unlocked";
    if (threshold > quantity) return `Add ${threshold - quantity} more to unlock wholesale`;
    return "Retail price applied";
  }

  if (ruleType === "GROUP_THRESHOLD") {
    if (eligible) return "Group threshold reached — wholesale unlocked";
    if (threshold > 0) {
      return `Group total: ${effectiveQty} / ${threshold} to qualify${group ? ` (${group})` : ""}`;
    }
    return "Group threshold not yet reached";
  }

  if (ruleType === "SKU_TIERED" || ruleType === "GROUP_TIERED" || ruleType === "TIERED") {
    return `Tiered price applied${group ? ` (${group})` : ""}`;
  }

  return eligible ? "Wholesale price applied" : "Retail price applied";
}
