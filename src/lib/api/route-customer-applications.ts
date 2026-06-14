import { apiClient } from "./client";

export interface RouteCustomerApplicationPayload {
  applicant_name: string;
  business_name?: string;
  email: string;
  phone: string;
  address?: string;
  region_id?: string;
  location_id?: string;
  requested_credit_limit?: number;
  submitted_via?: "email" | "upload" | "manual";
  form_reference?: string;
}

export async function submitRouteCustomerApplication(payload: RouteCustomerApplicationPayload) {
  const { data } = await apiClient.post("/route-customer-portal/applications/public", {
    ...payload,
    submitted_via: payload.submitted_via || "email",
  });

  return data?.data || data;
}
