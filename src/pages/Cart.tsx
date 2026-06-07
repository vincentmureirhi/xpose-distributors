import { useEffect } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice, useCart } from "@/context/CartContext";
import {
  getCartPricingMessage,
  isRuleType,
  isWholesaleEligible,
} from "@/lib/pricingMessaging";

function toMoneyNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeLabel(value?: string | null) {
  return String(value || "").trim().toLowerCase();
}

function getQuantityMeta(item: {
  min_order_qty?: number;
  order_qty_step?: number;
  selling_unit_label?: string;
}) {
  return {
    minQty: Math.max(1, Number(item.min_order_qty || 1)),
    step: Math.max(1, Number(item.order_qty_step || 1)),
    sellingUnit: item.selling_unit_label || "piece",
  };
}

export default function Cart() {
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    totalAmount,
    clearCart,
    evaluations,
    pricingLoading,
  } = useCart();

  useEffect(() => {
    document.title = "Cart - XPOSE";
  }, []);

  if (cartItems.length === 0) {
    return (
      <div className="container py-32 text-center">
        <div className="h-20 w-20 rounded-full bg-secondary grid place-items-center mx-auto mb-5">
          <ShoppingBag className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="font-display font-bold text-3xl">Your cart is empty</h1>
        <p className="text-muted-foreground mt-2">
          Start exploring products you will love.
        </p>
        <Button asChild className="mt-6">
          <Link to="/products">Browse products</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-10 md:py-14">
      <h1 className="font-display font-bold text-4xl md:text-5xl mb-8 tracking-tight">
        Cart
      </h1>

      <div className="grid lg:grid-cols-[1fr_400px] gap-8">
        <ul className="space-y-3">
          <AnimatePresence>
            {cartItems.map((item) => {
              const ev = evaluations[item.id];
              const unitPrice = toMoneyNumber(ev?.unit_price ?? item.price);
              const lineTotal = toMoneyNumber(ev?.line_total ?? unitPrice * item.quantity);
              const pricingLabel = ev?.pricing_label;
              const pricingLabelKey = normalizeLabel(pricingLabel);
              const wholesaleEligible = isWholesaleEligible(ev);
              const flashSaleApplied = Boolean(
                ev?.flash_sale_id || pricingLabelKey === "flash sale"
              );
              const pricingMessage = getCartPricingMessage(ev, item.quantity);
              const { minQty, step, sellingUnit } = getQuantityMeta(item);
              const ruleMeta = [
                ev?.rule_name ? `Rule: ${ev.rule_name}` : null,
                ev?.pricing_group_name ? `Group: ${ev.pricing_group_name}` : null,
              ]
                .filter(Boolean)
                .join(" | ");
              const isGroupThreshold =
                !wholesaleEligible &&
                ev?.threshold_quantity != null &&
                isRuleType(ev?.rule_type, "GROUP_THRESHOLD");

              return (
                <motion.li
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  className="flex gap-4 p-4 rounded-2xl bg-card border border-border"
                >
                  <Link
                    to={`/products/${item.id}`}
                    className="h-24 w-24 md:h-28 md:w-28 rounded-xl overflow-hidden bg-secondary flex-shrink-0"
                  >
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="h-full w-full object-contain bg-white p-2"
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-full w-full grid place-items-center text-muted-foreground">
                        <ShoppingBag className="h-6 w-6" />
                      </div>
                    )}
                  </Link>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3">
                      <Link to={`/products/${item.id}`} className="flex-1">
                        <h3 className="font-medium hover:text-accent transition-colors line-clamp-2">
                          {item.name}
                        </h3>
                      </Link>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="text-muted-foreground hover:text-destructive p-1"
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <p className="text-sm text-muted-foreground">
                        {formatPrice(unitPrice)} each
                      </p>
                      {pricingLabel && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
                            wholesaleEligible || flashSaleApplied
                              ? "bg-accent/15 text-accent"
                              : "bg-secondary text-muted-foreground"
                          }`}
                        >
                          {pricingLabel}
                        </span>
                      )}
                      {pricingLoading && !ev && (
                        <span className="text-[10px] text-muted-foreground animate-pulse">
                          evaluating...
                        </span>
                      )}
                    </div>

                    {isGroupThreshold && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Group threshold uses combined quantities from qualifying products.
                      </p>
                    )}

                    {pricingMessage && (
                      <p
                        className={`text-xs mt-1 ${
                          wholesaleEligible || flashSaleApplied
                            ? "text-accent"
                            : "text-muted-foreground"
                        }`}
                      >
                        {pricingMessage}
                      </p>
                    )}

                    {ruleMeta && (
                      <p className="text-[11px] text-muted-foreground mt-1">{ruleMeta}</p>
                    )}

                    {(minQty > 1 || step > 1) && (
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Sold as {sellingUnit}; minimum {minQty}, step {step}.
                      </p>
                    )}

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-1 bg-secondary rounded-full p-0.5">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - step)}
                          disabled={item.quantity <= minQty}
                          className="h-8 w-8 rounded-full grid place-items-center hover:bg-background transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          aria-label={`Decrease ${item.name} quantity`}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <motion.span
                          key={item.quantity}
                          initial={{ scale: 0.7 }}
                          animate={{ scale: 1 }}
                          className="w-10 text-center text-sm font-semibold tabular-nums"
                        >
                          {item.quantity}
                        </motion.span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + step)}
                          className="h-8 w-8 rounded-full grid place-items-center hover:bg-background transition-colors"
                          aria-label={`Increase ${item.name} quantity`}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <p className="font-display font-bold">{formatPrice(lineTotal)}</p>
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>

          <div className="pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearCart}
              className="text-muted-foreground hover:text-destructive"
            >
              Clear cart
            </Button>
          </div>
        </ul>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <h2 className="font-display font-bold text-xl">Order summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatPrice(totalAmount)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span>At checkout</span>
              </div>
              <div className="flex justify-between font-display font-bold text-2xl pt-3 border-t border-border">
                <span>Total</span>
                <span>{formatPrice(totalAmount)}</span>
              </div>
            </div>

            {pricingLoading && (
              <p className="text-[11px] text-muted-foreground">
                Checking the latest pricing before checkout...
              </p>
            )}

            <Button
              asChild
              size="lg"
              className="w-full bg-gradient-accent text-accent-foreground border-0 shadow-glow hover:opacity-95"
            >
              <Link to="/checkout">Proceed to checkout</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to="/products">Continue shopping</Link>
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}