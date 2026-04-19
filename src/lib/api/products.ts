import { apiClient } from "./client";
import type { Product } from "@/types/shop";

export async function listProducts(params: Record<string, any> = {}): Promise<Product[]> {
  const { data } = await apiClient.get("/products", { params });
  return data?.data || data?.products || data || [];
}

export async function getProductById(id: string | number): Promise<Product | null> {
  const { data } = await apiClient.get(`/products/${id}`);
  return data?.data || data || null;
}
