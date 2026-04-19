import { apiClient, USE_MOCK } from "./client";
import { filterMockProducts, mockProducts } from "../mock-data";
import type { Product } from "@/types/shop";

export async function listProducts(params: Record<string, any> = {}): Promise<Product[]> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 250));
    return filterMockProducts(params);
  }
  const { data } = await apiClient.get("/products", { params });
  return data?.data || data?.products || data || [];
}

export async function getProductById(id: string | number): Promise<Product | null> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 200));
    return mockProducts.find((p) => String(p.id) === String(id)) || null;
  }
  const { data } = await apiClient.get(`/products/${id}`);
  return data?.data || data || null;
}
