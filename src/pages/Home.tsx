import { useEffect, useState } from "react";
import Hero from "@/components/home/Hero";
import Marquee from "@/components/home/Marquee";
import FlashSale from "@/components/home/FlashSale";
import CategoryRail from "@/components/home/CategoryRail";
import CampaignSpotlight from "@/components/home/CampaignSpotlight";
import MerchandisingShelves from "@/components/home/MerchandisingShelves";
import TopVendors from "@/components/home/TopVendors";
import BlogPreview from "@/components/home/BlogPreview";
import { listFeaturedStorefrontProducts } from "@/lib/api/products";
import { listStorefrontCategories } from "@/lib/api/categories";
import { getActiveFlashSaleSummary } from "@/lib/api/flash-sales";
import { listPublicCampaigns, type PublicCampaign } from "@/lib/api/marketing";
import { listPublicVendorStores, type VendorStore } from "@/lib/api/vendor-portal";
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
  const [vendors, setVendors] = useState<VendorStore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "XPOSE Beauty Shop Limited | Shop Beauty, Hair and Household Supplies";

    // Flash Sale is time-sensitive and independent of the other homepage
    // requests. It is fetched immediately instead of waiting for them.
    let mounted = true;
    let refreshInFlight = false;
    let refreshTimer: number | undefined;

    const refreshFlashSale = async () => {
      if (!mounted || refreshInFlight) return;
      refreshInFlight = true;

      try {
        const flashSales = await getActiveFlashSaleSummary();
        if (!mounted) return;

        const sale = flashSales[0] as ActiveSale | undefined;
        if (sale?.end_date && Array.isArray(sale.products) && sale.products.length > 0) {
          setActiveSale(sale);
          if (refreshTimer !== undefined) {
            window.clearInterval(refreshTimer);
            refreshTimer = undefined;
          }
        } else {
          setActiveSale(null);
        }
      } finally {
        refreshInFlight = false;
      }
    };

    void refreshFlashSale();

    // If the homepage was already open when Admin activates a sale, check
    // briefly until it appears. Once found, stop polling completely.
    refreshTimer = window.setInterval(() => {
      if (document.visibilityState !== "hidden") void refreshFlashSale();
    }, 5000);

    Promise.all([
      listFeaturedStorefrontProducts(20),
      listStorefrontCategories(),
      listPublicCampaigns(8).catch(() => []),
      listPublicVendorStores().catch(() => []),
    ])
      .then(([featuredProducts, categoryRows, activeCampaigns, vendorRows]) => {
        setCategories(categoryRows);
        setCampaigns(activeCampaigns);
        setVendors(vendorRows);
        setProducts(featuredProducts);
      })
      .catch((error) => {
        if (import.meta.env.DEV) console.error("Failed loading homepage data:", error);
      })
      .finally(() => setLoading(false));

    return () => {
      mounted = false;
      if (refreshTimer !== undefined) window.clearInterval(refreshTimer);
    };
  }, []);

  useEffect(() => {
    if (!activeSale || !products.length) return;

    const flashMap = new Map<number | string, number>();
    activeSale.products.forEach((product) => {
      if (product.discounted_price != null) {
        flashMap.set(product.id, product.discounted_price);
      }
    });

    if (!flashMap.size) return;

    setProducts((currentProducts) =>
      currentProducts.map((product) => {
        const discountedPrice = flashMap.get(product.id);
        return discountedPrice == null
          ? { ...product, is_flash: false }
          : { ...product, discounted_price: discountedPrice, is_flash: true };
      })
    );
  }, [activeSale, products.length]);

  const flashProducts = activeSale
    ? products.filter((product) => product.is_flash === true)
    : [];

  return (
    <>
      <Hero products={products} />
      <Marquee />

      {activeSale?.end_date && flashProducts.length > 0 && (
        <FlashSale products={flashProducts} endDate={activeSale.end_date} saleName={activeSale.name} />
      )}

      {loading ? (
        <section className="container py-10 md:py-14">
          <div className="mb-6 h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="aspect-[4/5] animate-pulse rounded-lg bg-muted md:aspect-square" />
            ))}
          </div>
        </section>
      ) : (
        <CategoryRail categories={categories} />
      )}
      <CampaignSpotlight campaigns={campaigns} />
      <MerchandisingShelves />
      <TopVendors vendors={vendors} />
      <BlogPreview />
    </>
  );
}
