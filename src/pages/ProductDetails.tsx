import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronRight,
  Heart,
  Minus,
  Plus,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from "lucide-react";
import AnimatedPrice from "@/components/AnimatedPrice";
import ProductCard from "@/components/products/ProductCard";
import { Button } from "@/components/ui/button";
import { formatPrice, useCart } from "@/context/CartContext";
import { getProductById, listProducts } from "@/lib/api/products";
import { getPriceTiers } from "@/lib/pricing";
import { getProductPricingMessages, isRuleDrivenType } from "@/lib/pricingMessaging";
import type { PriceTier, Product } from "@/types/shop";

const DEFAULT_DESCRIPTION = "A carefully selected product from XPOSE Distributors.";

function numberOrZero(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getMinimumOrderQty(product: Product) {
  return Math.max(1, Number(product.min_order_qty || 1));
}

function getOrderStep(product: Product) {
  return Math.max(1, Number(product.order_qty_step || 1));
}

function getRetailPrice(product: Product, fallback = 0) {
  return numberOrZero(product.retail_price || product.price || fallback);
}

function getFlashPrice(product: Product) {
  return numberOrZero(product.discounted_price);
}

function getProductImage(product: Product) {
  return product.image_url || product.images?.[0] || "";
}

function getTierLabel(tier?: PriceTier) {
  if (!tier) return "unit";
  return tier.unit || tier.label || "unit";
}

function getPluralUnit(unit: string, quantity: number) {
  if (quantity === 1) return unit;
  if (unit.endsWith("s")) return unit;
  return `${unit}s`;
}

function getBestTier(tiers: PriceTier[], quantity: number) {
  if (!tiers.length) return undefined;

  return [...tiers]
    .sort((a, b) => Number(b.min_qty || 1) - Number(a.min_qty || 1))
    .find((tier) => !tier.min_qty || quantity >= tier.min_qty);
}

function hasActiveFlashDeal(product: Product, currentUnitPrice: number) {
  const flashPrice = getFlashPrice(product);
  const retailPrice = getRetailPrice(product, currentUnitPrice);
  return flashPrice > 0 && retailPrice > 0 && flashPrice < retailPrice;
}

function ProductSkeleton() {
  return (
    <div className="container py-16 grid md:grid-cols-2 gap-10">
      <div className="aspect-square rounded-3xl bg-muted animate-pulse" />
      <div className="space-y-4">
        <div className="h-8 w-2/3 bg-muted animate-pulse rounded" />
        <div className="h-4 w-1/3 bg-muted animate-pulse rounded" />
        <div className="h-20 bg-muted animate-pulse rounded" />
        <div className="h-12 w-full bg-muted animate-pulse rounded-full" />
      </div>
    </div>
  );
}

export default function ProductDetails() {
  const { id } = useParams<{ id: string }>();
  const { addToCart } = useCart();
  const imageBoxRef = useRef<HTMLDivElement>(null);

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");

  const tiersList = useMemo(() => (product ? getPriceTiers(product) : []), [product]);

  useEffect(() => {
    if (!tiersList.length) {
      setSelectedUnit("");
      return;
    }

    setSelectedUnit((current) => current || tiersList[0].unit);
  }, [tiersList]);

  useEffect(() => {
    if (!tiersList.length) return;

    const currentTier = tiersList.find((tier) => tier.unit === selectedUnit);
    if (currentTier?.min_qty && qty < currentTier.min_qty) {
      const fallback = getBestTier(tiersList, qty);
      if (fallback) setSelectedUnit(fallback.unit);
      return;
    }

    const bestTier = getBestTier(tiersList, qty);
    if (bestTier && bestTier.unit !== selectedUnit) {
      setSelectedUnit(bestTier.unit);
    }
  }, [qty, selectedUnit, tiersList]);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    async function loadProduct() {
      try {
        setLoading(true);
        setError("");
        setProduct(null);
        setRelated([]);
        setSelectedUnit("");
        window.scrollTo(0, 0);

        const [productResult, allProducts] = await Promise.all([getProductById(id), listProducts()]);
        if (cancelled) return;

        setProduct(productResult);

        if (productResult) {
          document.title = `${productResult.name} - XPOSE`;
          setQty(getMinimumOrderQty(productResult));
          setRelated(
            allProducts
              .filter(
                (candidate) =>
                  String(candidate.category_id || "") === String(productResult.category_id || "") &&
                  String(candidate.id) !== String(productResult.id)
              )
              .slice(0, 4)
          );
        }
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to load product details:", err);
        setError("We could not load this product right now.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProduct();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <ProductSkeleton />;

  if (error) {
    return (
      <div className="container py-32 text-center">
        <h1 className="font-display font-bold text-3xl">Product unavailable</h1>
        <p className="mt-3 text-muted-foreground">{error}</p>
        <Button asChild className="mt-6">
          <Link to="/products">Back to shop</Link>
        </Button>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container py-32 text-center">
        <h1 className="font-display font-bold text-3xl">Product not found</h1>
        <Button asChild className="mt-6">
          <Link to="/products">Back to shop</Link>
        </Button>
      </div>
    );
  }

  const minOrderQty = getMinimumOrderQty(product);
  const orderStep = getOrderStep(product);
  const sellingUnit = product.selling_unit_label || "piece";
  const selectedTier = tiersList.find((tier) => tier.unit === selectedUnit) || tiersList[0];
  const selectedTierLabel = getTierLabel(selectedTier);
  const piecePrice = tiersList.find((tier) => Number(tier.qty_per_unit || 1) === 1)?.price || 0;
  const selectedUnitPrice = numberOrZero(selectedTier?.price || product.retail_price || product.price);
  const hasFlashDeal = hasActiveFlashDeal(product, selectedUnitPrice);
  const effectiveUnitPrice = hasFlashDeal ? getFlashPrice(product) : selectedUnitPrice;
  const pricingMessages = getProductPricingMessages(product);
  const perPiece = selectedTier
    ? selectedUnitPrice / Math.max(1, Number(selectedTier.qty_per_unit || 1))
    : 0;
  const savePct =
    selectedTier &&
    Number(selectedTier.qty_per_unit || 1) > 1 &&
    piecePrice > 0 &&
    perPiece > 0 &&
    perPiece < piecePrice
      ? Math.round(((piecePrice - perPiece) / piecePrice) * 100)
      : null;
  const activeIndex = Math.max(
    0,
    tiersList.findIndex((tier) => tier.unit === selectedUnit)
  );
  const isRuleDriven = isRuleDrivenType(product.pricing_rule_type) && !hasFlashDeal;
  const productImage = getProductImage(product);

  const decreaseQty = () => {
    setQty((current) => Math.max(minOrderQty, current - orderStep));
  };

  const increaseQty = () => {
    setQty((current) => current + orderStep);
  };

  const runFlyToCart = () => {
    if (
      typeof window === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const source = imageBoxRef.current;
    const target = document.querySelector("[data-cart-button='true']") as HTMLElement | null;
    if (!source || !target) return;

    const start = source.getBoundingClientRect();
    const end = target.getBoundingClientRect();
    const size = Math.min(112, Math.max(68, start.width * 0.18));
    const flyer = document.createElement("div");

    flyer.style.position = "fixed";
    flyer.style.left = `${start.left + start.width / 2 - size / 2}px`;
    flyer.style.top = `${start.top + start.height / 2 - size / 2}px`;
    flyer.style.width = `${size}px`;
    flyer.style.height = `${size}px`;
    flyer.style.borderRadius = "20px";
    flyer.style.zIndex = "9999";
    flyer.style.pointerEvents = "none";
    flyer.style.boxShadow = "0 20px 55px rgba(0,0,0,0.28)";
    flyer.style.border = "1px solid rgba(255,255,255,0.7)";
    flyer.style.backgroundColor = "white";
    flyer.style.backgroundPosition = "center";
    flyer.style.backgroundRepeat = "no-repeat";
    flyer.style.backgroundSize = "contain";

    if (productImage) {
      flyer.style.backgroundImage = `url("${productImage}")`;
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
        {
          transform: `translate3d(${deltaX * 0.35}px, ${deltaY * 0.25 - 95}px, 0) scale(0.78)`,
          opacity: 0.95,
        },
        {
          transform: `translate3d(${deltaX}px, ${deltaY}px, 0) scale(0.18) rotate(10deg)`,
          opacity: 0,
        },
      ],
      { duration: 900, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
    ).onfinish = () => flyer.remove();
  };

  const handleAddToCart = () => {
    runFlyToCart();
    addToCart(product, qty, isRuleDriven ? undefined : effectiveUnitPrice);
  };

  return (
    <div className="container py-10 md:py-14">
      <nav className="flex items-center gap-1 text-xs text-muted-foreground mb-6">
        <Link to="/" className="hover:text-foreground">
          Home
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link to="/products" className="hover:text-foreground">
          Shop
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground truncate">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div
            ref={imageBoxRef}
            className="aspect-square rounded-3xl overflow-hidden bg-white shine-overlay relative group border border-border/60 shadow-soft"
          >
            {productImage ? (
              <img
                src={productImage}
                alt={product.name}
                className="h-full w-full object-contain p-6 md:p-8 transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="h-full w-full grid place-items-center bg-gradient-to-br from-accent/20 via-primary/10 to-accent-glow/20">
                <span className="font-display font-bold text-8xl text-primary/40 select-none">
                  {product.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}

            {hasFlashDeal && (
              <span className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-bold uppercase tracking-wider shadow-glow">
                Flash sale
              </span>
            )}
          </div>
        </motion.div>

        <div className="md:sticky md:top-24 md:self-start space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {product.category_name && (
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                {product.category_name}
              </p>
            )}
            <h1 className="font-display font-bold text-3xl md:text-5xl tracking-tight leading-tight">
              {product.name}
            </h1>
          </motion.div>

          <div className="rounded-xl border border-border bg-card/60 px-3 py-2">
            <p className="text-xs font-semibold">{pricingMessages.primary}</p>
            {pricingMessages.secondary && (
              <p className="text-[11px] text-muted-foreground mt-1">
                {pricingMessages.secondary}
              </p>
            )}
          </div>

          {tiersList.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.12 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">
                  Pack size
                </p>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Live pricing
                </span>
              </div>

              <div className="relative inline-flex w-full p-1 rounded-full bg-secondary border border-border">
                <motion.span
                  layout
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  className="absolute top-1 bottom-1 rounded-full bg-background shadow-soft border border-border"
                  style={{
                    width: `calc((100% - 0.5rem) / ${tiersList.length})`,
                    left: `calc(0.25rem + ((100% - 0.5rem) / ${tiersList.length}) * ${activeIndex})`,
                  }}
                />

                {tiersList.map((tier) => {
                  const active = tier.unit === selectedUnit;
                  const meetsThreshold = !tier.min_qty || qty >= tier.min_qty;
                  const needMore = tier.min_qty && qty < tier.min_qty ? tier.min_qty - qty : 0;
                  const disabled = isRuleDriven || !meetsThreshold;
                  const buttonTitle = needMore
                    ? `Add ${needMore} more to unlock ${tier.unit} pricing`
                    : isRuleDriven
                      ? "Price is applied automatically from cart quantity rules"
                      : undefined;

                  return (
                    <button
                      key={tier.unit}
                      type="button"
                      onClick={() => !disabled && setSelectedUnit(tier.unit)}
                      disabled={disabled}
                      aria-disabled={disabled}
                      title={buttonTitle}
                      className={`relative z-10 flex-1 px-3 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors ${
                        active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                      } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
                    >
                      {tier.unit}
                      {tier.qty_per_unit && tier.qty_per_unit > 1 ? (
                        <span className="ml-1 normal-case tracking-normal text-[10px] opacity-70">
                          - {tier.qty_per_unit}pc
                        </span>
                      ) : null}
                      {needMore ? (
                        <span className="block normal-case tracking-normal text-[9px] opacity-60 font-normal">
                          need {tier.min_qty}+
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>

              {isRuleDriven && (
                <p className="text-[11px] text-muted-foreground">
                  Final unit price is applied automatically in cart from quantity rules.
                </p>
              )}
            </motion.div>
          )}

          <div className="flex items-end justify-between gap-4 pt-1">
            <div>
              <AnimatedPrice
                value={effectiveUnitPrice}
                className="block font-display font-bold text-4xl md:text-5xl tracking-tight leading-none tabular-nums"
              />
              <p className="text-xs text-muted-foreground mt-2">
                per 1 {selectedTierLabel}
                {selectedTier?.qty_per_unit && selectedTier.qty_per_unit > 1
                  ? ` - ${formatPrice(Math.round(perPiece))}/piece`
                  : ""}
              </p>
              {hasFlashDeal && (
                <p className="text-xs text-accent mt-1 font-semibold">
                  Flash price applied now. Was {formatPrice(getRetailPrice(product, selectedUnitPrice))}
                </p>
              )}
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

          {(() => {
            const wholesaleTier = tiersList.find((tier) => tier.min_qty != null && tier.min_qty > 1);
            if (!wholesaleTier?.min_qty) return null;

            const threshold = wholesaleTier.min_qty;
            if (qty >= threshold) {
              return (
                <motion.p
                  key="unlocked"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs font-medium text-accent flex items-center gap-1"
                >
                  <span aria-hidden="true">OK</span>
                  Wholesale pricing unlocked. Select the {wholesaleTier.unit} tier above.
                </motion.p>
              );
            }

            const needed = threshold - qty;
            return (
              <motion.p
                key="locked"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-muted-foreground"
              >
                Add <span className="font-semibold text-foreground">{needed}</span> more to unlock
                wholesale pricing at {formatPrice(wholesaleTier.price)}/{wholesaleTier.unit}.
              </motion.p>
            );
          })()}

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground leading-relaxed"
          >
            {product.description || DEFAULT_DESCRIPTION}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="flex flex-wrap items-center gap-3 pt-2"
          >
            <div className="flex items-center gap-1 bg-secondary rounded-full p-1">
              <button
                type="button"
                onClick={decreaseQty}
                className="h-9 w-9 rounded-full grid place-items-center hover:bg-background transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Decrease quantity"
                disabled={qty <= minOrderQty}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-12 text-center font-semibold tabular-nums">{qty}</span>
              <button
                type="button"
                onClick={increaseQty}
                className="h-9 w-9 rounded-full grid place-items-center hover:bg-background transition-colors"
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <Button
              size="lg"
              className="h-12 flex-1 min-w-[220px] bg-gradient-accent text-accent-foreground border-0 shadow-glow hover:opacity-95"
              onClick={handleAddToCart}
            >
              <ShoppingBag className="h-4 w-4 mr-2" />
              <AnimatePresence mode="wait">
                <motion.span
                  key={`${effectiveUnitPrice}-${qty}-${selectedUnit}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="truncate"
                >
                  Add {qty} {getPluralUnit(selectedTierLabel, qty)} -{" "}
                  {formatPrice(effectiveUnitPrice * qty)}
                </motion.span>
              </AnimatePresence>
            </Button>

            <Button size="icon" variant="outline" className="h-12 w-12" aria-label="Save product">
              <Heart className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="outline" className="h-12 w-12" aria-label="Share product">
              <Share2 className="h-4 w-4" />
            </Button>

            {(minOrderQty > 1 || orderStep > 1) && (
              <p className="basis-full text-[11px] text-muted-foreground">
                Sold as {sellingUnit}; minimum {minOrderQty}, then steps of {orderStep}.
              </p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 gap-3 pt-4 border-t border-border"
          >
            {[
              { icon: Truck, text: "Free Shipping over KES 75,000" },
              { icon: ShieldCheck, text: "Authentic Products" },
            ].map((item) => (
              <div key={item.text} className="text-center">
                <item.icon className="h-5 w-5 mx-auto text-accent mb-1" />
                <p className="text-xs text-muted-foreground">{item.text}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-24">
          <h2 className="font-display font-bold text-2xl md:text-3xl mb-6">You may also like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {related.map((item, index) => (
              <ProductCard key={item.id} product={item} index={index} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}