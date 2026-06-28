import { apiClient } from "./client";

export interface CouponValidationItem {
  product_id: string | number;
  category_id?: string | number | null;
  quantity: number;
  unit_price?: number;
  line_total?: number;
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
  discount_type: "percentage" | "fixed_amount" | string;
  discount_value: number;
  subtotal_amount: number;
  discount_amount: number;
  final_total_amount: number;
  customer_scope?: string;
  applies_to?: string;
  metadata?: Record<string, unknown>;
}

export interface PublicCampaignCoupon {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  discount_type: string;
  discount_value: number;
  min_order_amount?: number;
  max_discount_amount?: number | null;
  ends_at?: string | null;
}

export interface PublicCampaign {
  id: number;
  campaign_code: string;
  name: string;
  description?: string | null;
  campaign_type: string;
  customer_scope: string;
  placement?: "home" | "shop" | "checkout" | "route_portal" | "all" | string;
  priority?: number;
  hero_title?: string | null;
  hero_subtitle?: string | null;
  badge_label?: string | null;
  cta_label?: string | null;
  cta_url?: string | null;
  hero_image_url?: string | null;
  accent_color?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  coupons?: PublicCampaignCoupon[];
  product_ids?: Array<number | string>;
  category_ids?: Array<number | string>;
  region_ids?: Array<number | string>;
}

function campaignSessionId() {
  if (typeof window === "undefined") return "server";
  const key = "xpose_campaign_session";
  const existing = window.sessionStorage.getItem(key);
  if (existing) return existing;
  const value = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.sessionStorage.setItem(key, value);
  return value;
}

export async function validateCoupon(payload: CouponValidationPayload): Promise<CouponValidationResult> {
  const { data } = await apiClient.post("/marketing/coupons/validate", payload);
  return data?.data || data;
}

export async function listPublicCampaigns(limit = 8): Promise<PublicCampaign[]> {
  const { data } = await apiClient.get("/marketing/campaigns/public", { params: { limit } });
  const payload = data?.data || data;
  return Array.isArray(payload) ? payload : [];
}

export async function trackCampaignEvent(campaignId: number, eventType: "impression" | "click") {
  try {
    await apiClient.post(`/marketing/campaigns/${campaignId}/events`, {
      event_type: eventType,
      session_id: campaignSessionId(),
      source_path: typeof window === "undefined" ? "/" : `${window.location.pathname}${window.location.search}`,
    });
  } catch {
    // Campaign measurement must never interrupt shopping.
  }
}