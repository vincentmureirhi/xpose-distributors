import { useEffect, useState } from "react";
import Hero from "@/components/home/Hero";
import Marquee from "@/components/home/Marquee";
import ValueProps from "@/components/home/ValueProps";
import FlashSale from "@/components/home/FlashSale";
import CategoryRail from "@/components/home/CategoryRail";
import FeaturedGrid from "@/components/home/FeaturedGrid";
import { listProducts } from "@/lib/api/products";
import { listCategories } from "@/lib/api/categories";
import type { Product, Category } from "@/types/shop";

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    document.title = "XPOSE — Modern marketplace for everything you love";
    Promise.all([listProducts(), listCategories()]).then(([p, c]) => {
      setProducts(p);
      setCategories(c);
    });
  }, []);

  return (
    <>
      <Hero />
      <Marquee />
      <ValueProps />
      <FlashSale products={products.filter((p) => p.is_flash).concat(products).slice(0, 4)} />
      <CategoryRail categories={categories} />
      <FeaturedGrid products={products.slice(0, 8)} />
    </>
  );
}
