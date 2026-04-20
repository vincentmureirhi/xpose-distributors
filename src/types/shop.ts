export interface Product {
  id: string | number;
  name: string;
  description?: string;
  retail_price?: number;
  wholesale_price?: number;
  price?: number;
  image_url?: string;
  images?: string[];
  category_id?: string | number;
  category_name?: string;
  stock?: number;
  rating?: number;
  reviews_count?: number;
  is_flash?: boolean;
  is_sponsored?: boolean;
  price_tiers?: PriceTier[];
  // Flash sale fields from API
  discounted_price?: number;
  flash_sale_id?: number;
  flash_sale_name?: string;
}

export interface PriceTier {
  unit: string;          // e.g. "piece", "bale", "carton", "dozen"
  qty_per_unit?: number; // e.g. 1, 6, 12, 50
  price: number;         // price for ONE unit (e.g. price per bale)
  min_qty?: number;      // minimum units to qualify (optional)
  label?: string;        // optional override label
}

export interface Category {
  id: string | number;
  name: string;
  image_url?: string;
  product_count?: number;
}

export interface CartItem {
  id: string | number;
  name: string;
  price: number;
  image_url: string;
  quantity: number;
}

export interface Order {
  id: string;
  status: string;
  order_status?: string;
  total: number;
  items: CartItem[];
  created_at: string;
}
