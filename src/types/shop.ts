export type PricingRuleType =
  | "CONSTANT"
  | "FIXED_UNIT"
  | "SKU_THRESHOLD"
  | "GROUP_THRESHOLD"
  | "SKU_TIERED"
  | "GROUP_TIERED"
  // Legacy backend value still returned by older rules; keep for compatibility while backend rollout completes.
  | "TIERED"
  | "legacy";

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
  flash_sale_id?: number | null;
  flash_sale_name?: string | null;
  flash_sale_end_date?: string | null;
  flash_sale_discount_type?: "percentage" | "fixed" | null;
  flash_sale_discount_value?: number | null;
  original_unit_price?: number | null;
}

export interface Product {
  id: string | number;
  name: string;
  sku?: string;
  description?: string;
  retail_price?: number;
  wholesale_price?: number;
  min_qty_wholesale?: number;
  price?: number;
  image_url?: string;
  images?: string[];
  category_id?: string | number;
  category_name?: string;
  stock?: number | null;
  current_stock?: number | null;
  stock_status_override?: "in_stock" | "limited_stock" | "out_of_stock" | string;
  stock_status?: "in_stock" | "limited_stock" | "low_stock" | "out_of_stock" | "unknown" | string;
  rating?: number;
  reviews_count?: number;
  is_flash?: boolean;
  is_sponsored?: boolean;
  price_tiers?: PriceTier[];
  pricing_rule_type?: PricingRuleType;
  pricing_rule_name?: string;
  pricing_group_name?: string | null;
  wholesale_threshold_qty?: number | null;
  min_order_qty?: number;
  order_qty_step?: number;
  selling_unit_label?: string;
  vendor_id?: number | string | null;
  product_owner_type?: "xpose" | "vendor" | string;
  vendor_store_name?: string | null;
  vendor_store_slug?: string | null;
  vendor_verification_status?: string | null;
  vendor_verification_badge_label?: string | null;
  vendor_verified?: boolean;
  // Flash sale fields from API
  discounted_price?: number;
  flash_sale_id?: number;
  flash_sale_name?: string;
  flash_sale_start_date?: string;
  flash_sale_end_date?: string;
}

export interface PriceTier {
  id?: string | number;
  unit: string;          // e.g. "piece", "bale", "carton", "dozen"
  qty_per_unit?: number; // e.g. 1, 6, 12, 50
  price: number;         // price for ONE unit (e.g. price per bale)
  min_qty?: number;      // minimum units to qualify (optional)
  max_qty?: number | null;
  unit_price?: number;
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
  min_order_qty?: number;
  order_qty_step?: number;
  selling_unit_label?: string;
  pricing_label?: string;
  rule_type?: PricingRuleType;
  wholesale_eligible?: boolean;
  threshold_quantity?: number | null;
}

export interface Order {
  id: string;
  order_number?: string;
  status: string;
  order_status?: string;
  payment_status?: string;
  payment_state?: string;
  settlement_label?: string;
  total: number;
  total_amount?: number;
  amount_paid?: number;
  balance_due?: number;
  items: CartItem[];
  item_count?: number;
  total_items?: number;
  created_at: string;
  updated_at?: string;
  status_changed_at?: string;
  last_payment_date?: string;
  customer_name?: string;
  customer_phone_masked?: string;
  delivery_address?: string;
  current_tracking_stage?: string;
  tracking_summary?: string;
  tracking_token?: string;
  tracking_url?: string;
  tracking_token_verified?: boolean;
  access_level?: "secure_link" | "manual_verification" | string;
}
