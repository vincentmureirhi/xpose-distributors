import type { Product, Category } from "@/types/shop";

export const mockCategories: Category[] = [
  { id: 1, name: "Electronics", product_count: 124 },
  { id: 2, name: "Fashion", product_count: 86 },
  { id: 3, name: "Home & Living", product_count: 64 },
  { id: 4, name: "Beauty", product_count: 52 },
  { id: 5, name: "Sports", product_count: 38 },
  { id: 6, name: "Groceries", product_count: 210 },
  { id: 7, name: "Kids", product_count: 47 },
  { id: 8, name: "Tools", product_count: 29 },
];

const img = (seed: string) =>
  `https://images.unsplash.com/${seed}?auto=format&fit=crop&w=800&q=80`;

// Helper: build tiered pricing (piece / dozen / bale-or-carton)
const tiers = (piece: number, perDozen?: number, bulk?: { unit: string; qty: number; price: number }) => {
  const list = [{ unit: "piece", qty_per_unit: 1, price: piece }];
  if (perDozen) list.push({ unit: "dozen", qty_per_unit: 12, price: perDozen });
  if (bulk) list.push({ unit: bulk.unit, qty_per_unit: bulk.qty, price: bulk.price });
  return list;
};

export const mockProducts: Product[] = [
  { id: 1, name: "Wireless Noise-Cancel Headphones", retail_price: 12900, wholesale_price: 9900, image_url: img("photo-1505740420928-5e560c06d30e"), category_id: 1, category_name: "Electronics", stock: 24, rating: 4.8, reviews_count: 342, is_flash: true, description: "Studio-grade ANC, 40h battery, plush memory foam cups.", price_tiers: tiers(12900, undefined, { unit: "carton", qty: 6, price: 69000 }) },
  { id: 2, name: "Minimal Leather Sneakers", retail_price: 6800, wholesale_price: 5200, image_url: img("photo-1542291026-7eec264c27ff"), category_id: 2, category_name: "Fashion", stock: 50, rating: 4.6, reviews_count: 188, description: "Italian full-grain leather, cushioned EVA midsole.", price_tiers: tiers(6800, 72000, { unit: "bale", qty: 24, price: 132000 }) },
  { id: 3, name: "Smart Espresso Machine", retail_price: 38500, wholesale_price: 32000, image_url: img("photo-1572119865084-43c285814d63"), category_id: 3, category_name: "Home & Living", stock: 12, rating: 4.9, reviews_count: 92, is_flash: true, description: "App-controlled brewing, 19-bar pump, milk frother.", price_tiers: tiers(38500, undefined, { unit: "carton", qty: 4, price: 142000 }) },
  { id: 4, name: "Hydrating Serum 30ml", retail_price: 440, wholesale_price: 380, image_url: img("photo-1556228720-195a672e8a03"), category_id: 4, category_name: "Beauty", stock: 800, rating: 4.7, reviews_count: 521, description: "Hyaluronic acid + niacinamide for plump, glowing skin.", price_tiers: tiers(440, 4800, { unit: "bale", qty: 60, price: 22800 }) },
  { id: 5, name: "Carbon Road Bike", retail_price: 145000, wholesale_price: 128000, image_url: img("photo-1485965120184-e220f721d03e"), category_id: 5, category_name: "Sports", stock: 6, rating: 4.9, reviews_count: 41, is_sponsored: true, description: "Aero carbon frame, 22-speed Shimano, tubeless ready.", price_tiers: tiers(145000) },
  { id: 6, name: "Organic Cold-Pressed Olive Oil 1L", retail_price: 1800, wholesale_price: 1400, image_url: img("photo-1474979266404-7eaacbcd87c5"), category_id: 6, category_name: "Groceries", stock: 200, rating: 4.5, reviews_count: 98, description: "First harvest, single-estate, peppery finish.", price_tiers: tiers(1800, 19200, { unit: "carton", qty: 12, price: 18600 }) },
  { id: 7, name: "Wooden Building Blocks Set", retail_price: 3200, wholesale_price: 2400, image_url: img("photo-1558877385-8c1f7c64df95"), category_id: 7, category_name: "Kids", stock: 45, rating: 4.8, reviews_count: 167, description: "Sustainably sourced beechwood, 100 pieces.", price_tiers: tiers(3200, 34000) },
  { id: 8, name: "Cordless Drill Kit 18V", retail_price: 8900, wholesale_price: 7200, image_url: img("photo-1581147036324-c1c89c2c8b5c"), category_id: 8, category_name: "Tools", stock: 32, rating: 4.7, reviews_count: 215, description: "Brushless motor, 2 batteries, 50-piece bit set.", price_tiers: tiers(8900, undefined, { unit: "carton", qty: 6, price: 49800 }) },
  { id: 9, name: "Smart Fitness Watch", retail_price: 18900, wholesale_price: 15400, image_url: img("photo-1523275335684-37898b6baf30"), category_id: 1, category_name: "Electronics", stock: 18, rating: 4.6, reviews_count: 412, is_flash: true, description: "AMOLED, GPS, 7-day battery, 80+ workouts.", price_tiers: tiers(18900, undefined, { unit: "carton", qty: 10, price: 168000 }) },
  { id: 10, name: "Linen Oversized Shirt", retail_price: 440, wholesale_price: 350, image_url: img("photo-1602810318383-e386cc2a3ccf"), category_id: 2, category_name: "Fashion", stock: 600, rating: 4.5, reviews_count: 73, description: "100% European linen, relaxed cut, mother-of-pearl buttons.", price_tiers: tiers(440, 4800, { unit: "bale", qty: 6, price: 2640 }) },
  { id: 11, name: "Modern Floor Lamp", retail_price: 11200, wholesale_price: 8900, image_url: img("photo-1507473885765-e6ed057f782c"), category_id: 3, category_name: "Home & Living", stock: 14, rating: 4.7, reviews_count: 56, description: "Brushed brass, dimmable warm LED, marble base.", price_tiers: tiers(11200) },
  { id: 12, name: "Vitamin C Brightening Mask", retail_price: 380, wholesale_price: 290, image_url: img("photo-1570194065650-d99fb4bedf0a"), category_id: 4, category_name: "Beauty", stock: 1200, rating: 4.4, reviews_count: 289, description: "10-min radiance boost, vegan formula.", price_tiers: tiers(380, 4080, { unit: "bale", qty: 50, price: 16000 }) },
  { id: 13, name: "Yoga Mat Pro 6mm", retail_price: 3400, wholesale_price: 2600, image_url: img("photo-1601925260368-ae2f83cf8b7f"), category_id: 5, category_name: "Sports", stock: 90, rating: 4.8, reviews_count: 312, description: "Non-slip TPE, alignment lines, carry strap.", price_tiers: tiers(3400, 36000, { unit: "carton", qty: 8, price: 24000 }) },
  { id: 14, name: "Specialty Coffee Beans 1kg", retail_price: 2800, wholesale_price: 2200, image_url: img("photo-1559056199-641a0ac8b55e"), category_id: 6, category_name: "Groceries", stock: 75, rating: 4.9, reviews_count: 184, description: "Single-origin Ethiopian, medium roast, notes of berry & chocolate.", price_tiers: tiers(2800, 30000, { unit: "carton", qty: 10, price: 24500 }) },
  { id: 15, name: "RC Stunt Car", retail_price: 4200, wholesale_price: 3200, image_url: img("photo-1594787318286-3d835c1d207f"), category_id: 7, category_name: "Kids", stock: 40, rating: 4.5, reviews_count: 96, description: "360° flips, all-terrain, USB rechargeable.", price_tiers: tiers(4200, undefined, { unit: "carton", qty: 6, price: 22800 }) },
  { id: 16, name: "Premium Tool Chest", retail_price: 24500, wholesale_price: 19800, image_url: img("photo-1530124566582-a618bc2615dc"), category_id: 8, category_name: "Tools", stock: 9, rating: 4.8, reviews_count: 47, is_sponsored: true, description: "7-drawer steel, ball-bearing slides, lockable.", price_tiers: tiers(24500) },
];

export function filterMockProducts(params: { search?: string; category?: string; sort?: string; min?: number; max?: number } = {}) {
  let items = [...mockProducts];
  if (params.search) {
    const q = params.search.toLowerCase();
    items = items.filter((p) => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q));
  }
  if (params.category && params.category !== "all") {
    items = items.filter((p) => String(p.category_id) === String(params.category));
  }
  if (params.min != null) items = items.filter((p) => (p.retail_price ?? 0) >= params.min!);
  if (params.max != null) items = items.filter((p) => (p.retail_price ?? 0) <= params.max!);
  if (params.sort === "price-asc") items.sort((a, b) => (a.retail_price ?? 0) - (b.retail_price ?? 0));
  if (params.sort === "price-desc") items.sort((a, b) => (b.retail_price ?? 0) - (a.retail_price ?? 0));
  if (params.sort === "rating") items.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  return items;
}
