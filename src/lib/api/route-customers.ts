import { apiClient } from "./client";
import type { RouteCustomer } from "@/lib/routeCustomerWorkflow";

interface BackendRouteCustomer {
  id?: string | number;
  customer_id?: string | number;
  customer_name?: string;
  name?: string;
  customer_phone?: string;
  phone?: string;
  route_area?: string;
  location?: string;
  route_notes?: string;
  notes?: string;
  customer_location_id?: string | number;
  sales_rep_id?: string | number;
  created_at?: string;
}

export interface UpsertRouteCustomerPayload {
  customer_id?: string;
  customer_name: string;
  customer_phone: string;
  route_area: string;
  route_notes?: string;
  sales_rep_id?: string;
  customer_location_id?: string;
}

function normalizeRouteCustomer(input: BackendRouteCustomer): RouteCustomer | null {
  const id = input.customer_id ?? input.id;
  const name = (input.customer_name ?? input.name ?? "").trim();
  const phone = (input.customer_phone ?? input.phone ?? "").trim();
  const routeArea = (input.route_area ?? input.location ?? "").trim();
  const notes = (input.route_notes ?? input.notes ?? "").trim();

  if (!id || !name || !phone) return null;

  return {
    id: String(id),
    backend_customer_id: String(id),
    name,
    phone,
    location: routeArea,
    route_area: routeArea,
    notes: notes || undefined,
    customer_location_id: input.customer_location_id ? String(input.customer_location_id) : undefined,
    sales_rep_id: input.sales_rep_id ? String(input.sales_rep_id) : undefined,
    created_at: input.created_at || new Date().toISOString(),
  };
}

function extractRouteCustomerRows(payload: unknown): BackendRouteCustomer[] {
  if (!payload || typeof payload !== "object") return [];
  const root = payload as Record<string, unknown>;
  const data = root.data;

  if (Array.isArray(data)) return data as BackendRouteCustomer[];
  if (Array.isArray(root.customers)) return root.customers as BackendRouteCustomer[];
  if (data && typeof data === "object") {
    const dataObj = data as Record<string, unknown>;
    if (Array.isArray(dataObj.customers)) return dataObj.customers as BackendRouteCustomer[];
  }

  return [];
}

export async function listRouteCustomers(sales_rep_id?: string): Promise<RouteCustomer[]> {
  const toCustomers = (payload: unknown) => {
    const rows = extractRouteCustomerRows(payload);
    const normalized = rows.map(normalizeRouteCustomer);
    return normalized.filter((customer): customer is RouteCustomer => !!customer);
  };
  const params = sales_rep_id ? { customer_type: "route", sales_rep_id } : { customer_type: "route" };
  const fallbackParams = sales_rep_id ? { sales_rep_id } : undefined;

  try {
    const { data } = await apiClient.get("/customers", { params });
    return toCustomers(data);
  } catch {
    const { data } = await apiClient.get("/customers/route", { params: fallbackParams });
    return toCustomers(data);
  }
}

export async function upsertRouteCustomer(payload: UpsertRouteCustomerPayload): Promise<RouteCustomer | null> {
  const { data } = await apiClient.post("/customers/route/upsert", payload);
  const root = data as Record<string, unknown>;
  const routeCustomer =
    (root.data as Record<string, unknown> | undefined)?.customer ||
    root.customer ||
    root.data ||
    root;

  if (!routeCustomer || typeof routeCustomer !== "object") return null;
  return normalizeRouteCustomer(routeCustomer as BackendRouteCustomer);
}
