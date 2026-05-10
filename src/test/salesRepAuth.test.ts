import { describe, expect, it } from "vitest";
import { extractApiErrorMessage } from "@/lib/api/sales-rep-auth";
import { resolveSessionActor } from "@/lib/salesRepSession";
import type { SalesRepProfile } from "@/lib/api/sales-rep-auth";

describe("sales rep auth helpers", () => {
  it("extracts backend error fields in priority order", () => {
    const fromError = extractApiErrorMessage(
      { response: { data: { error: "Invalid credentials", message: "Fallback message" } } },
      "Default"
    );
    expect(fromError).toBe("Invalid credentials");

    const fromMessage = extractApiErrorMessage({ response: { data: { message: "Session expired" } } }, "Default");
    expect(fromMessage).toBe("Session expired");

    const fallback = extractApiErrorMessage({}, "Default");
    expect(fallback).toBe("Default");
  });

  it("distinguishes sales rep, customer checkout, and unauthenticated visitor actors", () => {
    const rep = {
      id: "1",
      full_name: "Rep One",
      phone: null,
      email: null,
      username: "rep",
      route_area: null,
      must_change_password: false,
      is_active: true,
      role: "sales_rep",
    } satisfies SalesRepProfile;

    expect(resolveSessionActor(rep, "/products")).toBe("sales_rep");
    expect(resolveSessionActor(null, "/checkout")).toBe("normal_customer");
    expect(resolveSessionActor(null, "/products")).toBe("unauthenticated_visitor");
  });
});
