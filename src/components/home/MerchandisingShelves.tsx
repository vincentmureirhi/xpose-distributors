import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Baby, GraduationCap, Scissors } from "lucide-react";
import ProductCard from "@/components/products/ProductCard";
import { getHomeMerchandising, type HomeMerchandisingResult } from "@/lib/api/collections";

const tabs = [
  { key: "trending", label: "Trending", href: "/deals" },
  { key: "wholesale", label: "Wholesale corner", href: "/wholesale" },
  { key: "under_500", label: "Under KSh 500", href: "/under-500" },
  { key: "new_arrivals", label: "New arrivals", href: "/new-arrivals" },
] as const;

export default function MerchandisingShelves() {
  const [data, setData] = useState<HomeMerchandisingResult | null>(null);
  const [active, setActive] = useState<(typeof tabs)[number]["key"]>("trending");

  useEffect(() => {
    let mounted = true;
    getHomeMerchandising().then((result) => { if (mounted) setData(result); }).catch(() => undefined);
    return () => { mounted = false; };
  }, []);

  const products = useMemo(() => data?.[active]?.slice(0, 10) || [], [active, data]);
  if (!data || !tabs.some((tab) => data[tab.key]?.length)) return null;
  const current = tabs.find((tab) => tab.key === active) || tabs[0];

  return (
    <section className="container py-12 md:py-16">
      <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-accent">Picked from live stock</p>
          <h2 className="mt-2 font-display text-3xl font-black tracking-tight sm:text-4xl">Buy what is moving</h2>
        </div>
        <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActive(tab.key)}
              className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-black transition-colors ${active === tab.key ? "border-accent bg-accent text-accent-foreground" : "border-border bg-card hover:border-accent/45"}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {products.map((product, index) => <ProductCard key={`${active}-${product.id}`} product={product} index={index} />)}
      </div>

      <div className="mt-7 flex justify-center">
        <Link to={current.href} className="inline-flex h-11 items-center gap-2 rounded-full border border-border px-5 text-sm font-black hover:border-accent hover:text-accent">
          Shop {current.label.toLowerCase()} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-12 grid gap-3 sm:grid-cols-3">
        {[
          [Scissors, "Salon supplies", "/salon-supplies", "Hair, styling and salon restocks"],
          [Baby, "Baby care", "/baby-care", "Everyday baby-care essentials"],
          [GraduationCap, "Back to school", "/back-to-school", "Personal-care and household picks"],
        ].map(([Icon, label, href, copy]) => {
          const NeedIcon = Icon as typeof Scissors;
          return (
            <Link key={String(href)} to={String(href)} className="group flex items-center gap-4 rounded-2xl border border-border bg-secondary/40 p-4 hover:border-accent/45 hover:bg-accent/5">
              <div className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl bg-background text-accent shadow-soft"><NeedIcon className="h-5 w-5" /></div>
              <div className="min-w-0"><p className="font-black group-hover:text-accent">{String(label)}</p><p className="mt-1 truncate text-xs text-muted-foreground">{String(copy)}</p></div>
              <ArrowRight className="ml-auto h-4 w-4 flex-shrink-0" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
