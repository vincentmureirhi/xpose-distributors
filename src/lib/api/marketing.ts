import { apiClient } from "./client";

export interface CouponValidationItem {
  product_id: string | number;
  quantity: number;
  unit_price?: number;
}

export interface CouponValidationPayload {
  couponCode: string;
  orderType?: "normal" | "route" | string;
  customerPhone?: string;
  customerId?: string | number | null;
  subtotalAmount: number;
  items: CouponValidationItem[];
}

export interface CouponValidationResult {
  coupon_id: number;
  coupon_code: string;
  campaign_id?: number | null;
  campaign_code?: string | null;
  campaign_name?: string | null;
  discount_type: "percentage" | "fixed" | string;
  discount_value: number;
  subtotal_amount: number;
  discount_amount: number;
  final_total_amount: number;
  customer_scope?: string;
  applies_to?: string;
  metadata?: Record<string, unknown>;
}

export async function validateCoupon(payload: CouponValidationPayload): Promise<CouponValidationResult> {
  const { data } = await apiClient.post("/marketing/coupons/validate", payload);
  return data?.data || data;
}

export async function listPublicCampaigns(limit = 6) {
  const { data } = await apiClient.get("/marketing/campaigns/public", { params: { limit } });
  return data?.data || data;
}
