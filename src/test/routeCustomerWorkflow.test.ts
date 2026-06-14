import { describe, expect, it } from "vitest";
import { buildRouteOrderNotes, createRouteCustomer, getRouteCustomerBackendId, mergeRouteCustomers } from "@/lib/routeCustomerWorkflow";

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

  it("builds readable route-customer order notes with rep context", () => {
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

    expect(notes).not.toContain("[ROUTE_CUSTOMER_ORDER]");
    expect(notes).toContain("Route customer: Shop 24 (0711222333)");
    expect(notes).toContain("Delivery area: South B");
    expect(notes).toContain("Captured by: Jane Rep (0700000000)");
    expect(notes).toContain("Rep route: Nairobi West");
    expect(notes).toContain("Order notes: Deliver before 3pm");
  });

  it("prefers backend customer ids for route order linkage", () => {
    expect(
      getRouteCustomerBackendId({
        id: "route-123",
        backend_customer_id: "44",
        name: "Shop A",
        phone: "0711111111",
        location: "Westlands",
        created_at: "2026-05-01T08:00:00.000Z",
      })
    ).toBe("44");

    expect(
      getRouteCustomerBackendId({
        id: "17",
        name: "Shop B",
        phone: "0722222222",
        location: "Kilimani",
        created_at: "2026-05-01T08:00:00.000Z",
      })
    ).toBe("17");

    expect(
      getRouteCustomerBackendId({
        id: "route-local-1",
        name: "Shop C",
        phone: "0733333333",
        location: "Ngong Road",
        created_at: "2026-05-01T08:00:00.000Z",
      })
    ).toBeUndefined();
  });

  it("merges backend and fallback route customers without duplicates", () => {
    const merged = mergeRouteCustomers(
      [
        {
          id: "55",
          backend_customer_id: "55",
          name: "Shop 55",
          phone: "0700000055",
          location: "Mombasa",
          created_at: "2026-05-01T08:00:00.000Z",
        },
      ],
      [
        {
          id: "route-local-55",
          name: "Shop 55",
          phone: "0700000055",
          location: "Mombasa",
          created_at: "2026-05-01T08:00:00.000Z",
        },
        {
          id: "route-local-99",
          name: "Shop 99",
          phone: "0700000099",
          location: "Kisumu",
          created_at: "2026-05-01T08:00:00.000Z",
        },
      ]
    );

    expect(merged).toHaveLength(2);
    expect(merged[0].id).toBe("55");
    expect(merged[1].id).toBe("route-local-99");
  });
});
