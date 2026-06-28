import { useEffect, useState } from "react";
import Hero from "@/components/home/Hero";
import Marquee from "@/components/home/Marquee";
import ValueProps from "@/components/home/ValueProps";
import FlashSale from "@/components/home/FlashSale";
import CategoryRail from "@/components/home/CategoryRail";
import FeaturedGrid from "@/components/home/FeaturedGrid";
import SmartProductRail from "@/components/home/SmartProductRail";
import CampaignSpotlight from "@/components/home/CampaignSpotlight";
import BlogPreview from "@/components/home/BlogPreview";
import { listFeaturedStorefrontProducts } from "@/lib/api/products";
import { listStorefrontCategories } from "@/lib/api/categories";
import { getActiveFlashSales } from "@/lib/api/flash-sales";
import { listPublicCampaigns, type PublicCampaign } from "@/lib/api/marketing";
import type { Product, Category } from "@/types/shop";

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
  const [campaigns, setCampaigns] = useState<PublicCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "XPOSE Distributors | Wholesale and Retail Deals";

    Promise.all([
      listFeaturedStorefrontProducts(20),
      listStorefrontCategories(),
      getActiveFlashSales(),
      listPublicCampaigns(8).catch(() => []),
    ])
      .then(([featuredProducts, categoryRows, flashSales, activeCampaigns]) => {
        setCategories(categoryRows);
        setCampaigns(activeCampaigns);

        if (flashSales.length > 0) {
          const sale = flashSales[0] as unknown as ActiveSale;
          const flashMap = new Map<number | string, number>();
          (Array.isArray(sale.products) ? sale.products : []).forEach((product) => {
            if (product.discounted_price != null) flashMap.set(product.id, product.discounted_price);
          });

          if (flashMap.size > 0 && sale.end_date) {
            setActiveSale(sale);
            setProducts(featuredProducts.map((product) => {
              const discountedPrice = flashMap.get(product.id);
              return discountedPrice == null
                ? product
                : { ...product, discounted_price: discountedPrice, is_flash: true };
            }));
            return;
          }
        }

        setProducts(featuredProducts);
      })
      .catch((error) => {
        if (import.meta.env.DEV) console.error("Failed loading homepage data:", error);
      })
      .finally(() => setLoading(false));
  }, []);

  const flashProducts = activeSale
    ? products.filter((product) => product.is_flash === true || product.discounted_price != null)
    : [];

  return (
    <>
      <Hero products={products} />
      <Marquee />
      <ValueProps />
      <CampaignSpotlight campaigns={campaigns} />

      {activeSale?.end_date && flashProducts.length > 0 && (
        <FlashSale products={flashProducts} endDate={activeSale.end_date} saleName={activeSale.name} />
      )}

      {loading ? (
        <section className="container py-16 md:py-24">
          <div className="mb-8 h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="aspect-[4/5] animate-pulse rounded-lg bg-muted md:aspect-square" />
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