import { apiClient } from "./client";

export interface BlogPost {
  id: string | number;
  title: string;
  excerpt?: string;
  content?: string;
  featured_image?: string;
  featured_image_url?: string;
  associated_product_id?: string | number | null;
  associated_product_name?: string;
  associated_product_image_url?: string;
  associated_product_price?: string | number;
  created_at?: string;
  author?: string;
  slug?: string;
}

export async function listBlogPosts(): Promise<BlogPost[]> {
  try {
    const { data } = await apiClient.get("/blog");
    // Backend returns { success, message, data: { posts: [], total, limit, offset } }
    const posts = data?.data?.posts ?? data?.data ?? data ?? [];
    return Array.isArray(posts) ? posts : [];
  } catch {
    return [];
  }
}

export async function getBlogPost(id: string | number): Promise<BlogPost | null> {
  try {
    const { data } = await apiClient.get(`/blog/${id}`);
    return data?.data?.post ?? data?.data ?? null;
  } catch {
    return null;
  }
}
