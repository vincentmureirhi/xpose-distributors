import { apiClient } from "./client";

export interface SalesRepProfile {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  username: string | null;
  route_area: string | null;
  must_change_password: boolean;
  is_active: boolean;
  role: "sales_rep";
  status?: string;
  last_login_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface SalesRepLoginResponse {
  token: string;
  sales_rep: SalesRepProfile;
}

interface SalesRepSessionResponse {
  sales_rep: SalesRepProfile;
}

interface ApiErrorShape {
  error?: string;
  message?: string;
}

function unwrapResponseData<T>(payload: unknown): T {
  const root = payload as { data?: unknown };
  return (root?.data ?? payload) as T;
}

export function extractApiErrorMessage(error: unknown, fallback: string): string {
  const response = (error as { response?: { data?: ApiErrorShape } })?.response?.data;
  return response?.error || response?.message || (error as { message?: string })?.message || fallback;
}

export async function loginSalesRep(identifier: string, password: string): Promise<SalesRepLoginResponse> {
  const { data } = await apiClient.post("/sales-reps/auth/login", { identifier, password });
  return unwrapResponseData<SalesRepLoginResponse>(data);
}

export async function fetchSalesRepSession(): Promise<SalesRepSessionResponse> {
  const { data } = await apiClient.get("/sales-reps/auth/me");
  return unwrapResponseData<SalesRepSessionResponse>(data);
}

export async function changeSalesRepPassword(payload: {
  current_password: string;
  new_password: string;
  confirm_password: string;
}): Promise<SalesRepSessionResponse> {
  const { data } = await apiClient.post("/sales-reps/auth/change-password", payload);
  return unwrapResponseData<SalesRepSessionResponse>(data);
}

export async function updateOwnSalesRepLocation(payload: {
  latitude: number;
  longitude: number;
  accuracy_meters?: number;
  source?: string;
  recorded_at?: string;
}) {
  const { data } = await apiClient.post("/sales-reps/me/location", payload);
  return unwrapResponseData(data);
}
