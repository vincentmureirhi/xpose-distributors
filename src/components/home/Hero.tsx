import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, BadgePercent, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/context/CartContext";
import type { Product } from "@/types/shop";

function getDisplayPrice(product: Product) {
  return Number(product.discounted_price || product.retail_price || product.price || 0);
}

function isProductAvailable(product: Product) {
  const status = String(product.stock_status_override || product.stock_status || "").toLowerCase();
  const stockValue = product.current_stock ?? product.stock;
  const stockQty = Number(stockValue);
  const hasStockQty = stockValue !== undefined && stockValue !== null && stockValue !== "" && Number.isFinite(stockQty);
  return status !== "out_of_stock" && status !== "sold_out" && status !== "unavailable" && (!hasStockQty || stockQty > 0);
}

interface HeroProps {
  products?: Product[];
}

export default function Hero({ products = [] }: HeroProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const heroProducts = useMemo(
    () => products.filter((item) => (item.image_url || item.name) && isProductAvailable(item)).slice(0, 5),
    [products]
  );
  const activeProduct = heroProducts[activeIndex % Math.max(heroProducts.length, 1)];

  useEffect(() => {
    if (heroProducts.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % heroProducts.length);
    }, 4600);
    return () => window.clearInterval(timer);
  }, [heroProducts.length]);

  useEffect(() => {
    if (activeIndex >= heroProducts.length) setActiveIndex(0);
  }, [activeIndex, heroProducts.length]);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = search.trim();
    navigate(`/products${query ? `?search=${encodeURIComponent(query)}` : ""}`);
  };

  return (
    <section className="relative overflow-hidden bg-[#0b0f14] text-white">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:52px_52px]" />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(11,15,20,0.99),rgba(11,15,20,0.84)_54%,rgba(16,24,32,0.97))]" />

      <div className="container relative grid items-center gap-7 py-8 sm:py-10 md:min-h-[520px] md:grid-cols-[minmax(0,1.12fr)_minmax(280px,0.58fr)] md:gap-10 md:py-10">
        <div className="max-w-3xl">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-3 text-[11px] font-bold uppercase tracking-wider text-accent sm:text-xs"
          >
            Beauty / Hair / Baby care / Household
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.05 }}
            className="max-w-3xl font-display text-4xl font-black leading-[1.02] text-balance sm:text-5xl md:text-5xl lg:text-6xl"
          >
            Wholesale &amp; retail
            <span className="block text-accent">essentials.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.14 }}
            className="mt-4 max-w-2xl text-sm leading-6 text-white/70 sm:text-base md:text-lg"
          >
            Single items, trade packs and cartons from XPOSE Distributors, with live prices and stock.
          </motion.p>

          <motion.form
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.21 }}
            onSubmit={submitSearch}
            className="mt-5 flex max-w-xl items-center gap-2 rounded-lg border border-white/15 bg-white p-1 shadow-[0_18px_50px_rgba(0,0,0,0.24)]"
          >
            <Search className="ml-3 h-4 w-4 flex-shrink-0 text-slate-500" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search the catalogue"
              className="h-10 min-w-0 flex-1 border-0 bg-transparent px-1 text-sm text-slate-950 outline-none placeholder:text-slate-500 sm:text-base"
              aria-label="Search the XPOSE catalogue"
            />
            <Button type="submit" className="h-10 rounded-md bg-accent px-4 text-accent-foreground hover:bg-accent/90">
              <span className="hidden sm:inline">Search</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.form>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.28 }}
            className="mt-4 flex flex-wrap gap-2"
          >
            <Button asChild className="h-10 rounded-md bg-accent px-5 text-accent-foreground shadow-glow hover:bg-accent/90">
              <Link to="/products">Shop products <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="outline" className="h-10 rounded-md border-white/25 bg-white/5 px-5 text-white hover:bg-white/10 hover:text-white">
              <Link to="/flash-sale"><BadgePercent className="h-4 w-4" /> Flash deals</Link>
            </Button>
          </motion.div>
        </div>

        {activeProduct ? (
          <div className="relative">
            <Link
              to={`/products/${activeProduct.id}`}
              className="flex items-center gap-3 rounded-lg border border-white/12 bg-white/8 p-3 shadow-[0_18px_50px_rgba(0,0,0,0.22)] md:hidden"
            >
              <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-white p-2">
                {activeProduct.image_url ? (
                  <img src={activeProduct.image_url} alt={activeProduct.name} className="h-full w-full object-contain" />
                ) : (
                  <div className="grid h-full w-full place-items-center text-xl font-black text-accent">{activeProduct.name.charAt(0)}</div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-accent">Available now</p>
                <p className="mt-1 line-clamp-1 text-sm font-black text-white">{activeProduct.name}</p>
                {getDisplayPrice(activeProduct) > 0 && <p className="mt-1 text-xs font-semibold text-white/75">{formatPrice(getDisplayPrice(activeProduct))}</p>}
              </div>
              <ArrowRight className="ml-auto h-4 w-4 flex-shrink-0 text-accent" />
            </Link>

            <div className="relative hidden h-[360px] items-center justify-center md:flex">
              <div className="absolute left-1/2 top-0 -translate-x-1/2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80">
                Available now
              </div>
              <motion.div
                key={activeProduct.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="w-full max-w-[250px]"
              >
                <Link to={`/products/${activeProduct.id}`} className="group block overflow-hidden rounded-lg border border-white/15 bg-white p-3 shadow-[0_28px_80px_rgba(0,0,0,0.34)] transition-transform duration-300 hover:-translate-y-1">
                  <div className="flex h-52 items-center justify-center overflow-hidden rounded-md bg-slate-50">
                    {activeProduct.image_url ? (
                      <img src={activeProduct.image_url} alt={activeProduct.name} className="h-full w-full object-contain p-3 transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-5xl font-black text-accent">{activeProduct.name.charAt(0)}</div>
                    )}
                  </div>
                  <div className="mt-3">
                    <p className="line-clamp-2 text-base font-black leading-tight text-slate-950">{activeProduct.name}</p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-500">{activeProduct.selling_unit_label || "piece"}</span>
                      {getDisplayPrice(activeProduct) > 0 && <span className="text-base font-black text-slate-950">{formatPrice(getDisplayPrice(activeProduct))}</span>}
                    </div>
                  </div>
                </Link>
              </motion.div>

              {heroProducts.length > 1 && (
                <div className="absolute bottom-0 left-1/2 flex -translate-x-1/2 gap-2">
                  {heroProducts.map((product, index) => (
                    <button
                      key={product.id}
                      type="button"
                      aria-label={`Show ${product.name}`}
                      onClick={() => setActiveIndex(index)}
                      className={`h-2 rounded-full transition-all ${index === activeIndex ? "w-7 bg-accent" : "w-2 bg-white/35"}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="hidden h-[300px] place-items-center rounded-lg border border-white/10 bg-white/5 text-center md:grid">
            <div>
              <Search className="mx-auto h-8 w-8 text-accent" />
              <p className="mt-3 text-lg font-black">Search the catalogue</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}