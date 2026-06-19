export interface FlashSaleProduct {
  id: number;
  name: string;
  sku?: string;
  retail_price: number;
  price?: number;
  image_url?: string;
  category_name?: string;
  is_active?: boolean;
  stock?: number | null;
  current_stock?: number | null;
  product_current_stock?: number | null;
  stock_source?: "product" | "pool" | string;
  stock_pool_id?: number | string | null;
  stock_pool_name?: string | null;
  stock_pool_sku?: string | null;
  stock_pool_total_stock?: number | null;
  stock_pool_note?: string | null;
  stock_status?: "in_stock" | "limited_stock" | "low_stock" | "out_of_stock" | "unknown" | string;
  min_order_qty?: number;
  order_qty_step?: number;
  selling_unit_label?: string;
  discounted_price: number;
}

export interface FlashSaleData {
  id: number;
  name: string;
  description?: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  product_count: number;
  products: FlashSaleProduct[];
}
