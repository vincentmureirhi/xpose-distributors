import { apiClient } from "./client";
import type { CartItem, Order } from "@/types/shop";

export interface GuestCheckoutPayload {
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  delivery_address: string;
  notes?: string;
  order_type?: "normal" | "route";
  order_workflow_type?: "normal_self_service" | "route_self_service" | "route_sales_rep_capture";
  sales_rep_id?: string;
  customer_id?: string;
  customer_location_id?: string;
  route_area?: string;
  route_notes?: string;
  coupon_code?: string;
  items: { product_id: string | number; quantity: number; unit_price?: number }[];
}

export interface GuestCheckoutResult {
  id?: string;
  order_number?: string;
  status?: string;
  tracking_token?: string;
  tracking_url?: string;
  tracking_link_mode?: "secure" | "recovery" | string;
  tracking_token_ttl_days?: number;
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

export async function trackOrderByToken(token: string): Promise<Order | null> {
  try {
    const { data } = await apiClient.get("/orders/track", {
      params: { t: token },
    });
    return data?.data || data;
  } catch {
    return null;
  }
}

export async function trackOrderRecovery(params: {
  orderNumber: string;
  phoneLast3: string;
  verificationType: "total" | "location";
  verificationAnswer: string;
}): Promise<Order | null> {
  try {
    const { data } = await apiClient.get("/orders/track", {
      params: {
        order_number: params.orderNumber,
        phone_last3: params.phoneLast3,
        verification_type: params.verificationType,
        verification_answer: params.verificationAnswer,
      },
    });
    return data?.data || data;
  } catch {
    return null;
  }
}

export async function trackOrderByPhoneRecovery(params: {
  phone: string;
  orderTotal: string;
  deliveryArea: string;
}): Promise<Order | null> {
  try {
    const { data } = await apiClient.get("/orders/track", {
      params: {
        customer_phone: params.phone,
        recovery_total: params.orderTotal,
        recovery_location: params.deliveryArea,
      },
    });
    return data?.data || data;
  } catch {
    return null;
  }
}
