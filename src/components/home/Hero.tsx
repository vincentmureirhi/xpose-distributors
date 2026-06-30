import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, BadgePercent, PackageCheck, Search } from "lucide-react";
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
  const supportingProducts = useMemo(() => {
    if (heroProducts.length <= 1) return [];
    return [1, 2]
      .map((offset) => heroProducts[(activeIndex + offset) % heroProducts.length])
      .filter(Boolean);
  }, [activeIndex, heroProducts]);

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
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:52px_52px]" />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(11,15,20,0.99),rgba(11,15,20,0.8)_48%,rgba(16,24,32,0.96))]" />

      <div className="container relative grid items-center gap-8 py-9 sm:py-11 md:min-h-[640px] md:grid-cols-[minmax(0,1.05fr)_minmax(330px,0.75fr)] md:gap-10 md:py-14">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-bold uppercase text-white/75"
          >
            <PackageCheck className="h-3.5 w-3.5 text-accent" />
            XPOSE Distributors
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.06 }}
            className="max-w-4xl font-display text-4xl font-black leading-[0.98] text-balance sm:text-5xl md:text-6xl lg:text-7xl"
          >
            Beauty, hair, baby care
            <span className="block text-accent">and household supplies.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.16 }}
            className="mt-5 max-w-2xl text-sm leading-6 text-white/70 sm:text-base md:text-lg"
          >
            Shop retail pieces, wholesale packs, flash deals and route-ready stock from one live catalogue.
          </motion.p>

          <motion.form
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.24 }}
            onSubmit={submitSearch}
            className="mt-6 flex max-w-2xl items-center gap-2 rounded-lg border border-white/15 bg-white p-1.5 shadow-[0_20px_60px_rgba(0,0,0,0.25)]"
          >
            <Search className="ml-3 h-5 w-5 flex-shrink-0 text-slate-500" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products, brands or categories"
              className="h-11 min-w-0 flex-1 border-0 bg-transparent px-1 text-base text-slate-950 outline-none placeholder:text-slate-500"
              aria-label="Search the XPOSE catalogue"
            />
            <Button type="submit" className="h-11 rounded-md bg-accent px-4 text-accent-foreground hover:bg-accent/90 sm:px-6">
              <span className="hidden sm:inline">Search</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.form>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.32 }}
            className="mt-5 flex flex-wrap gap-3"
          >
            <Button asChild size="lg" className="h-11 rounded-md bg-accent px-6 text-accent-foreground shadow-glow hover:bg-accent/90">
              <Link to="/products">
                Shop products <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-11 rounded-md border-white/25 bg-white/5 px-6 text-white hover:bg-white/10 hover:text-white">
              <Link to="/flash-sale">
                <BadgePercent className="h-4 w-4" /> Flash deals
              </Link>
            </Button>
          </motion.div>
        </div>

        {activeProduct ? (
          <div className="relative">
            <Link
              to={`/products/${activeProduct.id}`}
              className="flex items-center gap-3 rounded-lg border border-white/12 bg-white/8 p-3 shadow-[0_18px_50px_rgba(0,0,0,0.22)] md:hidden"
            >
              <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-white p-2">
                {activeProduct.image_url ? (
                  <img src={activeProduct.image_url} alt={activeProduct.name} className="h-full w-full object-contain" />
                ) : (
                  <div className="grid h-full w-full place-items-center text-2xl font-black text-accent">{activeProduct.name.charAt(0)}</div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-accent">Available now</p>
                <p className="mt-1 line-clamp-2 text-sm font-black leading-tight text-white">{activeProduct.name}</p>
                {getDisplayPrice(activeProduct) > 0 && (
                  <p className="mt-1 text-sm font-semibold text-white/75">{formatPrice(getDisplayPrice(activeProduct))}</p>
                )}
              </div>
              <ArrowRight className="ml-auto h-4 w-4 flex-shrink-0 text-accent" />
            </Link>

            <div className="relative hidden h-[440px] md:block">
              <div className="absolute left-2 top-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80">
                Live catalogue
              </div>
              {supportingProducts.map((product, index) => (
                <Link
                  key={product.id}
                  to={`/products/${product.id}`}
                  className={`absolute w-32 rounded-lg border border-white/12 bg-white p-2.5 shadow-[0_24px_70px_rgba(0,0,0,0.25)] transition-transform hover:-translate-y-1 ${index === 0 ? "right-1 top-12 rotate-[5deg] opacity-80" : "bottom-14 left-0 rotate-[-6deg] opacity-70"}`}
                >
                  <div className="aspect-square rounded-md bg-slate-50 p-2">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="h-full w-full object-contain" />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-2xl font-black text-accent">{product.name.charAt(0)}</div>
                    )}
                  </div>
                  <p className="mt-2 line-clamp-1 text-xs font-black text-slate-950">{product.name}</p>
                </Link>
              ))}

              <motion.div
                key={activeProduct.id}
                initial={{ opacity: 0, y: 14, rotate: -1 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                transition={{ duration: 0.4 }}
                className="absolute left-1/2 top-1/2 w-[74%] max-w-[285px] -translate-x-1/2 -translate-y-1/2"
              >
                <Link to={`/products/${activeProduct.id}`} className="group block overflow-hidden rounded-lg border border-white/15 bg-white p-3 shadow-[0_32px_90px_rgba(0,0,0,0.36)] transition-transform duration-300 hover:-translate-y-1">
                  <div className="aspect-square overflow-hidden rounded-md bg-slate-50">
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
                <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
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
          <div className="hidden h-[360px] place-items-center rounded-lg border border-white/10 bg-white/5 text-center md:grid">
            <div>
              <Search className="mx-auto h-9 w-9 text-accent" />
              <p className="mt-3 text-xl font-black">Find what you need</p>
              <p className="mt-1 text-sm text-white/60">Search the live catalogue above.</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}