import { describe, expect, it } from "vitest";
import { getCartPricingMessage, getProductPricingMessages } from "@/lib/pricingMessaging";
import type { PricingEvaluation, Product } from "@/types/shop";

describe("getProductPricingMessages", () => {
  it("describes same-product threshold wholesale", () => {
    const product: Product = {
      id: 1,
      name: "AMARA",
      retail_price: 121,
      wholesale_price: 109,
      pricing_rule_type: "SKU_THRESHOLD",
      wholesale_threshold_qty: 3,
    };

    const msg = getProductPricingMessages(product);
    expect(msg.primary).toContain("Wholesale");
    expect(msg.secondary).toContain("Buy 3");
  });

  it("describes group threshold mix messaging", () => {
    const product: Product = {
      id: 1,
      name: "Group Product",
      retail_price: 300,
      wholesale_price: 250,
      pricing_rule_type: "GROUP_THRESHOLD",
      wholesale_threshold_qty: 6,
      pricing_group_name: "Drinks",
    };

    const msg = getProductPricingMessages(product);
    expect(msg.secondary).toContain("Mix products");
    expect(msg.secondary).toContain("6");
  });

  it("describes group tiered pricing", () => {
    const product: Product = {
      id: 1,
      name: "Tiered Group Product",
      retail_price: 300,
      pricing_rule_type: "GROUP_TIERED",
      pricing_group_name: "Soaps",
    };

    const msg = getProductPricingMessages(product);
    expect(msg.secondary).toContain("Tiered group pricing");
  });
});

describe("getCartPricingMessage", () => {
  it("shows remaining quantity for SKU threshold", () => {
    const ev: PricingEvaluation = {
      product_id: 1,
      quantity: 2,
      unit_price: 121,
      line_total: 242,
      wholesale_eligible: false,
      threshold_quantity: 3,
      effective_quantity: 2,
      rule_type: "SKU_THRESHOLD",
      pricing_label: "Retail",
    };

    expect(getCartPricingMessage(ev, 2)).toContain("Add 1 more");
  });

  it("shows group progress for GROUP_THRESHOLD", () => {
    const ev: PricingEvaluation = {
      product_id: 1,
      quantity: 2,
      unit_price: 121,
      line_total: 242,
      wholesale_eligible: false,
      threshold_quantity: 6,
      effective_quantity: 4,
      rule_type: "GROUP_THRESHOLD",
      pricing_group_name: "Drinks",
      pricing_label: "Retail",
    };

    expect(getCartPricingMessage(ev, 2)).toContain("Group total: 4 / 6");
  });

  it("shows tiered message for tiered rules", () => {
    const ev: PricingEvaluation = {
      product_id: 1,
      quantity: 8,
      unit_price: 99,
      line_total: 792,
      wholesale_eligible: true,
      threshold_quantity: null,
      effective_quantity: 8,
      rule_type: "SKU_TIERED",
      pricing_label: "Tier 2",
    };

    expect(getCartPricingMessage(ev, 8)).toContain("Tiered price applied");
  });
});
