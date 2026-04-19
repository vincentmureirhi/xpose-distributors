import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Minus, Plus, Share2, ShoppingBag, Star, Truck, RotateCcw, ShieldCheck, ChevronRight, Check } from "lucide-react";
import { getProductById, listProducts } from "@/lib/api/products";
import { useCart, formatPrice } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/products/ProductCard";
import type { Product } from "@/types/shop";
import { getPriceTiers } from "@/lib/pricing";
import AnimatedPrice from "@/components/AnimatedPrice";

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState<string>("");

  const tiersList = useMemo(() => (product ? getPriceTiers(product) : []), [product]);
  useEffect(() => {
    if (tiersList.length) setSelectedUnit(tiersList[0].unit);
  }, [tiersList]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setQty(1);
    window.scrollTo(0, 0);
    Promise.all([getProductById(id), listProducts()]).then(([p, all]) => {
      setProduct(p);
      if (p) {
        document.title = `${p.name} — XPOSE`;
        setRelated(all.filter((x) => x.category_id === p.category_id && x.id !== p.id).slice(0, 4));
      }
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="container py-16 grid md:grid-cols-2 gap-10">
        <div className="aspect-square rounded-3xl bg-muted animate-pulse" />
        <div className="space-y-4">
          <div className="h-8 w-2/3 bg-muted animate-pulse rounded" />
          <div className="h-4 w-1/3 bg-muted animate-pulse rounded" />
          <div className="h-20 bg-muted animate-pulse rounded" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container py-32 text-center">
        <h1 className="font-display font-bold text-3xl">Product not found</h1>
        <Button asChild className="mt-6"><Link to="/products">Back to shop</Link></Button>
      </div>
    );
  }




  return (
    <div className="container py-10 md:py-14">
      <nav className="flex items-center gap-1 text-xs text-muted-foreground mb-6">
        <Link to="/" className="hover:text-foreground">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link to="/products" className="hover:text-foreground">Shop</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground truncate">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-16">
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
          <div className="aspect-square rounded-3xl overflow-hidden bg-secondary shine-overlay relative group">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
            ) : (
              <div className="h-full w-full grid place-items-center bg-gradient-to-br from-accent/20 via-primary/10 to-accent-glow/20">
                <span className="font-display font-bold text-8xl text-primary/40 select-none">
                  {product.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            {product.is_flash && (
              <span className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-bold uppercase tracking-wider shadow-glow">Flash sale</span>
            )}
          </div>
        </motion.div>

        <div className="md:sticky md:top-24 md:self-start space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{product.category_name}</p>
            <h1 className="font-display font-bold text-3xl md:text-5xl tracking-tight leading-tight">{product.name}</h1>
            {product.rating && (
              <div className="flex items-center gap-2 mt-3">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < Math.round(product.rating!) ? "fill-accent text-accent" : "text-muted-foreground/30"}`} />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">{product.rating.toFixed(1)} ({product.reviews_count} reviews)</span>
              </div>
            )}
          </motion.div>

          {(() => {
            const selectedTier = tiersList.find((t) => t.unit === selectedUnit) || tiersList[0];
            const piecePrice = tiersList.find((t) => (t.qty_per_unit || 1) === 1)?.price ?? 0;
            const unitPrice = selectedTier?.price ?? 0;
            const perPiece = selectedTier ? unitPrice / Math.max(1, selectedTier.qty_per_unit || 1) : 0;
            const savePct = selectedTier && (selectedTier.qty_per_unit || 1) > 1 && piecePrice > 0 && perPiece < piecePrice
              ? Math.round(((piecePrice - perPiece) / piecePrice) * 100)
              : null;
            const activeIndex = Math.max(0, tiersList.findIndex((t) => t.unit === selectedUnit));
            return (
              <>
                {/* Apple-style segmented pill switcher */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.12 }} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">Pack size</p>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Live pricing</span>
                  </div>

                  <div
                    className="relative inline-flex w-full p-1 rounded-full bg-secondary border border-border"
                    style={{ ['--seg-count' as any]: tiersList.length, ['--seg-index' as any]: activeIndex }}
                  >
                    <motion.span
                      layout
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      className="absolute top-1 bottom-1 rounded-full bg-background shadow-soft border border-border"
                      style={{
                        width: `calc((100% - 0.5rem) / ${tiersList.length})`,
                        left: `calc(0.25rem + ((100% - 0.5rem) / ${tiersList.length}) * ${activeIndex})`,
                      }}
                    />
                    {tiersList.map((t) => {
                      const active = t.unit === selectedUnit;
                      return (
                        <button
                          key={t.unit}
                          onClick={() => setSelectedUnit(t.unit)}
                          className={`relative z-10 flex-1 px-3 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors ${active ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                        >
                          {t.unit}
                          {t.qty_per_unit && t.qty_per_unit > 1 ? (
                            <span className="ml-1 normal-case tracking-normal text-[10px] opacity-70">·{t.qty_per_unit}pc</span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>

                  {/* One big animated price */}
                  <div className="flex items-end justify-between gap-4 pt-1">
                    <div>
                      <AnimatedPrice
                        value={unitPrice}
                        className="block font-display font-bold text-4xl md:text-5xl tracking-tight leading-none tabular-nums"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        per 1 {selectedTier?.unit}
                        {selectedTier?.qty_per_unit && selectedTier.qty_per_unit > 1
                          ? ` · ${formatPrice(Math.round(perPiece))}/piece`
                          : ""}
                      </p>
                    </div>
                    {savePct ? (
                      <motion.span
                        key={`save-${savePct}`}
                        initial={{ scale: 0.85, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 22 }}
                        className="shrink-0 px-3 py-1.5 rounded-full bg-accent/15 text-accent text-[11px] font-bold uppercase tracking-wider"
                      >
                        Save {savePct}%/pc
                      </motion.span>
                    ) : null}
                  </div>
                </motion.div>

                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-muted-foreground leading-relaxed">
                  {product.description || "A beautifully crafted product, made with care."}
                </motion.p>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="flex flex-wrap items-center gap-3 pt-2">
                  <div className="flex items-center gap-1 bg-secondary rounded-full p-1">
                    <button onClick={() => setQty(Math.max(1, qty - 1))} className="h-9 w-9 rounded-full grid place-items-center hover:bg-background transition-colors" aria-label="Decrease">
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-10 text-center font-semibold">{qty}</span>
                    <button onClick={() => setQty(qty + 1)} className="h-9 w-9 rounded-full grid place-items-center hover:bg-background transition-colors" aria-label="Increase">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <Button
                    size="lg"
                    className="h-12 flex-1 bg-gradient-accent text-accent-foreground border-0 shadow-glow hover:opacity-95"
                    onClick={() => addToCart({ ...product, retail_price: unitPrice, name: `${product.name} (1 ${selectedTier?.unit || "piece"})` } as Product, qty)}
                  >
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    <AnimatePresence mode="wait">
                      <motion.span key={unitPrice + "-" + qty} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
                        Add {qty} {selectedTier?.unit}{qty > 1 ? "s" : ""} — {formatPrice(unitPrice * qty)}
                      </motion.span>
                    </AnimatePresence>
                  </Button>
                  <Button size="icon" variant="outline" className="h-12 w-12" aria-label="Save"><Heart className="h-4 w-4" /></Button>
                  <Button size="icon" variant="outline" className="h-12 w-12" aria-label="Share"><Share2 className="h-4 w-4" /></Button>
                </motion.div>
              </>
            );
          })()}

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="grid grid-cols-3 gap-3 pt-4 border-t border-border">
            {[
              { icon: Truck, t: "Free shipping" },
              { icon: RotateCcw, t: "30-day returns" },
              { icon: ShieldCheck, t: "Authentic" },
            ].map((it) => (
              <div key={it.t} className="text-center">
                <it.icon className="h-5 w-5 mx-auto text-accent mb-1" />
                <p className="text-xs text-muted-foreground">{it.t}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-24">
          <h2 className="font-display font-bold text-2xl md:text-3xl mb-6">You may also like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {related.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        </section>
      )}
    </div>
  );
}
