import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, PackageCheck, Search, ShieldCheck, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listProducts } from "@/lib/api/products";
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

export default function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 70]);
  const shelfY = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const opacity = useTransform(scrollYProgress, [0, 0.86], [1, 0]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    listProducts()
      .then((items) => setProducts(items.filter((item) => (item.image_url || item.name) && isProductAvailable(item)).slice(0, 7)))
      .catch(() => {});
  }, []);

  const productCount = products.length;
  const heroProducts = useMemo(() => products.slice(0, 5), [products]);

  const stats = [
    { v: productCount > 0 ? `${productCount}+` : "Live", l: "Featured items" },
    { v: "Carton", l: "And piece pricing" },
    { v: "Kenya", l: "Route delivery" },
  ];

  const trustSignals = [
    { icon: ShieldCheck, title: "Secure checkout", text: "Private order tracking after purchase." },
    { icon: PackageCheck, title: "Live stock", text: "Shelf highlights available products first." },
    { icon: Truck, title: "Route-ready", text: "Built for shops, homes, and sales reps." },
  ];

  return (
    <section ref={ref} className="relative overflow-hidden bg-[#0b0f14] text-white">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.055)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:56px_56px]" />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(11,15,20,0.98),rgba(11,15,20,0.76)_48%,rgba(16,24,32,0.94))]" />

      <div className="container relative grid min-h-[calc(100vh-5rem)] items-center gap-10 py-16 md:grid-cols-[minmax(0,1fr)_minmax(340px,0.78fr)] md:py-20 lg:py-24">
        <motion.div style={{ opacity, y: contentY }} className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase text-white/75 backdrop-blur"
          >
            <PackageCheck className="h-3.5 w-3.5 text-accent" />
            XPOSE Distributors
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.08 }}
            className="font-display text-5xl font-black leading-[0.95] text-balance md:text-7xl lg:text-8xl"
          >
            Wholesale power.
            <span className="block text-accent">Retail speed.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.22 }}
            className="mt-6 max-w-2xl text-base leading-relaxed text-white/70 md:text-xl"
          >
            Order trade packs, cartons, everyday essentials, and flash deals from one catalogue built for homes, shops, salons, routes, and resellers.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.34 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Button asChild size="lg" className="h-12 rounded-full bg-accent px-7 text-accent-foreground shadow-glow hover:bg-accent/90">
              <Link to="/products">
                Start shopping
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 rounded-full border-white/25 bg-white/5 px-7 text-white hover:bg-white/10 hover:text-white">
              <Link to="/flash-sale">View flash deals</Link>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.46 }}
            className="mt-5 grid max-w-2xl gap-2 sm:grid-cols-3"
          >
            {trustSignals.map((signal) => {
              const Icon = signal.icon;
              return (
                <div key={signal.title} className="rounded-xl border border-white/12 bg-[#101820]/95 p-3 shadow-[0_18px_50px_rgba(0,0,0,0.2)]">
                  <div className="mb-2 flex items-center gap-2 text-sm font-bold text-white">
                    <Icon className="h-4 w-4 text-accent" />
                    {signal.title}
                  </div>
                  <p className="text-xs leading-relaxed text-white/70">{signal.text}</p>
                </div>
              );
            })}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.52 }}
            className="mt-5 grid max-w-xl grid-cols-3 gap-3"
          >
            {stats.map((s) => (
              <div key={s.l} className="rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur">
                <p className="font-display text-2xl font-black md:text-3xl">{s.v}</p>
                <p className="mt-1 text-[11px] font-semibold uppercase text-white/55">{s.l}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div style={{ y: shelfY }} className="relative min-h-[390px] md:min-h-[520px]">
          <div className="absolute inset-x-4 bottom-7 h-4 rounded-full bg-black/35 blur-xl" />
          <div className="absolute left-0 top-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold text-white/80 backdrop-blur">
            Live catalogue
          </div>

          {heroProducts.length > 0 ? (
            heroProducts.map((product, index) => {
              const positions = [
                "left-[2%] top-[17%] w-[46%] rotate-[-5deg]",
                "right-[2%] top-[6%] w-[42%] rotate-[4deg]",
                "left-[18%] bottom-[19%] w-[48%] rotate-[2deg]",
                "right-[1%] bottom-[10%] w-[38%] rotate-[-3deg]",
                "left-[0%] bottom-[2%] w-[34%] rotate-[5deg]",
              ];

              return (
                <Link
                  key={product.id}
                  to={`/products/${product.id}`}
                  className={`absolute ${positions[index % positions.length]} group block`}
                >
                  <div className="overflow-hidden rounded-2xl border border-white/12 bg-white p-3 shadow-[0_28px_80px_rgba(0,0,0,0.32)] transition-transform duration-500 group-hover:-translate-y-2">
                    <div className="aspect-square overflow-hidden rounded-xl bg-white">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="h-full w-full object-contain" />
                      ) : (
                        <div className="grid h-full w-full place-items-center bg-secondary text-3xl font-black text-accent">
                          {product.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="mt-3">
                      <p className="line-clamp-1 text-sm font-black text-slate-950">{product.name}</p>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold text-slate-500">
                          {product.selling_unit_label || "piece"}
                        </span>
                        <span className="text-sm font-black text-slate-950">{formatPrice(getDisplayPrice(product))}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="absolute inset-0 grid place-items-center rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur">
              <div>
                <Search className="mx-auto mb-4 h-10 w-10 text-accent" />
                <p className="font-display text-3xl font-black">Catalogue loading</p>
                <p className="mt-2 text-sm text-white/60">Live products will appear here.</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
