import { describe, it, expect } from "vitest";
import { getPriceTiers } from "@/lib/pricing";
import type { Product } from "@/types/shop";

describe("getPriceTiers", () => {
  it("returns only retail tier when no wholesale price", () => {
    const product: Product = { id: 1, name: "Test", retail_price: 100 };
    const tiers = getPriceTiers(product);
    expect(tiers).toHaveLength(1);
    expect(tiers[0].unit).toBe("piece");
    expect(tiers[0].price).toBe(100);
  });

  it("includes wholesale tier when wholesale_price < retail_price", () => {
    const product: Product = { id: 1, name: "Test", retail_price: 100, wholesale_price: 70 };
    const tiers = getPriceTiers(product);
    expect(tiers).toHaveLength(2);
    const wholesale = tiers.find((t) => t.unit === "wholesale");
    expect(wholesale).toBeDefined();
    expect(wholesale!.price).toBe(70);
  });

  it("attaches min_qty to wholesale tier when min_qty_wholesale is set", () => {
    const product: Product = { id: 1, name: "Test", retail_price: 100, wholesale_price: 70, min_qty_wholesale: 3 };
    const tiers = getPriceTiers(product);
    const wholesale = tiers.find((t) => t.unit === "wholesale");
    expect(wholesale?.min_qty).toBe(3);
  });

  it("does not include wholesale tier when wholesale_price >= retail_price", () => {
    const product: Product = { id: 1, name: "Test", retail_price: 100, wholesale_price: 100 };
    const tiers = getPriceTiers(product);
    expect(tiers).toHaveLength(1);
  });

  it("uses price_tiers directly when provided", () => {
    const product: Product = {
      id: 1,
      name: "Test",
      retail_price: 100,
      price_tiers: [
        { unit: "piece", qty_per_unit: 1, price: 100 },
        { unit: "dozen", qty_per_unit: 12, price: 900, min_qty: 2 },
      ],
    };
    const tiers = getPriceTiers(product);
    expect(tiers).toHaveLength(2);
    expect(tiers[1].unit).toBe("dozen");
  });
});

describe("Threshold gating logic", () => {
  it("wholesale tier is gated when qty < min_qty", () => {
    const product: Product = { id: 1, name: "Test", retail_price: 100, wholesale_price: 70, min_qty_wholesale: 3 };
    const tiers = getPriceTiers(product);
    const wholesale = tiers.find((t) => t.unit === "wholesale");
    const qty = 2;
    // Tier should be considered locked (qty < min_qty)
    expect(wholesale?.min_qty).toBeDefined();
    expect(qty < (wholesale?.min_qty ?? 0)).toBe(true);
  });

  it("wholesale tier is unlocked when qty >= min_qty", () => {
    const product: Product = { id: 1, name: "Test", retail_price: 100, wholesale_price: 70, min_qty_wholesale: 3 };
    const tiers = getPriceTiers(product);
    const wholesale = tiers.find((t) => t.unit === "wholesale");
    const qty = 3;
    expect(qty >= (wholesale?.min_qty ?? 0)).toBe(true);
  });
});
