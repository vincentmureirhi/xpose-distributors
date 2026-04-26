import { apiClient } from "./client";
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
  const { data } = await apiClient.post("/orders/guest-checkout", payload);
  return data?.data || data;
}

export async function createOrder(payload: {
  items: CartItem[];
  customer: { name: string; email: string; phone: string; address: string };
  payment_method: string;
  total: number;
}): Promise<Order> {
  const { data } = await apiClient.post("/orders", payload);
  return data?.data || data;
}

export async function trackOrder(orderNumber: string, customerPhone: string): Promise<Order | null> {
  try {
    const { data } = await apiClient.get("/orders/track", {
      params: { order_number: orderNumber, customer_phone: customerPhone },
    });
    return data?.data || data;
  } catch {
    return null;
  }
}
