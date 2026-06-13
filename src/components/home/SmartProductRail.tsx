import { Link } from "react-router-dom";
import { Flame, PackageCheck, ShoppingBag } from "lucide-react";
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

function getBadge(product: Product) {
  if (product.is_flash || product.discounted_price) {
    return { label: "Flash", Icon: Flame, className: "bg-accent text-accent-foreground" };
  }
  if (Number(product.min_order_qty || 1) > 1 || Number(product.order_qty_step || 1) > 1) {
    return { label: "Trade pack", Icon: PackageCheck, className: "bg-primary text-primary-foreground" };
  }
  return { label: "Ready", Icon: ShoppingBag, className: "bg-secondary text-secondary-foreground" };
}

export default function SmartProductRail({ products }: Props) {
  const visible = products
    .filter((product) => product.image_url || product.name)
    .slice(0, 12);

  if (visible.length < 3) return null;

  const railItems = [...visible, ...visible];

  return (
    <section className="overflow-hidden border-y border-border bg-secondary/35 py-8">
      <div className="container mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">Live shelf</p>
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Moving fast right now</h2>
        </div>
        <Link to="/products" className="hidden text-sm font-semibold underline-offset-4 hover:underline sm:inline">
          Shop all
        </Link>
      </div>

      <div className="product-flow group">
        <div className="product-flow-track">
          {railItems.map((product, index) => {
            const badge = getBadge(product);
            const BadgeIcon = badge.Icon;
            const price = getDisplayPrice(product);
            const minQty = Math.max(1, Number(product.min_order_qty || 1));
            const unit = product.selling_unit_label || "piece";

            return (
              <Link
                key={`${product.id}-${index}`}
                to={`/products/${product.id}`}
                className="product-flow-card"
                aria-label={`View ${product.name}`}
              >
                <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-white">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="h-full w-full object-contain p-2" loading="lazy" />
                  ) : (
                    <div className="grid h-full w-full place-items-center bg-accent/10 font-display text-2xl font-bold text-accent">
                      {product.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <span className={`mb-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badge.className}`}>
                    <BadgeIcon className="h-3 w-3" />
                    {badge.label}
                  </span>
                  <p className="line-clamp-2 text-sm font-semibold leading-snug">{product.name}</p>
                  <div className="mt-1 flex items-baseline justify-between gap-2">
                    <span className="text-xs text-muted-foreground">
                      {minQty > 1 ? `Min ${minQty} ${unit}${minQty === 1 ? "" : "s"}` : product.category_name || "XPOSE"}
                    </span>
                    <span className="font-display text-sm font-bold">{formatPrice(price)}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
