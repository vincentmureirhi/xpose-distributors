import { describe, expect, it } from "vitest";
import { getSalesRepLocationQuality } from "@/lib/salesRepLocationQuality";

describe("sales rep location quality", () => {
  it("treats a 300m reading as usable but approximate", () => {
    expect(getSalesRepLocationQuality(300).label).toBe("Approximate");
  });

  it("keeps precise and very coarse readings visibly distinct", () => {
    expect(getSalesRepLocationQuality(25).label).toBe("Precise");
    expect(getSalesRepLocationQuality(2500).label).toBe("Very approximate");
  });
});
