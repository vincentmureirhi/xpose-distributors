import { apiClient } from "./client";
import { normalizeProduct } from "./products";
import type { Product } from "@/types/shop";

export interface MerchandisingCollection {
  id: number;
  name: string;
  collection_slug: string;
  hero_title?: string | null;
  hero_subtitle?: string | null;
  badge_label?: string | null;
  cta_label?: string | null;
  cta_url?: string | null;
  hero_image_url?: string | null;
  share_image_url?: string | null;
  accent_color?: string | null;
  homepage_section?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  priority?: number;
  product_limit?: number;
  automatic_rules?: Record<string, unknown>;
}

export interface CollectionResult {
  collection: MerchandisingCollection;
  products: Product[];
}

export interface HomeMerchandisingResult {
  trending: Product[];
  wholesale: Product[];
  under_500: Product[];
  new_arrivals: Product[];
}

function unwrap<T>(response: { data: { data?: T } | T }): T {
  return ("data" in response.data ? response.data.data : response.data) as T;
}

function sessionId() {
  if (typeof window === "undefined") return "";
  const key = "xposeStorefrontSessionId";
  const existing = window.sessionStorage.getItem(key);
  if (existing) return existing;
  const value = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.sessionStorage.setItem(key, value);
  return value;
}

function normalizeProducts(rows: unknown): Product[] {
  return Array.isArray(rows) ? rows.map(normalizeProduct) : [];
}

export async function listCollections(): Promise<MerchandisingCollection[]> {
  const response = await apiClient.get("/marketing/collections/public");
  const rows = unwrap<MerchandisingCollection[]>(response);
  return Array.isArray(rows) ? rows : [];
}

export async function getCollection(slug: string): Promise<CollectionResult> {
  const response = await apiClient.get(`/marketing/collections/public/${encodeURIComponent(slug)}`);
  const payload = unwrap<{ collection: MerchandisingCollection; products: unknown }>(response);
  return { collection: payload.collection, products: normalizeProducts(payload.products) };
}

export async function getHomeMerchandising(): Promise<HomeMerchandisingResult> {
  const response = await apiClient.get("/v1/storefront/merchandising/home");
  const payload = unwrap<Record<string, unknown>>(response);
  return {
    trending: normalizeProducts(payload.trending),
    wholesale: normalizeProducts(payload.wholesale),
    under_500: normalizeProducts(payload.under_500),
    new_arrivals: normalizeProducts(payload.new_arrivals),
  };
}

export async function trackProductEvent(productId: string | number, eventType: "view" | "add_to_cart") {
  try {
    const campaignId = typeof window === "undefined" ? null : Number(window.sessionStorage.getItem("xposeCampaignId") || 0) || null;
    await apiClient.post(`/v1/storefront/products/${productId}/events`, {
      event_type: eventType,
      session_id: sessionId(),
      source_path: typeof window === "undefined" ? "/" : `${window.location.pathname}${window.location.search}`,
      campaign_id: campaignId,
    });
  } catch {
    // Merchandising measurement must never interrupt shopping.
  }
}
