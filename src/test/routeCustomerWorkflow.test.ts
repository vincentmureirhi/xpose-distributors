import { describe, expect, it } from "vitest";
import { buildRouteOrderNotes, createRouteCustomer } from "@/lib/routeCustomerWorkflow";

describe("routeCustomerWorkflow", () => {
  it("creates route customer records with trimmed values", () => {
    const customer = createRouteCustomer(
      {
        name: "  Kiosk A ",
        phone: " 0712345678 ",
        location: " Westlands ",
        notes: "  Pays weekly ",
      },
      new Date("2026-05-10T10:00:00.000Z")
    );

    expect(customer.id).toContain("route-");
    expect(customer.name).toBe("Kiosk A");
    expect(customer.phone).toBe("0712345678");
    expect(customer.location).toBe("Westlands");
    expect(customer.notes).toBe("Pays weekly");
    expect(customer.created_at).toBe("2026-05-10T10:00:00.000Z");
  });

  it("builds auditable route-customer order notes with rep context", () => {
    const notes = buildRouteOrderNotes({
      rep_name: "Jane Rep",
      rep_phone: "0700000000",
      rep_area: "Nairobi West",
      route_customer: {
        id: "route-1",
        name: "Shop 24",
        phone: "0711222333",
        location: "South B",
        notes: "Morning visit",
        created_at: "2026-05-01T08:00:00.000Z",
      },
      order_notes: "Deliver before 3pm",
      captured_at: new Date("2026-05-10T09:30:00.000Z"),
    });

    expect(notes).toContain("[ROUTE_CUSTOMER_ORDER]");
    expect(notes).toContain("route_customer_id=route-1");
    expect(notes).toContain("captured_by_rep=Jane Rep");
    expect(notes).toContain("captured_by_rep_area=Nairobi West");
    expect(notes).toContain("captured_at=2026-05-10T09:30:00.000Z");
    expect(notes).toContain("order_notes=Deliver before 3pm");
  });
});
