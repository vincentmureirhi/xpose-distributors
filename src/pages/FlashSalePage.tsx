import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, CalendarClock, Flame, TimerReset } from "lucide-react";
import ProductCard from "@/components/products/ProductCard";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/context/CartContext";
import { getFlashSaleFeed, type FlashSaleData } from "@/lib/api/flash-sales";
import type { Product } from "@/types/shop";

interface TimeLeft {
  d: number;
  h: number;
  m: number;
  s: number;
  done: boolean;
}

function calcTime(target?: string): TimeLeft {
  if (!target) return { d: 0, h: 0, m: 0, s: 0, done: true };
  const diff = Math.max(0, new Date(target).getTime() - Date.now());
  const total = Math.floor(diff / 1000);
  return {
    d: Math.floor(total / 86400),
    h: Math.floor((total % 86400) / 3600),
    m: Math.floor((total % 3600) / 60),
    s: total % 60,
    done: diff === 0,
  };
}

function useCountdown(target?: string) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calcTime(target));

  useEffect(() => {
    setTimeLeft(calcTime(target));
    if (!target) return;
    const id = window.setInterval(() => setTimeLeft(calcTime(target)), 1000);
    return () => window.clearInterval(id);
  }, [target]);

  return timeLeft;
}

function discountLabel(sale: FlashSaleData) {
  return sale.discount_type === "percentage"
    ? `${Number(sale.discount_value).toLocaleString()}% off`
    : `${formatPrice(Number(sale.discount_value))} off`;
}

