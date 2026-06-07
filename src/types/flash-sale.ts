export interface FlashSaleProduct {
  id: number;
  name: string;
  sku?: string;
  retail_price: number;
  image_url?: string;
  category_name?: string;
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