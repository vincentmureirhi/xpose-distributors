import { apiClient } from "./client";

export interface BlogPost {
  id: string | number;
  title: string;
  excerpt?: string;
  content?: string;
  featured_image?: string;
  created_at?: string;
  author?: string;
  slug?: string;
}

const MOCK_POSTS: BlogPost[] = [
  {
    id: 1,
    title: "Top 10 Kitchen Essentials for Every Home",
    excerpt: "Discover the must-have kitchen tools that will transform your cooking experience and save you time every day.",
    content: "A well-equipped kitchen makes cooking a joy. From sharp knives to non-stick pans, having the right tools matters...",
    featured_image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80",
    created_at: "2026-04-15T10:00:00Z",
    author: "XPOSE Team",
    slug: "top-10-kitchen-essentials",
  },
  {
    id: 2,
    title: "How to Buy Wholesale in Kenya — A Complete Guide",
    excerpt: "Everything you need to know about buying wholesale products in Kenya, from pricing tiers to transport options.",
    content: "Wholesale buying in Kenya has never been easier. With XPOSE Distributors, you get the best prices...",
    featured_image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&q=80",
    created_at: "2026-04-10T09:30:00Z",
    author: "XPOSE Team",
    slug: "wholesale-guide-kenya",
  },
  {
    id: 3,
    title: "Flash Sales — How to Get the Best Deals",
    excerpt: "Learn how to take advantage of our flash sales and never miss a great deal again. Tips and tricks inside!",
    content: "Flash sales are time-limited offers with massive discounts. Here's how to make the most of them...",
    featured_image: "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=800&q=80",
    created_at: "2026-04-05T08:00:00Z",
    author: "XPOSE Team",
    slug: "flash-sales-guide",
  },
  {
    id: 4,
    title: "Electronics Care Tips — Make Your Gadgets Last Longer",
    excerpt: "Simple maintenance tips to extend the life of your electronics and save money in the long run.",
    content: "Proper care of your electronics can double their lifespan. Start with keeping them dust-free and avoiding overcharging...",
    featured_image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80",
    created_at: "2026-03-28T11:00:00Z",
    author: "XPOSE Team",
    slug: "electronics-care-tips",
  },
];

export async function listBlogPosts(): Promise<BlogPost[]> {
  try {
    const { data } = await apiClient.get("/blog");
    const posts = data?.data || data || [];
    return Array.isArray(posts) && posts.length > 0 ? posts : MOCK_POSTS;
  } catch {
    return MOCK_POSTS;
  }
}

export async function getBlogPost(id: string | number): Promise<BlogPost | null> {
  try {
    const { data } = await apiClient.get(`/blog/${id}`);
    return data?.data || data || null;
  } catch {
    return MOCK_POSTS.find((p) => String(p.id) === String(id) || p.slug === String(id)) || null;
  }
}
