export interface RouteCustomer {
  id: string;
  backend_customer_id?: string;
  name: string;
  phone: string;
  location: string;
  customer_location_id?: string;
  region_id?: string;
  region_name?: string;
  location_name?: string;
  sales_rep_id?: string;
  route_area?: string;
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
  const trimmedNotes = input.notes?.trim();
  const location = input.location.trim();
  return {
    id: `route-${ts}-${Math.random().toString(36).slice(2, 8)}`,
    name: input.name.trim(),
    phone: input.phone.trim(),
    location,
    notes: trimmedNotes ? trimmedNotes : undefined,
    created_at: now.toISOString(),
  };
}

export function getRouteCustomerBackendId(routeCustomer: RouteCustomer): string | undefined {
  if (routeCustomer.backend_customer_id) return routeCustomer.backend_customer_id;
  return routeCustomer.id.startsWith("route-") ? undefined : routeCustomer.id;
}

export function mergeRouteCustomers(primary: RouteCustomer[], fallback: RouteCustomer[]): RouteCustomer[] {
  const seen = new Set<string>();
  const merged: RouteCustomer[] = [];

  for (const customer of [...primary, ...fallback]) {
    const backendId = getRouteCustomerBackendId(customer);
    const phone = (customer.phone || "").toLowerCase();
    const name = (customer.name || "").toLowerCase();
    const location = (customer.location || "").toLowerCase();
    const identityKey = JSON.stringify([phone, name, location]);
    const keys = backendId ? [backendId, identityKey] : [identityKey];
    if (keys.some((key) => seen.has(key))) continue;
    keys.forEach((key) => seen.add(key));
    merged.push(customer);
  }

  return merged;
}

export function buildRouteOrderNotes(payload: RouteOrderNotePayload) {
  const repName = payload.rep_name.trim();
  const repPhone = payload.rep_phone?.trim();
  const repArea = payload.rep_area?.trim();
  const customerNotes = payload.route_customer.notes?.trim();
  const orderNotes = payload.order_notes?.trim();

  const lines = [
    `Route customer: ${payload.route_customer.name} (${payload.route_customer.phone})`,
    `Delivery area: ${payload.route_customer.location}`,
    repName ? `Captured by: ${repName}${repPhone ? ` (${repPhone})` : ""}` : "",
    repArea ? `Rep route: ${repArea}` : "",
    "Settlement: pay on delivery or approved route credit.",
  ];

  if (customerNotes) {
    lines.push(`Customer route notes: ${customerNotes}`);
  }

  if (orderNotes) {
    lines.push(`Order notes: ${orderNotes}`);
  }

  return lines.filter(Boolean).join("\n");
}
