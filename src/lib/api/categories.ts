import { apiClient, USE_MOCK } from "./client";
import { mockCategories } from "../mock-data";
import type { Category } from "@/types/shop";

export async function listCategories(): Promise<Category[]> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 200));
    return mockCategories;
  }
  const { data } = await apiClient.get("/categories");
  return data?.data || data?.categories || data || [];
}
