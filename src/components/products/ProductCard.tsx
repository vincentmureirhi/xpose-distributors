import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingBag, Star, Flame } from "lucide-react";
import type { Product } from "@/types/shop";
import { useCart, formatPrice } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { getPriceTiers } from "@/lib/pricing";

interface Props {
  product: Product;
  index?: number;
}

export default function ProductCard({ product, index = 0 }: Props) {
  const { addToCart } = useCart();
  const tiersList = getPriceTiers(product);
  const piece = tiersList.find((t) => (t.qty_per_unit || 1) === 1);
  const bulkTiers = tiersList.filter((t) => (t.qty_per_unit || 1) > 1);
  const lowestPerPiece = tiersList.reduce((min, t) => {
    const perPiece = t.price / Math.max(1, t.qty_per_unit || 1);
    return perPiece < min ? perPiece : min;
  }, Number.POSITIVE_INFINITY);
  const savePct = piece && isFinite(lowestPerPiece) && lowestPerPiece < piece.price
    ? Math.round(((piece.price - lowestPerPiece) / piece.price) * 100)
    : null;

  const hasFlashDeal = !!(product.discounted_price && product.discounted_price < (product.retail_price || product.price || Infinity));
  const displayPrice = hasFlashDeal ? product.discounted_price! : (piece?.price ?? 0);
  const originalPrice = hasFlashDeal ? (piece?.price ?? product.retail_price ?? 0) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.04, 0.4) }}
      className="group"
    >
      <div className="tilt-card bg-card rounded-2xl overflow-hidden border border-border hover:border-foreground/20 hover:shadow-elevated transition-all duration-500">
        <Link to={`/products/${product.id}`} className="block relative aspect-square overflow-hidden bg-secondary shine-overlay">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-accent/20 via-primary/10 to-accent-glow/20">
              <span className="font-display font-bold text-5xl text-primary/40 select-none">
                {product.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {(product.is_flash || hasFlashDeal) && (
              <span className="px-2.5 py-1 rounded-full bg-accent text-accent-foreground text-[10px] font-bold uppercase tracking-wider shadow-glow flex items-center gap-1">
                <Flame className="h-3 w-3" /> Flash
              </span>
            )}
            {savePct && savePct > 0 && !hasFlashDeal && (
              <span className="px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">Save {savePct}% in bulk</span>
            )}
            {product.is_sponsored && (
              <span className="px-2.5 py-1 rounded-full bg-background/90 backdrop-blur text-foreground text-[10px] font-semibold uppercase tracking-wider">Sponsored</span>
            )}
          </div>
        </Link>

        <div className="p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="truncate">{product.category_name}</span>
            {product.rating ? (
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-accent text-accent" />
                {product.rating.toFixed(1)}
              </span>
            ) : null}
          </div>
          <Link to={`/products/${product.id}`}>
            <h3 className="font-medium text-sm leading-snug line-clamp-2 hover:text-accent transition-colors min-h-[2.5rem]">{product.name}</h3>
          </Link>

          <div className="pt-1 space-y-1">
            {hasFlashDeal ? (
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[11px] uppercase tracking-wider text-accent font-semibold">Flash price</span>
                <div className="text-right">
                  {originalPrice && (
                    <span className="text-[11px] text-muted-foreground line-through mr-1">{formatPrice(originalPrice)}</span>
                  )}
                  <span className="font-display font-bold text-base leading-none text-accent">{formatPrice(displayPrice)}</span>
                </div>
              </div>
            ) : (
              <>
                {piece && (
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground">1 piece</span>
                    <span className="font-display font-bold text-base leading-none">{formatPrice(piece.price)}</span>
                  </div>
                )}
                {bulkTiers.slice(0, 2).map((t) => (
                  <div key={t.unit} className="flex items-baseline justify-between gap-2">
                    <span className="text-[11px] uppercase tracking-wider text-accent font-semibold">
                      1 {t.unit}{t.qty_per_unit ? ` · ${t.qty_per_unit}pc` : ""}
                    </span>
                    <span className="font-display font-semibold text-sm leading-none">{formatPrice(t.price)}</span>
                  </div>
                ))}
              </>
            )}
          </div>

          <div className="flex items-center justify-end pt-2">
            <Button
              size="sm"
              onClick={(e) => { e.preventDefault(); addToCart(product); }}
              className="h-9 rounded-full bg-foreground text-background hover:bg-accent hover:text-accent-foreground transition-all shadow-soft hover:shadow-glow gap-2"
              aria-label="Add to cart"
            >
              <ShoppingBag className="h-4 w-4" />
              Add
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
