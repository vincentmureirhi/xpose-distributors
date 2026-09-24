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
import { getFlashSaleFeed, type FlashSaleData } from "@/lib/api/flash-sales";
import { listPublicCampaigns, type PublicCampaign } from "@/lib/api/marketing";
import { listPublicVendorStores, type VendorStore } from "@/lib/api/vendor-portal";
import type { Product, Category } from "@/types/shop";

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeSale, setActiveSale] = useState<FlashSaleData | null>(null);
  const [campaigns, setCampaigns] = useState<PublicCampaign[]>([]);
  const [vendors, setVendors] = useState<VendorStore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "XPOSE Beauty Shop Limited | Shop Beauty, Hair and Household Supplies";

    let mounted = true;
    let refreshInFlight = false;
    let refreshTimer: number | undefined;
    let scheduledStartTimer: number | undefined;

    const scheduleNextStart = (sale: FlashSaleData | undefined) => {
      if (scheduledStartTimer !== undefined) {
        window.clearTimeout(scheduledStartTimer);
        scheduledStartTimer = undefined;
      }

      if (!sale?.start_date) return;

      const delay = Math.max(0, new Date(sale.start_date).getTime() - Date.now());

      // The timer is based on the sale's actual start timestamp, so an
      // already-open storefront does not have to wait for a polling cycle.
      scheduledStartTimer = window.setTimeout(() => {
        if (mounted) void refreshFlashSale();
      }, Math.min(delay + 250, 2_147_483_647));
    };

    const refreshFlashSale = async () => {
      if (!mounted || refreshInFlight) return;
      refreshInFlight = true;

      try {
        const feed = await getFlashSaleFeed();
        if (!mounted) return;

        const sale = feed.active[0];

        if (sale?.end_date && sale.products.length > 0) {
          setActiveSale(sale);
          if (scheduledStartTimer !== undefined) {
            window.clearTimeout(scheduledStartTimer);
            scheduledStartTimer = undefined;
          }
        } else {
          setActiveSale(null);
          scheduleNextStart(feed.upcoming[0]);
        }
      } finally {
        refreshInFlight = false;
      }
    };

    void refreshFlashSale();

    // Safety net for missed timers, sleeping tabs, and clock drift.
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
      if (scheduledStartTimer !== undefined) window.clearTimeout(scheduledStartTimer);
    };
  }, []);

  const flashProducts = activeSale?.products ?? [];

  return (
    <>
      <Hero products={products} />
      <Marquee />

      {activeSale?.end_date && flashProducts.length > 0 && (
        <FlashSale
          products={flashProducts}
          endDate={activeSale.end_date}
          saleName={activeSale.name}
        />
      )}

      {loading ? (
        <section className="container py-10 md:py-14">
          <div className="mb-6 h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="aspect-[4/5] animate-pulse rounded bg-muted md:aspect-square" />
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
