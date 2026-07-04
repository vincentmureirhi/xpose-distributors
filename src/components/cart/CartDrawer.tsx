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
import { isWholesaleEligible } from "@/lib/pricingMessaging";

function toMoneyNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
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
  } = useCart();

  return (
    <Sheet open={isOpen} onOpenChange={(open) => (!open ? closeCart() : undefined)}>
      <SheetContent className="flex w-full max-w-full flex-col p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-4 py-4 sm:px-5">
          <SheetTitle className="flex items-center gap-2 font-display">
            <ShoppingBag className="h-5 w-5" />
            Cart
            {itemCount > 0 && (
              <span className="ml-auto text-sm font-normal text-muted-foreground">
                {itemCount} item{itemCount === 1 ? "" : "s"}
              </span>
            )}
          </SheetTitle>
          <SheetDescription className="sr-only">Review and update cart items.</SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 sm:px-5">
          {cartItems.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-secondary">
                <ShoppingBag className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="font-display text-lg font-semibold">Your cart is empty</h3>
              <Button onClick={closeCart} asChild className="mt-5">
                <Link to="/products">Shop products</Link>
              </Button>
            </div>
          ) : (
            <ul className="space-y-2.5">
              <AnimatePresence initial={false}>
                {cartItems.map((item) => {
                  const evaluation = evaluations[item.id];
                  const unitPrice = toMoneyNumber(evaluation?.unit_price ?? item.price);
                  const lineTotal = toMoneyNumber(evaluation?.line_total ?? unitPrice * item.quantity);
                  const wholesale = isWholesaleEligible(evaluation);
                  const flash = Boolean(
                    evaluation?.flash_sale_id || String(evaluation?.pricing_label || "").toLowerCase() === "flash sale"
                  );
                  const { minQty, step, sellingUnit } = getQuantityMeta(item);

                  return (
                    <motion.li
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 30, height: 0 }}
                      className="grid grid-cols-[72px_minmax(0,1fr)] gap-3 rounded-xl border border-border bg-card p-3"
                    >
                      <Link
                        to={`/products/${item.id}`}
                        onClick={closeCart}
                        className="h-[72px] w-[72px] overflow-hidden rounded-lg bg-white"
                      >
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="h-full w-full object-contain p-1.5" loading="lazy" />
                        ) : (
                          <div className="grid h-full w-full place-items-center text-muted-foreground">
                            <ShoppingBag className="h-5 w-5" />
                          </div>
                        )}
                      </Link>

                      <div className="min-w-0">
                        <div className="flex items-start gap-2">
                          <Link to={`/products/${item.id}`} onClick={closeCart} className="min-w-0 flex-1">
                            <h4 className="line-clamp-2 text-sm font-semibold leading-snug">{item.name}</h4>
                          </Link>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.id)}
                            className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-destructive"
                            aria-label={`Remove ${item.name}`}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="mt-1 flex min-w-0 items-center gap-2">
                          <span className="font-display text-sm font-bold">{formatPrice(unitPrice)}</span>
                          {(flash || wholesale) && (
                            <span className="truncate rounded-full bg-accent/12 px-2 py-0.5 text-[10px] font-bold uppercase text-accent">
                              {flash ? "Flash" : "Wholesale"}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                          {sellingUnit}{minQty > 1 || step > 1 ? ` · min ${minQty} · +${step}` : ""}
                        </p>

                        <div className="mt-2 flex items-center justify-between gap-2">
                          <div className="flex h-8 items-center rounded-lg border border-border bg-background">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.quantity - step)}
                              disabled={item.quantity <= minQty}
                              className="grid h-8 w-8 place-items-center disabled:opacity-35"
                              aria-label={`Decrease ${item.name} quantity`}
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <motion.span key={item.quantity} initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="w-9 text-center text-sm font-bold tabular-nums">
                              {item.quantity}
                            </motion.span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.quantity + step)}
                              className="grid h-8 w-8 place-items-center"
                              aria-label={`Increase ${item.name} quantity`}
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <span className="whitespace-nowrap font-display text-sm font-bold">{formatPrice(lineTotal)}</span>
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
          <div className="border-t border-border bg-background px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-5">
            <div className="mb-3 flex items-end justify-between gap-3">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span className="font-display text-xl font-bold">{formatPrice(totalAmount)}</span>
            </div>
            <div className="grid gap-2">
              <Button asChild size="lg" className="w-full" onClick={closeCart}>
                <Link to="/checkout">Checkout</Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={closeCart} asChild>
                <Link to="/cart">Open cart</Link>
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}