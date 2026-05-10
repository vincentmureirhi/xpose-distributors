export interface RouteCustomer {
  id: string;
  name: string;
  phone: string;
  location: string;
  notes?: string;
  created_at: string;
}

export interface RouteCustomerInput {
  name: string;
  phone: string;
  location: string;
  notes?: string;
}

interface RouteOrderNotePayload {
  rep_name: string;
  rep_phone?: string;
  rep_area?: string;
  route_customer: RouteCustomer;
  order_notes?: string;
  captured_at?: Date;
}

const ROUTE_CUSTOMERS_KEY = "salesRepRouteCustomers";

export function getStoredRouteCustomers(storage: Storage = window.localStorage): RouteCustomer[] {
  try {
    const raw = storage.getItem(ROUTE_CUSTOMERS_KEY);
    const parsed = raw ? (JSON.parse(raw) as RouteCustomer[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveRouteCustomers(customers: RouteCustomer[], storage: Storage = window.localStorage) {
  storage.setItem(ROUTE_CUSTOMERS_KEY, JSON.stringify(customers));
}

export function createRouteCustomer(input: RouteCustomerInput, now = new Date()): RouteCustomer {
  const ts = now.getTime();
  return {
    id: `route-${ts}-${Math.random().toString(36).slice(2, 8)}`,
    name: input.name.trim(),
    phone: input.phone.trim(),
    location: input.location.trim(),
    notes: input.notes?.trim() || undefined,
    created_at: now.toISOString(),
  };
}

export function buildRouteOrderNotes(payload: RouteOrderNotePayload) {
  const capturedAt = (payload.captured_at || new Date()).toISOString();
  const lines = [
    "[ROUTE_CUSTOMER_ORDER]",
    `route_customer_id=${payload.route_customer.id}`,
    `route_customer_name=${payload.route_customer.name}`,
    `route_customer_phone=${payload.route_customer.phone}`,
    `route_customer_location=${payload.route_customer.location}`,
    `captured_by_rep=${payload.rep_name.trim()}`,
    `captured_by_rep_phone=${payload.rep_phone?.trim() || "-"}`,
    `captured_by_rep_area=${payload.rep_area?.trim() || "-"}`,
    `captured_at=${capturedAt}`,
  ];

  if (payload.route_customer.notes) {
    lines.push(`route_customer_notes=${payload.route_customer.notes}`);
  }

  if (payload.order_notes?.trim()) {
    lines.push(`order_notes=${payload.order_notes.trim()}`);
  }

  return lines.join("\n");
}
