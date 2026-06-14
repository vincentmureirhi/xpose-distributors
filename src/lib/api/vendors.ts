import { apiClient } from "./client";

export interface VendorPlan {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  monthly_fee: number | string;
  commission_rate: number | string;
  max_products: number | string;
  featured_slots: number | string;
  product_approval_required: boolean;
  price_review_required: boolean;
  minimum_margin_percent: number | string;
  allow_vendor_discounts: boolean;
}

export interface VendorApplicationPayload {
  store_name: string;
  legal_name?: string;
  contact_person: string;
  phone: string;
  email: string;
  business_type?: string;
  business_registration_no?: string;
  kra_pin?: string;
  national_id?: string;
  address?: string;
  product_categories?: string[];
  estimated_skus?: number;
  expected_monthly_sales?: number;
  sample_price_min?: number;
  sample_price_max?: number;
  pricing_notes?: string;
  preferred_plan_id?: number;
  requested_commission_rate?: number;
  requested_monthly_fee?: number;
  fulfillment_preference?: "xpose_reviewed" | "xpose_fulfilled" | "vendor_fulfilled" | "hybrid";
}

export interface VendorApplicationResult {
  application?: {
    id: number;
    application_number: string;
    store_name: string;
    status: string;
  };
  next_step?: string;
}

function unwrap<T>(response: { data: { data?: T } | T }): T {
  return ("data" in response.data ? response.data.data : response.data) as T;
}

export async function listPublicVendorPlans(): Promise<VendorPlan[]> {
  const response = await apiClient.get("/vendors/plans/public");
  const data = unwrap<VendorPlan[]>(response);
  return Array.isArray(data) ? data : [];
}

export async function submitVendorApplication(payload: VendorApplicationPayload): Promise<VendorApplicationResult> {
  const response = await apiClient.post("/vendors/applications/public", payload);
  return unwrap<VendorApplicationResult>(response);
}
