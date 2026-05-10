export type PricingRuleType =
  | "CONSTANT"
  | "FIXED_UNIT"
  | "SKU_THRESHOLD"
  | "GROUP_THRESHOLD"
  | "SKU_TIERED"
  | "GROUP_TIERED"
  | "TIERED";

export interface PricingEvaluation {
  product_id: string | number;
  quantity: number;
  unit_price: number;
  line_total: number;
  // Canonical field used in the storefront
  wholesale_eligible?: boolean;
  // Backward-compatible alias returned by some backend payloads
  is_wholesale_eligible?: boolean;
  threshold_quantity: number | null;
  effective_quantity: number;
  rule_type: PricingRuleType;
  rule_name?: string;
  pricing_group_name?: string | null;
  pricing_label?: string;
}

export interface Product {
  id: string | number;
  name: string;
  description?: string;
  retail_price?: number;
  wholesale_price?: number;
  min_qty_wholesale?: number;
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
  pricing_rule_type?: PricingRuleType;
  pricing_rule_name?: string;
  pricing_group_name?: string | null;
  wholesale_threshold_qty?: number | null;
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
  pricing_label?: string;
  rule_type?: PricingRuleType;
  wholesale_eligible?: boolean;
  threshold_quantity?: number | null;
}

export interface Order {
  id: string;
  status: string;
  order_status?: string;
  payment_status?: string;
  total: number;
  total_amount?: number;
  items: CartItem[];
  created_at: string;
  status_changed_at?: string;
  customer_name?: string;
  delivery_address?: string;
}