function CountdownPanel({ label, target }: { label: string; target?: string }) {
  const t = useCountdown(target);
  const parts = [
    ["D", t.d],
    ["H", t.h],
    ["M", t.m],
    ["S", t.s],
  ] as const;

  return (
    <div className="rounded-lg border border-white/15 bg-black/35 p-4 shadow-2xl backdrop-blur">
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-200">
        <TimerReset className="h-4 w-4" />
        {label}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {parts.map(([unit, value]) => (
          <div key={unit} className="rounded-md border border-white/10 bg-white/[0.06] px-2 py-3 text-center">
            <div className="font-display text-2xl font-black leading-none text-white md:text-4xl">
              {String(value).padStart(2, "0")}
            </div>
            <div className="mt-1 text-[10px] font-semibold tracking-wider text-white/45">{unit}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SaleStage({ sale, products }: { sale: FlashSaleData; products: Product[] }) {
  const preview = products.slice(0, 4);
  const center = (preview.length - 1) / 2;

  return (
    <div className="relative min-h-[390px] overflow-hidden rounded-lg border border-white/10 bg-[#111318] p-5 shadow-2xl sm:p-6 md:min-h-[430px]">
      <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(115deg,transparent_0_48%,rgba(255,255,255,.12)_49%,transparent_50%)] [background-size:28px_28px]" />
      <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-rose-500 via-amber-300 to-cyan-300" />

      <div className="relative z-10 flex h-full flex-col justify-between gap-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/35 bg-amber-300/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-200">
            <Flame className="h-3.5 w-3.5" />
            Live deal
          </div>
          <h2 className="mt-5 max-w-sm font-display text-4xl font-black leading-none tracking-tight text-white md:text-6xl">
            {discountLabel(sale)}
          </h2>
          <p className="mt-3 max-w-sm text-sm leading-6 text-white/55">{sale.description || sale.name}</p>
        </div>

        <div className="flash-stage relative mx-auto h-56 w-full max-w-md overflow-visible md:h-64">
          {preview.map((product, index) => (
            <motion.div
              key={product.id}
              className="absolute left-1/2 top-1/2 h-40 w-32 overflow-hidden rounded-md border border-white/15 bg-white shadow-2xl md:h-52 md:w-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.35, delay: index * 0.08 }}
              style={{
                transform: `translate(-50%, -50%) translateX(${(index - center) * 54}px) rotateZ(${(index - center) * 6}deg)`,
                zIndex: 10 + index,
              }}
            >
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="h-full w-full object-contain p-3" />
              ) : (
                <div className="grid h-full w-full place-items-center bg-gradient-to-br from-rose-500/60 via-amber-300/50 to-cyan-300/50">
                  <span className="font-display text-4xl font-black text-white/80">
                    {product.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-black/65 p-2 text-[10px] font-semibold leading-tight text-white">
                {product.name}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function UpcomingDeal({ sale }: { sale: FlashSaleData }) {
  const starts = useCountdown(sale.start_date);
  const sample = sale.products.slice(0, 3);

  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <CalendarClock className="h-3.5 w-3.5" />
            Upcoming
          </div>
          <h3 className="font-display text-xl font-bold">{sale.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{discountLabel(sale)}</p>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          Starts in
          <div className="mt-1 font-display text-lg font-black text-foreground">
            {starts.d > 0 ? `${starts.d}d ` : ""}
            {String(starts.h).padStart(2, "0")}h {String(starts.m).padStart(2, "0")}m
          </div>
        </div>
      </div>
      {sample.length > 0 && (
        <div className="mt-5 flex -space-x-3">
          {sample.map((product) => (
            <div key={product.id} className="h-14 w-14 overflow-hidden rounded-md border-2 border-card bg-secondary">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center text-sm font-bold text-muted-foreground">
                  {product.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="container py-16 md:py-24">
      <div className="grid gap-8 lg:grid-cols-[1fr_460px]">
        <div className="space-y-5">
          <div className="h-6 w-36 rounded bg-muted" />
          <div className="h-16 w-full max-w-xl rounded bg-muted" />
          <div className="h-5 w-full max-w-md rounded bg-muted" />
          <div className="h-32 w-full max-w-lg rounded-lg bg-muted" />
        </div>
        <div className="h-80 rounded-lg bg-muted" />
      </div>
    </div>
  );
}

export default function FlashSalePage() {
  const [activeSales, setActiveSales] = useState<FlashSaleData[]>([]);
  const [upcomingSales, setUpcomingSales] = useState<FlashSaleData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Flash Sale - XPOSE";
    getFlashSaleFeed()
      .then((feed) => {
        setActiveSales(feed.active);
        setUpcomingSales(feed.upcoming);
      })
      .finally(() => setLoading(false));
  }, []);

  const activeSale = useMemo(
    () => activeSales.find((sale) => sale.products.length > 0) || activeSales[0] || null,
    [activeSales]
  );
  const products = activeSale?.products || [];

  if (loading) return <LoadingState />;

  if (!activeSale && upcomingSales.length === 0) {
    return (
      <div className="container py-24 text-center">
        <div className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-full bg-secondary">
          <Flame className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="font-display text-4xl font-black tracking-tight">No flash sale is live.</h1>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">No live deal right now. Check back for the next drop.</p>
        <Button asChild className="mt-7">
          <Link to="/products">Browse products</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0d10] text-white">
      {activeSale && (
        <section className="relative overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 [background-image:linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,.05)_1px,transparent_1px)] [background-size:42px_42px]" />
          <div className="container relative grid gap-8 py-12 md:py-16 lg:grid-cols-[1fr_520px] lg:items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="max-w-2xl"
            >
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-200">
                <Flame className="h-3.5 w-3.5" />
                Flash sale live
              </div>
              <h1 className="font-display text-5xl font-black leading-none tracking-tight md:text-7xl">
                {activeSale.name}
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-white/65 md:text-lg">
                {activeSale.description || `${products.length} products are currently running on flash-sale pricing.`}
              </p>

              <div className="mt-7 max-w-xl">
                <CountdownPanel label="Ends in" target={activeSale.end_date} />
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Button asChild className="bg-amber-300 text-black hover:bg-amber-200">
                  <a href="#flash-products">
                    Shop live deals <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                <Button asChild variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10">
                  <Link to="/products">Full catalogue</Link>
                </Button>
              </div>
            </motion.div>

            <SaleStage sale={activeSale} products={products} />
          </div>
        </section>
      )}

      {activeSale && (
        <section id="flash-products" className="bg-background text-foreground">
          <div className="container py-12 md:py-16">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-accent">Live flash prices</p>
                <h2 className="mt-2 font-display text-3xl font-black tracking-tight md:text-5xl">Deals available now</h2>
              </div>
              <p className="text-sm text-muted-foreground">{products.length} {products.length === 1 ? "product" : "products"}</p>
            </div>

            {products.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
                {products.map((product, index) => (
                  <ProductCard key={product.id} product={{ ...product, is_flash: true }} index={index} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border py-16 text-center text-muted-foreground">
                Products will appear here when the next deal is ready.
              </div>
            )}
          </div>
        </section>
      )}

      {upcomingSales.length > 0 && (
        <section className="bg-secondary/35 text-foreground">
          <div className="container py-12 md:py-16">
            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Upcoming deals</p>
              <h2 className="mt-2 font-display text-3xl font-black tracking-tight md:text-4xl">Next flash drops</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {upcomingSales.map((sale) => (
                <UpcomingDeal key={sale.id} sale={sale} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
