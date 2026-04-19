import { apiClient, USE_MOCK } from "./client";
import type { CartItem, Order } from "@/types/shop";

export interface GuestCheckoutPayload {
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  delivery_address: string;
  notes?: string;
  items: { product_id: string | number; quantity: number }[];
}

export interface GuestCheckoutResult {
  id?: string;
  order_number?: string;
  status?: string;
}

export async function guestCheckout(payload: GuestCheckoutPayload): Promise<GuestCheckoutResult> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 700));
    return {
      id: "ORD-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
      order_number: "ORD-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
      status: "pending",
    };
  }
  const { data } = await apiClient.post("/orders/guest-checkout", payload);
  return data?.data || data;
}

export async function createOrder(payload: {
  items: CartItem[];
  customer: { name: string; email: string; phone: string; address: string };
  payment_method: string;
  total: number;
}): Promise<Order> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 600));
    return {
      id: "ORD-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
      status: "pending",
      total: payload.total,
      items: payload.items,
      created_at: new Date().toISOString(),
    };
  }
  const { data } = await apiClient.post("/orders", payload);
  return data?.data || data;
}

export async function trackOrder(orderId: string, phone: string): Promise<Order | null> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 500));
    if (!orderId) return null;
    return {
      id: orderId,
      status: "in_transit",
      total: 12900,
      items: [],
      created_at: new Date(Date.now() - 86400000).toISOString(),
    };
  }
  const { data } = await apiClient.get(`/orders/${orderId}`, { params: { phone } });
  return data?.data || data;
}
