import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock3, Flame, PackageCheck, ShoppingBag, Sparkles } from "lucide-react";
import type { Product } from "@/types/shop";
import { formatPrice } from "@/context/CartContext";
import { getPriceTiers } from "@/lib/pricing";

interface Props {
  products: Product[];
}

function getDisplayPrice(product: Product) {
  const tiers = getPriceTiers(product);
  const baseTier = tiers.find((tier) => (tier.qty_per_unit || 1) === 1) ?? tiers[0];
  const basePrice = Number(baseTier?.price || product.retail_price || product.price || 0);
  const flashPrice = Number(product.discounted_price || 0);
  return flashPrice > 0 && flashPrice < basePrice ? flashPrice : basePrice;
}

function getStockState(product: Product) {
  const status = String(product.stock_status_override || product.stock_status || "").toLowerCase();
  const stockValue = product.current_stock ?? product.stock;
  const stockQty = Number(stockValue);
  const hasStockQty = stockValue !== undefined && stockValue !== null && stockValue !== "" && Number.isFinite(stockQty);
  const minQty = Math.max(1, Number(product.min_order_qty || 1));

  if (status === "out_of_stock" || status === "sold_out" || status === "unavailable" || (hasStockQty && stockQty <= 0)) {
    return "out_of_stock";
  }

  if (
    status === "limited_stock" ||
    status === "low_stock" ||
    status === "reorder_now" ||
    (hasStockQty && stockQty > 0 && stockQty <= Math.max(minQty, 10))
  ) {
    return "limited_stock";
  }

  return "in_stock";
}

function getBadge(product: Product) {
  const stockState = getStockState(product);

  if (stockState === "limited_stock") {
    return {
      label: "Hurry: limited stock",
      Icon: Clock3,
      className: "bg-amber-400 text-slate-950",
      glow: "shadow-[0_0_28px_rgba(251,191,36,0.34)]",
    };
  }

  if (product.is_flash || product.discounted_price) {
    return {
      label: "Flash deal",
      Icon: Flame,
      className: "bg-accent text-accent-foreground",
      glow: "shadow-[0_0_28px_rgba(255,91,46,0.28)]",
    };
  }

  if (Number(product.min_order_qty || 1) > 1 || Number(product.order_qty_step || 1) > 1) {
    return {
      label: "Trade pack",
      Icon: PackageCheck,
      className: "bg-primary text-primary-foreground",
      glow: "shadow-[0_0_24px_rgba(15,23,42,0.18)]",
    };
  }

  return {
    label: "Ready to order",
    Icon: ShoppingBag,
    className: "bg-secondary text-secondary-foreground",
    glow: "",
  };
}

function getProductScore(product: Product) {
  const stockState = getStockState(product);
  const hasImage = product.image_url ? 10 : 0;
  const limited = stockState === "limited_stock" ? 100 : 0;
  const flash = product.is_flash || product.discounted_price ? 80 : 0;
  const tradePack = Number(product.min_order_qty || 1) > 1 || Number(product.order_qty_step || 1) > 1 ? 30 : 0;
  return limited + flash + tradePack + hasImage;
}

export default function SmartProductRail({ products }: Props) {
  const visible = products
    .filter((product) => product.image_url || product.name)
    .filter((product) => getStockState(product) !== "out_of_stock")
    .sort((a, b) => getProductScore(b) - getProductScore(a))
    .slice(0, 10);

  if (visible.length < 3) return null;

  const railItems = [...visible, ...visible];

  return (
    <section className="overflow-hidden border-y border-border bg-secondary/35 bg-[radial-gradient(circle_at_top_left,rgba(255,91,46,0.13),transparent_34%)] py-8 sm:py-10">
      <div className="container mb-5 flex flex-col gap-4 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent">
            <Sparkles className="h-3.5 w-3.5" />
            Live shelf
          </p>
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Moving fast right now</h2>
        </div>
        <Link to="/products" className="inline-flex h-10 items-center justify-center rounded-full border border-border bg-background px-4 text-sm font-semibold shadow-soft transition-colors hover:border-accent/50 hover:text-accent">
          Shop all
        </Link>
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-background to-transparent sm:w-24" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-background to-transparent sm:w-24" />

        <motion.div
          className="flex w-max gap-3 px-4 will-change-transform sm:gap-5"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: Math.max(28, visible.length * 5), ease: "linear", repeat: Infinity }}
        >
          {railItems.map((product, index) => {
            const badge = getBadge(product);
            const BadgeIcon = badge.Icon;
            const price = getDisplayPrice(product);
            const minQty = Math.max(1, Number(product.min_order_qty || 1));
            const unit = product.selling_unit_label || "piece";
            const stockState = getStockState(product);
            const stockCopy = stockState === "limited_stock" ? "Limited stock available" : "In stock";

            return (
              <Link
                key={`${product.id}-${index}`}
                to={`/products/${product.id}`}
                className={`group/card flex w-[238px] flex-none gap-3 rounded-2xl border border-border bg-card p-3 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-accent/45 hover:shadow-card sm:w-[330px] ${badge.glow}`}
                aria-label={`View ${product.name}`}
              >
                <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-white shadow-inner sm:h-28 sm:w-28">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="h-full w-full object-contain p-2 transition-transform duration-500 group-hover/card:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center bg-accent/10 font-display text-2xl font-bold text-accent">
                      {product.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-between">
                  <span className={`mb-1 inline-flex w-fit max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider sm:text-[10px] ${badge.className}`}>
                    <BadgeIcon className="h-3 w-3" />
                    {badge.label}
                  </span>
                  <div>
                    <p className="line-clamp-2 text-sm font-bold leading-snug sm:text-base">{product.name}</p>
                    <p className={`mt-1 text-[11px] font-bold uppercase ${stockState === "limited_stock" ? "text-amber-600" : "text-emerald-600"}`}>
                      {stockCopy}
                    </p>
                  </div>
                  <div className="mt-2 flex items-end justify-between gap-2">
                    <span className="line-clamp-2 text-[11px] text-muted-foreground sm:text-xs">
                      {minQty > 1 ? `Min ${minQty} ${unit}${minQty === 1 ? "" : "s"}` : product.category_name || "XPOSE"}
                    </span>
                    <span className="shrink-0 font-display text-sm font-black sm:text-base">{formatPrice(price)}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
