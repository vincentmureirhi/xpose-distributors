import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingBag, Flame } from "lucide-react";
import { useRef } from "react";
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
  const imageBoxRef = useRef<HTMLAnchorElement>(null);
  const tiersList = getPriceTiers(product);
  const piece = tiersList.find((t) => (t.qty_per_unit || 1) === 1);
  const baseTier = piece ?? tiersList[0];
  const secondaryTiers = tiersList.filter((t) => t !== baseTier).slice(0, 2);
  const lowestPerPiece = tiersList.reduce((min, t) => {
    const perPiece = t.price / Math.max(1, t.qty_per_unit || 1);
    return perPiece < min ? perPiece : min;
  }, Number.POSITIVE_INFINITY);
  const savePct = piece && isFinite(lowestPerPiece) && lowestPerPiece < piece.price
    ? Math.round(((piece.price - lowestPerPiece) / piece.price) * 100)
    : null;

  const hasFlashDeal = !!(product.discounted_price && product.discounted_price < (product.retail_price || product.price || Infinity));
  const localBasePrice = baseTier?.price ?? Number(product.retail_price || product.price || 0);
  const minOrderQty = Math.max(1, Number(product.min_order_qty || baseTier?.min_qty || 1));
  const orderStep = Math.max(1, Number(product.order_qty_step || 1));
  const sellingUnit = product.selling_unit_label || "piece";
  const addQuantity = Math.max(minOrderQty, Number(baseTier?.min_qty || 1));
  const displayPrice = hasFlashDeal ? product.discounted_price! : localBasePrice;
  const originalPrice = hasFlashDeal ? (localBasePrice || product.retail_price || 0) : null;
  const baseTierLabel = baseTier?.label || (baseTier?.min_qty && baseTier.min_qty > 1 ? `${baseTier.min_qty}+ pcs` : "1 piece");
  const tierLabel = (tier: typeof baseTier) => {
    if (!tier) return "";
    if (tier.label) return tier.label;
    if (tier.min_qty && tier.min_qty > 1) return tier.max_qty ? `${tier.min_qty}-${tier.max_qty} pcs` : `${tier.min_qty}+ pcs`;
    return `1 ${tier.unit}${tier.qty_per_unit && tier.qty_per_unit > 1 ? ` - ${tier.qty_per_unit}pc` : ""}`;
  };

  const runFlyToCart = () => {
    if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const source = imageBoxRef.current;
    const target = document.querySelector("[data-cart-button='true']") as HTMLElement | null;
    if (!source || !target) return;

    const start = source.getBoundingClientRect();
    const end = target.getBoundingClientRect();
    const size = Math.min(88, Math.max(54, start.width * 0.32));
    const flyer = document.createElement("div");

    flyer.style.position = "fixed";
    flyer.style.left = `${start.left + start.width / 2 - size / 2}px`;
    flyer.style.top = `${start.top + start.height / 2 - size / 2}px`;
    flyer.style.width = `${size}px`;
    flyer.style.height = `${size}px`;
    flyer.style.borderRadius = "18px";
    flyer.style.zIndex = "9999";
    flyer.style.pointerEvents = "none";
    flyer.style.boxShadow = "0 18px 45px rgba(0,0,0,0.25)";
    flyer.style.border = "1px solid rgba(255,255,255,0.65)";
    flyer.style.backgroundColor = "white";
    flyer.style.backgroundPosition = "center";
    flyer.style.backgroundRepeat = "no-repeat";
    flyer.style.backgroundSize = "contain";

    if (product.image_url) {
      flyer.style.backgroundImage = `url("${product.image_url}")`;
    } else {
      flyer.textContent = product.name.charAt(0).toUpperCase();
      flyer.style.display = "grid";
      flyer.style.placeItems = "center";
      flyer.style.fontWeight = "800";
      flyer.style.color = "hsl(var(--accent))";
    }

    document.body.appendChild(flyer);
    const deltaX = end.left + end.width / 2 - (start.left + start.width / 2);
    const deltaY = end.top + end.height / 2 - (start.top + start.height / 2);

    flyer.animate(
      [
        { transform: "translate3d(0,0,0) scale(1)", opacity: 1 },
        { transform: `translate3d(${deltaX * 0.45}px, ${deltaY * 0.3 - 80}px, 0) scale(0.8)`, opacity: 0.95 },
        { transform: `translate3d(${deltaX}px, ${deltaY}px, 0) scale(0.2) rotate(10deg)`, opacity: 0 },
      ],
      { duration: 820, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
    ).onfinish = () => flyer.remove();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.04, 0.4) }}
      className="group relative"
    >
      <div className="tilt-card bg-card rounded-2xl overflow-hidden border border-border hover:border-foreground/20 hover:shadow-elevated transition-all duration-500">
        <Link
          ref={imageBoxRef}
          to={`/products/${product.id}`}
          className="block relative aspect-square overflow-hidden bg-white shine-overlay"
        >
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-contain p-4 transition-transform duration-700 group-hover:scale-105"
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
                {baseTier && (
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{baseTierLabel}</span>
                    <span className="font-display font-bold text-base leading-none">{formatPrice(baseTier.price)}</span>
                  </div>
                )}
                {secondaryTiers.map((t) => (
                  <div key={t.unit} className="flex items-baseline justify-between gap-2">
                    <span className="text-[11px] uppercase tracking-wider text-accent font-semibold">
                      {tierLabel(t)}
                    </span>
                    <span className="font-display font-semibold text-sm leading-none">{formatPrice(t.price)}</span>
                  </div>
                ))}
              </>
            )}
          </div>

          {(minOrderQty > 1 || orderStep > 1) && (
            <p className="text-[11px] text-muted-foreground">
              Min {minOrderQty} {sellingUnit}{minOrderQty === 1 ? "" : "s"}
              {orderStep > 1 ? ` - step ${orderStep}` : ""}
            </p>
          )}

          <div className="flex items-center justify-end pt-2">
            <Button
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                runFlyToCart();
                addToCart(product, addQuantity, displayPrice);
              }}
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
