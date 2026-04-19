import { useEffect, useState } from "react";
import Hero from "@/components/home/Hero";
import Marquee from "@/components/home/Marquee";
import ValueProps from "@/components/home/ValueProps";
import FlashSale from "@/components/home/FlashSale";
import CategoryRail from "@/components/home/CategoryRail";
import FeaturedGrid from "@/components/home/FeaturedGrid";
import { listProducts } from "@/lib/api/products";
import { listCategories } from "@/lib/api/categories";
import { getActiveFlashSales, type FlashSaleData } from "@/lib/api/flash-sales";
import type { Product, Category } from "@/types/shop";

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeFlashSale, setActiveFlashSale] = useState<FlashSaleData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "XPOSE — Modern marketplace for everything you love";
    Promise.all([listProducts(), listCategories(), getActiveFlashSales()])
      .then(([p, c, flashSales]) => {
        setCategories(c);

        // Apply flash sale discounts to products
        if (flashSales.length > 0) {
          const sale = flashSales[0];
          setActiveFlashSale(sale);
          const flashMap = new Map<number | string, number>();
          sale.products.forEach((fp) => {
            if (fp.discounted_price) flashMap.set(fp.id, fp.discounted_price);
          });
          if (flashMap.size > 0) {
            setProducts(
              p.map((prod) => {
                const discounted = flashMap.get(prod.id);
                return discounted ? { ...prod, discounted_price: discounted, is_flash: true } : prod;
              })
            );
            return;
          }
        }
        setProducts(p);
      })
      .finally(() => setLoading(false));
  }, []);

  const flashProducts = activeFlashSale
    ? products.filter((p) => p.is_flash || p.discounted_price)
    : [];

  return (
    <>
      <Hero />
      <Marquee />
      <ValueProps />
      {activeFlashSale && activeFlashSale.end_date && flashProducts.length > 0 && (
        <FlashSale
          products={flashProducts}
          endDate={activeFlashSale.end_date}
          saleName={activeFlashSale.name}
        />
      )}
      {loading ? (
        <section className="container py-16 md:py-24">
          <div className="h-8 w-48 bg-muted animate-pulse rounded mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[4/5] md:aspect-square rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        </section>
      ) : (
        <>
          <CategoryRail categories={categories} />
          <FeaturedGrid products={products.slice(0, 8)} />
        </>
      )}
    </>
  );
}
