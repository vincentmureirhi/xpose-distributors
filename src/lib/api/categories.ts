import { apiClient } from "./client";
import type { Category } from "@/types/shop";

export async function listCategories(): Promise<Category[]> {
  const { data } = await apiClient.get("/categories");
  return data?.data || data?.categories || data || [];
}
