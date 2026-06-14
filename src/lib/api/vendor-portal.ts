import { apiClient } from "./client";
import type { Product } from "@/types/shop";

export interface VendorUser {
  id: number;
  vendor_id: number;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  username: string;
  role: "owner" | "manager" | "staff" | string;
  status?: string;
  must_change_password: boolean;
}

export interface VendorStore {
  id: number;
  store_name: string;
  store_slug: string;
  legal_name?: string | null;
  contact_person?: string | null;
  phone?: string | null;
  email?: string | null;
  public_description?: string | null;
  product_categories?: string[];
  status: string;
  verification_status: string;
  store_visibility_status?: "private" | "public" | "hidden" | string;
  verification_badge_label?: string | null;
  storefront_featured?: boolean;
  logo_url?: string | null;
  banner_url?: string | null;
  support_phone?: string | null;
  support_email?: string | null;
  website_url?: string | null;
  monthly_fee?: number | string;
  commission_rate?: number | string;
  max_products?: number | string;
  plan_name?: string | null;
  plan_code?: string | null;
  product_count?: number;
  limited_stock_count?: number;
  minimum_price?: number | string | null;
  verified?: boolean;
  published_at?: string | null;
}

export interface VendorSubscription {
  id: number;
  status: string;
  amount_due: number | string;
  amount_paid: number | string;
  current_period_end?: string | null;
  plan_name?: string | null;
}

export interface VendorWorkspace {
  vendor_user: VendorUser;
  vendor: VendorStore;
  subscription?: VendorSubscription | null;
  stats?: {
    approved_products: number;
    live_products: number;
    pending_submissions: number;
  };
}

export interface VendorProductSubmission {
  id: number;
  vendor_id: number;
  product_id?: number | null;
  submission_status: "draft" | "submitted" | "changes_requested" | "approved" | "rejected" | "archived" | string;
  product_name: string;
  sku?: string | null;
  brand_name?: string | null;
  category_id: number;
  category_name?: string | null;
  description?: string | null;
  image_url?: string | null;
  proposed_retail_price: number | string;
  proposed_wholesale_price?: number | string | null;
  proposed_cost_price?: number | string | null;
  min_order_qty: number;
  order_qty_step: number;
  current_stock: number;
  selling_unit_label?: string | null;
  fulfillment_model?: string;
  product_tags?: string[];
  is_featured_requested?: boolean;
  vendor_notes?: string | null;
  admin_review_notes?: string | null;
  rejection_reason?: string | null;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  created_at: string;
}

export interface VendorAnalytics {
  range_days: number;
  product_stats: {
    total_products: number;
    approved_products: number;
    live_products: number;
    out_of_stock_products: number;
    limited_stock_products: number;
    stock_units: number;
    stock_value: number;
  };
  sales: {
    order_count: number;
    units_ordered: number;
    gross_sales: number;
    last_order_at?: string | null;
  };
  submissions: {
    drafts: number;
    submitted: number;
    changes_requested: number;
    approved: number;
    rejected: number;
  };
  messages: {
    total_messages: number;
    new_messages: number;
    read_messages: number;
    closed_messages: number;
  };
  top_products: Array<{
    id: number;
    name: string;
    image_url?: string | null;
    current_stock: number;
    units_ordered: number;
    gross_sales: number;
  }>;
  trend: Array<{
    label: string;
    gross_sales: number;
    units_ordered: number;
    orders: number;
  }>;
}

