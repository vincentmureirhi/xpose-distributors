import { useEffect, useState } from "react";
import Hero from "@/components/home/Hero";
import Marquee from "@/components/home/Marquee";
import ValueProps from "@/components/home/ValueProps";
import FlashSale from "@/components/home/FlashSale";
import CategoryRail from "@/components/home/CategoryRail";
import FeaturedGrid from "@/components/home/FeaturedGrid";
import { listProducts } from "@/lib/api/products";
import { listCategories } from "@/lib/api/categories";
import { getActiveFlashSales } from "@/lib/api/flash-sales";
import type { Product, Category } from "@/types/shop";

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [flashEndDate, setFlashEndDate] = useState<string | undefined>(undefined);

  useEffect(() => {
    document.title = "XPOSE — Modern marketplace for everything you love";
    Promise.all([listProducts(), listCategories(), getActiveFlashSales()]).then(([p, c, flashSales]) => {
      setProducts(p);
      setCategories(c);
      if (flashSales.length > 0 && flashSales[0].end_date) {
        setFlashEndDate(flashSales[0].end_date);
        // Merge flash sale discounted prices into products
        const flashMap = new Map<number | string, number>();
        flashSales.forEach((sale) => {
          sale.products.forEach((fp) => {
            if (fp.discounted_price) flashMap.set(fp.id, fp.discounted_price);
          });
        });
        if (flashMap.size > 0) {
          setProducts(p.map((prod) => {
            const discounted = flashMap.get(prod.id);
            return discounted ? { ...prod, discounted_price: discounted, is_flash: true } : prod;
          }));
        }
      }
    });
  }, []);

  const flashProducts = products.filter((p) => p.is_flash || p.discounted_price);
  const displayFlashProducts = flashProducts.length > 0
    ? flashProducts
    : products.slice(0, 4);

  return (
    <>
      <Hero />
      <Marquee />
      <ValueProps />
      <FlashSale products={displayFlashProducts} endDate={flashEndDate} />
      <CategoryRail categories={categories} />
      <FeaturedGrid products={products.slice(0, 8)} />
    </>
  );
}
