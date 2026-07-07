import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, MessageCircle, Search, ShoppingBag, Tags } from "lucide-react";
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
  const tracksStock = stockValue !== undefined && stockValue !== null && stockValue !== "" && Number.isFinite(stockQty);
  return !["out_of_stock", "sold_out", "unavailable"].includes(status) && (!tracksStock || stockQty > 0);
}

function circularOffset(index: number, activeIndex: number, total: number) {
  let offset = index - activeIndex;
  if (offset > total / 2) offset -= total;
  if (offset < -total / 2) offset += total;
  return offset;
}

interface HeroProps {
  products?: Product[];
}

export default function Hero({ products = [] }: HeroProps) {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [search, setSearch] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const sync = () => setIsDesktop(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const heroProducts = useMemo(
    () => products.filter((item) => item.image_url && isProductAvailable(item)).slice(0, 5),
    [products]
  );

  useEffect(() => {
    if (reduceMotion || heroProducts.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % heroProducts.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [heroProducts.length, reduceMotion]);

  useEffect(() => {
    if (activeIndex >= heroProducts.length) setActiveIndex(0);
  }, [activeIndex, heroProducts.length]);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = search.trim();
    navigate(`/products${query ? `?search=${encodeURIComponent(query)}` : ""}`);
  };

  const activeProduct = heroProducts[activeIndex] || null;
  const activePrice = activeProduct ? getDisplayPrice(activeProduct) : 0;
  const activeOriginalPrice = Number(activeProduct?.retail_price || activeProduct?.price || 0);
  const activeHasDiscount = Boolean(
    activeProduct && Number(activeProduct.discounted_price || 0) > 0 && Number(activeProduct.discounted_price) < activeOriginalPrice
  );

  return (
    <section className="relative overflow-hidden bg-[#080b10] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_30%,rgba(255,91,46,0.24),transparent_28%),radial-gradient(circle_at_72%_75%,rgba(16,185,129,0.15),transparent_26%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:48px_48px]" />

      <div className="container relative grid items-center gap-6 py-6 sm:py-8 lg:min-h-[500px] lg:grid-cols-[minmax(0,1fr)_minmax(430px,1fr)] lg:gap-5 lg:py-9">
        <div className="relative z-20 max-w-2xl">
          <p className="mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-accent sm:mb-3 sm:text-xs">
            Retail, wholesale and route supply
          </p>
          <h1 className="font-display text-[2rem] font-black leading-[1.02] text-balance sm:text-5xl lg:text-[3.45rem] xl:text-6xl">
            Beauty, Hair, Baby Care
            <span className="block text-accent">&amp; Household Supplies</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-white/72 sm:mt-4 sm:text-lg sm:leading-7">
            Live-stock essentials for personal shoppers, resellers and route customers.
          </p>

          <form onSubmit={submitSearch} className="mt-4 flex max-w-xl items-center gap-1.5 rounded-xl bg-white p-1.5 shadow-[0_24px_70px_rgba(0,0,0,0.36)] sm:mt-6 sm:gap-2">
            <Search className="ml-2 h-4 w-4 flex-shrink-0 text-slate-500 sm:ml-3" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="What are you buying today?"
              className="h-10 min-w-0 flex-1 border-0 bg-transparent px-1 text-sm font-semibold text-slate-950 outline-none placeholder:font-normal placeholder:text-slate-500 sm:h-11 sm:text-base"
              aria-label="Search products"
            />
            <Button type="submit" size="icon" className="h-10 w-10 flex-shrink-0 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 sm:h-11 sm:w-auto sm:px-4">
              <span className="hidden sm:inline">Search</span><ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="mt-3 flex flex-wrap gap-2 sm:mt-4">
            <Button asChild className="h-10 rounded-lg bg-white px-4 font-black text-slate-950 hover:bg-white/90 sm:h-11 sm:px-5">
              <Link to="/deals"><ShoppingBag className="h-4 w-4" /> Shop deals</Link>
            </Button>
            <Button asChild variant="outline" className="h-10 rounded-lg border-white/25 bg-white/5 px-4 font-black text-white hover:bg-white/10 hover:text-white sm:h-11 sm:px-5">
              <Link to="/categories"><Tags className="h-4 w-4" /> Categories</Link>
            </Button>
            <Button asChild variant="outline" size="icon" className="h-10 w-10 rounded-lg border-[#25D366]/50 bg-[#25D366]/10 text-[#5ee787] hover:bg-[#25D366]/20 hover:text-[#75f097] sm:h-11 sm:w-11">
              <a href="https://wa.me/254701377869?text=Hello%20XPOSE%2C%20I%20need%20help%20shopping." target="_blank" rel="noopener noreferrer" aria-label="Shop with XPOSE on WhatsApp"><MessageCircle className="h-5 w-5" /></a>
            </Button>
          </div>
        </div>

        {!isDesktop && (
          <div className="relative z-10">
          {activeProduct ? (
            <>
              <motion.div
                key={activeProduct.id}
                initial={reduceMotion ? false : { opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25 }}
              >
                <Link
                  to={`/products/${activeProduct.id}`}
                  className="grid min-h-[154px] grid-cols-[118px_minmax(0,1fr)] overflow-hidden rounded-2xl border border-white/15 bg-white text-slate-950 shadow-[0_20px_55px_rgba(0,0,0,0.34)]"
                >
                  <div className="relative bg-gradient-to-br from-slate-50 to-white p-3">
                    {activeHasDiscount && <span className="absolute left-2 top-2 z-10 rounded-full bg-accent px-2 py-1 text-[9px] font-black uppercase text-accent-foreground">Deal</span>}
                    <img src={activeProduct.image_url} alt={activeProduct.name} className="h-full w-full object-contain drop-shadow-lg" />
                  </div>
                  <div className="flex min-w-0 flex-col justify-center p-4">
                    <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Available now</p>
                    <p className="mt-1 line-clamp-2 text-sm font-black leading-5">{activeProduct.name}</p>
                    <div className="mt-3">
                      {activeHasDiscount && <p className="text-[11px] font-semibold text-slate-400 line-through">{formatPrice(activeOriginalPrice)}</p>}
                      <p className="text-xl font-black leading-none text-accent">{formatPrice(activePrice)}</p>
                    </div>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-black">View product <ArrowRight className="h-3.5 w-3.5" /></span>
                  </div>
                </Link>
              </motion.div>
              <div className="mt-3 flex justify-center gap-2">
                {heroProducts.map((product, index) => (
                  <button key={product.id} type="button" aria-label={`Show ${product.name}`} onClick={() => setActiveIndex(index)} className={`h-2 rounded-full transition-all ${index === activeIndex ? "w-7 bg-accent" : "w-2 bg-white/35"}`} />
                ))}
              </div>
            </>
          ) : (
            <div className="grid min-h-[150px] place-items-center rounded-2xl border border-white/10 bg-white/5"><ShoppingBag className="h-10 w-10 text-accent" /></div>
          )}
        </div>

        )}

        {isDesktop && (
          <div className="relative z-10 h-[440px]">
          {heroProducts.length > 0 ? (
            <>
              <div className="absolute inset-0 flex items-center justify-center" style={{ perspective: "1200px", transformStyle: "preserve-3d" }}>
                {heroProducts.map((product, index) => {
                  const offset = circularOffset(index, activeIndex, heroProducts.length);
                  const distance = Math.abs(offset);
                  const visible = distance <= 2;
                  const active = offset === 0;
                  const price = getDisplayPrice(product);
                  const originalPrice = Number(product.retail_price || product.price || 0);
                  const hasDiscount = Number(product.discounted_price || 0) > 0 && Number(product.discounted_price) < originalPrice;

                  return (
                    <motion.div
                      key={product.id}
                      animate={{ x: offset * 118, z: active ? 95 : -distance * 125, rotateY: offset * -24, rotateZ: offset * 2.5, scale: active ? 1 : 0.82 - distance * 0.05, opacity: visible ? (active ? 1 : 0.62 - distance * 0.16) : 0 }}
                      transition={{ type: "spring", stiffness: 105, damping: 18, mass: 0.9 }}
                      className={`absolute w-[245px] ${visible ? "pointer-events-auto" : "pointer-events-none"}`}
                      style={{ transformStyle: "preserve-3d", zIndex: 20 - distance }}
                    >
                      <button type="button" onClick={() => active ? navigate(`/products/${product.id}`) : setActiveIndex(index)} className={`group w-full overflow-hidden rounded-[28px] border text-left shadow-[0_30px_80px_rgba(0,0,0,0.46)] transition-colors ${active ? "border-accent/65 bg-white" : "border-white/15 bg-white/90"}`} aria-label={active ? `Shop ${product.name}` : `Show ${product.name}`}>
                        <div className="relative h-[285px] overflow-hidden bg-gradient-to-b from-slate-50 to-white p-5">
                          {hasDiscount && <span className="absolute left-3 top-3 z-10 rounded-full bg-accent px-3 py-1 text-[10px] font-black uppercase tracking-wider text-accent-foreground">Deal</span>}
                          <motion.img src={product.image_url} alt={product.name} className="h-full w-full object-contain drop-shadow-[0_22px_18px_rgba(15,23,42,0.22)]" animate={active && !reduceMotion ? { y: [0, -9, 0], rotateY: [-3, 4, -3] } : { y: 0 }} transition={active && !reduceMotion ? { duration: 4, repeat: Infinity, ease: "easeInOut" } : { duration: 0.3 }} />
                        </div>
                        <div className="p-4 text-slate-950">
                          <p className="line-clamp-2 min-h-[40px] text-base font-black leading-5">{product.name}</p>
                          <div className="mt-3 flex items-end justify-between gap-2">
                            <div>{hasDiscount && <p className="text-[11px] font-semibold text-slate-400 line-through">{formatPrice(originalPrice)}</p>}<p className="text-lg font-black text-accent">{formatPrice(price)}</p></div>
                            <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-950 text-white"><ArrowRight className="h-4 w-4" /></span>
                          </div>
                        </div>
                      </button>
                    </motion.div>
                  );
                })}
              </div>
              <div className="absolute bottom-1 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-2 backdrop-blur-md">
                {heroProducts.map((product, index) => <button key={product.id} type="button" aria-label={`Show ${product.name}`} onClick={() => setActiveIndex(index)} className={`h-2 rounded-full transition-all ${index === activeIndex ? "w-8 bg-accent" : "w-2 bg-white/35 hover:bg-white/65"}`} />)}
              </div>
            </>
          ) : (
            <div className="absolute inset-8 grid place-items-center rounded-[28px] border border-white/10 bg-white/5"><ShoppingBag className="h-12 w-12 text-accent" /></div>
          )}
          </div>
        )}
      </div>
    </section>
  );
}
