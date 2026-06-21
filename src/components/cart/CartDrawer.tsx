import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, ShoppingBag, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { formatPrice, useCart } from "@/context/CartContext";
import { getCartPricingMessage, isWholesaleEligible } from "@/lib/pricingMessaging";

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

export default function CartDrawer() {
  const {
    isOpen,
    closeCart,
    cartItems,
    updateQuantity,
    removeFromCart,
    totalAmount,
    itemCount,
    evaluations,
    pricingLoading,
  } = useCart();

  return (
    <Sheet open={isOpen} onOpenChange={(open) => (!open ? closeCart() : undefined)}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="px-6 py-5 border-b border-border">
          <SheetTitle className="flex items-center gap-2 font-display">
            <ShoppingBag className="h-5 w-5" />
            Your Cart
            {itemCount > 0 && (
              <span className="ml-auto text-sm font-normal text-muted-foreground">
                {itemCount} item{itemCount === 1 ? "" : "s"}
              </span>
            )}
          </SheetTitle>
          <SheetDescription className="sr-only">
            Review cart items, adjust quantities, remove products, or continue to checkout.
          </SheetDescription>
        </SheetHeader>

        <div className="relative flex-1 overflow-y-auto px-6 py-4">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16">
              <div className="h-20 w-20 rounded-full bg-secondary grid place-items-center mb-4">
                <ShoppingBag className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-display font-semibold text-lg">Your cart is empty</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-6">
                Discover products you will love.
              </p>
              <Button onClick={closeCart} asChild>
                <Link to="/products">Browse products</Link>
              </Button>
            </div>
          ) : (
            <ul className="space-y-3">
              <AnimatePresence initial={false}>
                {cartItems.map((item) => {
                  const ev = evaluations[item.id];
                  const unitPrice = toMoneyNumber(ev?.unit_price ?? item.price);
                  const lineTotal = toMoneyNumber(ev?.line_total ?? unitPrice * item.quantity);
                  const pricingMessage = getCartPricingMessage(ev, item.quantity);
                  const wholesaleEligible = isWholesaleEligible(ev);
                  const flashSaleApplied = Boolean(
                    ev?.flash_sale_id || normalizeLabel(ev?.pricing_label) === "flash sale"
                  );
                  const { minQty, step, sellingUnit } = getQuantityMeta(item);

                  return (
                    <motion.li
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 40, height: 0, marginTop: 0 }}
                      transition={{ duration: 0.25 }}
                      className="flex gap-3 p-3 rounded-xl bg-secondary/50 border border-border"
                    >
                      <Link
                        to={`/products/${item.id}`}
                        onClick={closeCart}
                        className="h-20 w-20 rounded-lg overflow-hidden bg-background flex-shrink-0"
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
                        <div className="flex items-start gap-2">
                          <Link
                            to={`/products/${item.id}`}
                            onClick={closeCart}
                            className="flex-1"
                          >
                            <h4 className="text-sm font-medium leading-snug line-clamp-2 hover:text-accent transition-colors">
                              {item.name}
                            </h4>
                          </Link>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors p-0.5"
                            aria-label={`Remove ${item.name}`}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <p className="text-sm font-semibold">{formatPrice(unitPrice)}</p>
                          {ev?.pricing_label && (
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
                                wholesaleEligible || flashSaleApplied
                                  ? "bg-accent/15 text-accent"
                                  : "bg-secondary text-muted-foreground"
                              }`}
                            >
                              {ev.pricing_label}
                            </span>
                          )}
                        </div>

                        {pricingMessage && (
                          <p
                            className={`text-[11px] mt-1 ${
                              wholesaleEligible || flashSaleApplied
                                ? "text-accent"
                                : "text-muted-foreground"
                            }`}
                          >
                            {pricingMessage}
                          </p>
                        )}

                        {(minQty > 1 || step > 1) && (
                          <p className="text-[11px] mt-1 text-muted-foreground">
                            Sold as {sellingUnit}; min {minQty}, step {step}.
                          </p>
                        )}

                        <div className="mt-2 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1 bg-background border border-border rounded-full p-0.5">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.quantity - step)}
                              disabled={item.quantity <= minQty}
                              className="h-7 w-7 rounded-full grid place-items-center hover:bg-secondary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              aria-label={`Decrease ${item.name} quantity`}
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <motion.span
                              key={item.quantity}
                              initial={{ scale: 0.7 }}
                              animate={{ scale: 1 }}
                              className="text-sm font-semibold w-8 text-center tabular-nums"
                            >
                              {item.quantity}
                            </motion.span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.quantity + step)}
                              className="h-7 w-7 rounded-full grid place-items-center hover:bg-secondary transition-colors"
                              aria-label={`Increase ${item.name} quantity`}
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>

                          <span className="text-sm font-semibold">{formatPrice(lineTotal)}</span>
                        </div>
                      </div>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="border-t border-border px-6 py-5 space-y-4 bg-background">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatPrice(totalAmount)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="flex justify-between font-display font-bold text-lg pt-2 border-t border-border">
                <span>Total</span>
                <span>{formatPrice(totalAmount)}</span>
              </div>
            </div>

            <div className="grid gap-2">
              <Button
                asChild
                size="lg"
                className="w-full bg-gradient-accent hover:opacity-90 text-accent-foreground border-0 shadow-glow"
                onClick={closeCart}
              >
                <Link to="/checkout">Checkout</Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={closeCart} asChild>
                <Link to="/cart">View full cart</Link>
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
