import { useEffect, useState } from "react";
import Hero from "@/components/home/Hero";
import Marquee from "@/components/home/Marquee";
import ValueProps from "@/components/home/ValueProps";
import FlashSale from "@/components/home/FlashSale";
import CategoryRail from "@/components/home/CategoryRail";
import FeaturedGrid from "@/components/home/FeaturedGrid";
import SmartProductRail from "@/components/home/SmartProductRail";
import BlogPreview from "@/components/home/BlogPreview";
import { listFeaturedStorefrontProducts } from "@/lib/api/products";
import { listStorefrontCategories } from "@/lib/api/categories";
import { getActiveFlashSales } from "@/lib/api/flash-sales";
import type { Product, Category } from "@/types/shop";

// Inline type so we don't depend on ../types/flash-sale having the right fields
interface ActiveSale {
  id: number;
  name: string;
  end_date: string;
  products: Array<{
    id: number | string;
    discounted_price?: number | null;
    [key: string]: unknown;
  }>;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeSale, setActiveSale] = useState<ActiveSale | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "XPOSE Distributors | Wholesale and Retail Deals";

    Promise.all([listFeaturedStorefrontProducts(20), listStorefrontCategories(), getActiveFlashSales()])
      .then(([p, c, flashSales]) => {
        setCategories(c);

        if (flashSales.length > 0) {
          const sale = flashSales[0] as unknown as ActiveSale;
          const saleProducts = Array.isArray(sale.products) ? sale.products : [];

          // Build a map of product_id to discounted_price from the sale's product list
          const flashMap = new Map<number | string, number>();
          saleProducts.forEach((fp) => {
            if (fp.discounted_price != null) {
              flashMap.set(fp.id, fp.discounted_price as number);
            }
          });

          if (flashMap.size > 0 && sale.end_date) {
            setActiveSale(sale);
            setProducts(
              p.map((prod) => {
                const discounted = flashMap.get(prod.id);
                return discounted != null
                  ? { ...prod, discounted_price: discounted, is_flash: true }
                  : prod;
              })
            );
            return;
          }
        }

        setProducts(p);
      })
      .catch((error) => {
        console.error("Failed loading homepage data:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Only products tagged by the flash map above are shown in the sale section
  const flashProducts: Product[] = activeSale
    ? products.filter((p) => p.is_flash === true || p.discounted_price != null)
    : [];

  return (
    <>
      <Hero products={products} />
      <Marquee />
      <ValueProps />

      {activeSale && activeSale.end_date && flashProducts.length > 0 && (
        <FlashSale
          products={flashProducts}
          endDate={activeSale.end_date}
          saleName={activeSale.name}
        />
      )}

      {loading ? (
        <section className="container py-16 md:py-24">
          <div className="h-8 w-48 bg-muted animate-pulse rounded mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[4/5] md:aspect-square rounded-2xl bg-muted animate-pulse"
              />
            ))}
          </div>
        </section>
      ) : (
        <>
          <CategoryRail categories={categories} />
          <SmartProductRail products={products} />
          <FeaturedGrid products={products.slice(0, 8)} />
        </>
      )}

      <BlogPreview />
    </>
  );
}
