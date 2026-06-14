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
  location_id?: string | number;
  location_name?: string;
  region_id?: string | number;
  region_name?: string;
  sales_rep_id?: string | number;
  credit_limit?: string | number | null;
  current_balance?: string | number | null;
  available_credit?: string | number | null;
  overdue_balance?: string | number | null;
  is_credit_active?: boolean | null;
  total_route_orders?: string | number | null;
  last_route_order_at?: string | null;
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
  reject_existing?: boolean;
}

export interface ListRouteCustomersOptions {
  sales_rep_id?: string;
  region_id?: string;
  location_id?: string;
  search?: string;
  limit?: number;
}

function toMoneyNumber(value: unknown): number | undefined {
  if (value == null || value === "") return undefined;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
}

function normalizeRouteCustomer(input: BackendRouteCustomer): RouteCustomer | null {
  const id = input.customer_id ?? input.id;
  const name = (input.customer_name ?? input.name ?? "").trim();
  const phone = (input.customer_phone ?? input.phone ?? "").trim();
  const locationName = (input.location_name ?? input.location ?? input.route_area ?? "").trim();
  const routeArea = (input.route_area ?? locationName).trim();
  const notes = (input.route_notes ?? input.notes ?? "").trim();

  if (!id || !name || !phone) return null;

  return {
    id: String(id),
    backend_customer_id: String(id),
    name,
    phone,
    location: locationName || routeArea,
    route_area: routeArea,
    notes: notes || undefined,
    customer_location_id: input.customer_location_id || input.location_id ? String(input.customer_location_id ?? input.location_id) : undefined,
    location_name: locationName || undefined,
    region_id: input.region_id ? String(input.region_id) : undefined,
    region_name: input.region_name || undefined,
    sales_rep_id: input.sales_rep_id ? String(input.sales_rep_id) : undefined,
    credit_limit: toMoneyNumber(input.credit_limit),
    current_balance: toMoneyNumber(input.current_balance),
    available_credit: toMoneyNumber(input.available_credit),
    overdue_balance: toMoneyNumber(input.overdue_balance),
    is_credit_active: input.is_credit_active == null ? true : Boolean(input.is_credit_active),
    total_route_orders: toMoneyNumber(input.total_route_orders),
    last_route_order_at: input.last_route_order_at || undefined,
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

export async function listRouteCustomers(
  sales_rep_idOrOptions?: string | ListRouteCustomersOptions,
  options: ListRouteCustomersOptions = {}
): Promise<RouteCustomer[]> {
  const resolvedOptions =
    typeof sales_rep_idOrOptions === "object"
      ? sales_rep_idOrOptions
      : { ...options, ...(sales_rep_idOrOptions ? { sales_rep_id: sales_rep_idOrOptions } : {}) };
  const toCustomers = (payload: unknown) => {
    const rows = extractRouteCustomerRows(payload);
    const normalized = rows.map(normalizeRouteCustomer);
    return normalized.filter((customer): customer is RouteCustomer => !!customer);
  };
  const params = {
    customer_type: "route",
    ...(resolvedOptions.sales_rep_id ? { sales_rep_id: resolvedOptions.sales_rep_id } : {}),
    ...(resolvedOptions.region_id ? { region_id: resolvedOptions.region_id } : {}),
    ...(resolvedOptions.location_id ? { location_id: resolvedOptions.location_id } : {}),
    ...(resolvedOptions.search ? { search: resolvedOptions.search } : {}),
    limit: resolvedOptions.limit || 50,
  };
  const fallbackParams = {
    ...(resolvedOptions.sales_rep_id ? { sales_rep_id: resolvedOptions.sales_rep_id } : {}),
    ...(resolvedOptions.search ? { search: resolvedOptions.search } : {}),
    limit: resolvedOptions.limit || 50,
  };

  try {
    const { data } = await apiClient.get("/customers", { params });
    return toCustomers(data);
  } catch {
    const { data } = await apiClient.get("/customers/route", { params: fallbackParams });
    return toCustomers(data);
  }
}

export async function upsertRouteCustomer(payload: UpsertRouteCustomerPayload): Promise<RouteCustomer | null> {
  const { data } = await apiClient.post("/customers/route/upsert", {
    ...payload,
    name: payload.customer_name,
    phone: payload.customer_phone,
    location_id: payload.customer_location_id,
  });
  const root = data as Record<string, unknown>;
  const routeCustomer =
    (root.data as Record<string, unknown> | undefined)?.customer ||
    root.customer ||
    root.data ||
    root;

  if (!routeCustomer || typeof routeCustomer !== "object") return null;
  return normalizeRouteCustomer(routeCustomer as BackendRouteCustomer);
}