export interface VendorMessage {
  id: number;
  vendor_id: number;
  product_id?: number | null;
  product_name?: string | null;
  customer_name: string;
  customer_phone?: string | null;
  customer_email?: string | null;
  message: string;
  source: string;
  status: "new" | "read" | "closed" | string;
  vendor_notes?: string | null;
  admin_notes?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface VendorProductPayload {
  product_name: string;
  sku?: string;
  brand_name?: string;
  category_id: number | string;
  description?: string;
  image_url?: string;
  proposed_retail_price: number | string;
  proposed_wholesale_price?: number | string;
  proposed_cost_price?: number | string;
  min_order_qty?: number | string;
  order_qty_step?: number | string;
  current_stock?: number | string;
  selling_unit_label?: string;
  fulfillment_model?: "xpose_reviewed" | "xpose_fulfilled" | "vendor_fulfilled" | "hybrid";
  product_tags?: string[] | string;
  is_featured_requested?: boolean;
  vendor_notes?: string;
  submit?: boolean;
}

export interface VendorPublicStoreResult {
  store: VendorStore;
  products: Product[];
}

function unwrap<T>(response: { data: { data?: T } | T }): T {
  return ("data" in response.data ? response.data.data : response.data) as T;
}

export function extractVendorApiError(error: unknown, fallback: string) {
  const err = error as { response?: { data?: { error?: string; message?: string } }; message?: string };
  return err.response?.data?.error || err.response?.data?.message || err.message || fallback;
}

export async function loginVendor(identifier: string, password: string) {
  const response = await apiClient.post("/vendors/auth/login", { identifier, password });
  return unwrap<{
    token: string;
    vendor_user: VendorUser;
    vendor: VendorStore;
    must_change_password: boolean;
  }>(response);
}

export async function fetchVendorWorkspace() {
  const response = await apiClient.get("/vendors/me");
  return unwrap<VendorWorkspace>(response);
}

export async function fetchVendorAnalytics(days = 30) {
  const response = await apiClient.get(`/vendors/me/analytics?days=${encodeURIComponent(String(days))}`);
  return unwrap<VendorAnalytics>(response);
}

export async function listMyVendorMessages(status?: string) {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  const response = await apiClient.get(`/vendors/me/messages${query}`);
  const data = unwrap<VendorMessage[]>(response);
  return Array.isArray(data) ? data : [];
}

export async function updateVendorMessageStatus(
  id: number | string,
  payload: { status: "new" | "read" | "closed" | string; vendor_notes?: string }
) {
  const response = await apiClient.patch(`/vendors/me/messages/${id}`, payload);
  return unwrap<VendorMessage>(response);
}

export async function changeVendorPassword(payload: { current_password: string; new_password: string }) {
  const response = await apiClient.put("/vendors/me/password", payload);
  return unwrap(response);
}

export async function updateVendorProfile(payload: Partial<VendorStore>) {
  const response = await apiClient.patch("/vendors/me/store", payload);
  return unwrap<VendorStore>(response);
}

export async function listMyVendorProducts(status?: string) {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  const response = await apiClient.get(`/vendors/me/products${query}`);
  const data = unwrap<VendorProductSubmission[]>(response);
  return Array.isArray(data) ? data : [];
}

export async function createVendorProduct(payload: VendorProductPayload) {
  const response = await apiClient.post("/vendors/me/products", payload);
  return unwrap<VendorProductSubmission>(response);
}

export async function updateVendorProduct(id: number | string, payload: VendorProductPayload) {
  const response = await apiClient.put(`/vendors/me/products/${id}`, payload);
  return unwrap<VendorProductSubmission>(response);
}

export async function submitVendorProduct(id: number | string) {
  const response = await apiClient.post(`/vendors/me/products/${id}/submit`);
  return unwrap<VendorProductSubmission>(response);
}

export async function listPublicVendorStores(filters: { search?: string; category?: string; featured?: boolean } = {}) {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.category) params.set("category", filters.category);
  if (filters.featured) params.set("featured", "true");
  const response = await apiClient.get(`/vendors/public/stores${params.toString() ? `?${params}` : ""}`);
  const data = unwrap<VendorStore[]>(response);
  return Array.isArray(data) ? data : [];
}

export async function getPublicVendorStore(slug: string) {
  const response = await apiClient.get(`/vendors/public/stores/${encodeURIComponent(slug)}`);
  return unwrap<VendorPublicStoreResult>(response);
}

export async function sendPublicVendorMessage(
  slug: string,
  payload: {
    customer_name: string;
    customer_phone?: string;
    customer_email?: string;
    message: string;
    product_id?: number | string | null;
  }
) {
  const response = await apiClient.post(`/vendors/public/stores/${encodeURIComponent(slug)}/messages`, payload);
  return unwrap(response);
}
