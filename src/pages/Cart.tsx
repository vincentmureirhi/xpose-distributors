import { useEffect } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice, useCart } from "@/context/CartContext";
import { isWholesaleEligible } from "@/lib/pricingMessaging";

function toMoneyNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getQuantityMeta(item: { min_order_qty?: number; order_qty_step?: number; selling_unit_label?: string }) {
  return {
    minQty: Math.max(1, Number(item.min_order_qty || 1)),
    step: Math.max(1, Number(item.order_qty_step || 1)),
    sellingUnit: item.selling_unit_label || "piece",
  };
}

export default function Cart() {
  const { cartItems, updateQuantity, removeFromCart, totalAmount, clearCart, evaluations } = useCart();

  useEffect(() => {
    document.title = "Cart - XPOSE";
  }, []);

  if (cartItems.length === 0) {
    return (
      <div className="container px-4 py-24 text-center">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-secondary">
          <ShoppingBag className="h-7 w-7 text-muted-foreground" />
        </div>
        <h1 className="font-display text-3xl font-bold">Your cart is empty</h1>
        <Button asChild className="mt-6"><Link to="/products">Shop products</Link></Button>
      </div>
    );
  }

  return (
    <div className="container px-4 py-6 sm:py-10 md:py-14">
      <div className="mb-5 flex items-end justify-between gap-4 sm:mb-8">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Cart</h1>
        <button type="button" onClick={clearCart} className="text-sm font-semibold text-muted-foreground hover:text-destructive">Clear</button>
      </div>

      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
        <ul className="min-w-0 space-y-3">
          <AnimatePresence>
            {cartItems.map((item) => {
              const evaluation = evaluations[item.id];
              const unitPrice = toMoneyNumber(evaluation?.unit_price ?? item.price);
              const lineTotal = toMoneyNumber(evaluation?.line_total ?? unitPrice * item.quantity);
              const wholesale = isWholesaleEligible(evaluation);
              const flash = Boolean(evaluation?.flash_sale_id || String(evaluation?.pricing_label || "").toLowerCase() === "flash sale");
              const { minQty, step, sellingUnit } = getQuantityMeta(item);

              return (
                <motion.li
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  className="grid min-w-0 grid-cols-[76px_minmax(0,1fr)] gap-3 rounded-xl border border-border bg-card p-3 sm:grid-cols-[104px_minmax(0,1fr)] sm:gap-4 sm:p-4"
                >
                  <Link to={`/products/${item.id}`} className="h-[76px] w-[76px] overflow-hidden rounded-lg bg-white sm:h-[104px] sm:w-[104px]">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="h-full w-full object-contain p-1.5 sm:p-2" loading="lazy" />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-muted-foreground"><ShoppingBag className="h-6 w-6" /></div>
                    )}
                  </Link>

                  <div className="min-w-0">
                    <div className="flex items-start gap-2">
                      <Link to={`/products/${item.id}`} className="min-w-0 flex-1">
                        <h3 className="line-clamp-2 text-sm font-semibold leading-snug sm:text-base">{item.name}</h3>
                      </Link>
                      <button type="button" onClick={() => removeFromCart(item.id)} className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-destructive" aria-label={`Remove ${item.name}`}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-1 flex min-w-0 items-center gap-2">
                      <span className="text-sm font-semibold">{formatPrice(unitPrice)}</span>
                      {(flash || wholesale) && (
                        <span className="truncate rounded-full bg-accent/12 px-2 py-0.5 text-[10px] font-bold uppercase text-accent">{flash ? "Flash" : "Wholesale"}</span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{sellingUnit}{minQty > 1 || step > 1 ? ` · min ${minQty} · +${step}` : ""}</p>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex h-9 items-center rounded-lg border border-border bg-secondary/40">
                        <button type="button" onClick={() => updateQuantity(item.id, item.quantity - step)} disabled={item.quantity <= minQty} className="grid h-9 w-9 place-items-center disabled:opacity-35" aria-label={`Decrease ${item.name} quantity`}><Minus className="h-3.5 w-3.5" /></button>
                        <motion.span key={item.quantity} initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="w-10 text-center text-sm font-bold tabular-nums">{item.quantity}</motion.span>
                        <button type="button" onClick={() => updateQuantity(item.id, item.quantity + step)} className="grid h-9 w-9 place-items-center" aria-label={`Increase ${item.name} quantity`}><Plus className="h-3.5 w-3.5" /></button>
                      </div>
                      <span className="whitespace-nowrap font-display text-base font-bold">{formatPrice(lineTotal)}</span>
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
            <h2 className="font-display text-lg font-bold">Order summary</h2>
            <div className="mt-4 flex items-end justify-between border-t border-border pt-4">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span className="font-display text-2xl font-bold">{formatPrice(totalAmount)}</span>
            </div>
            <Button asChild size="lg" className="mt-5 w-full"><Link to="/checkout">Proceed to checkout</Link></Button>
            <Button asChild variant="outline" className="mt-2 w-full"><Link to="/products">Continue shopping</Link></Button>
          </div>
        </aside>
      </div>
    </div>
  );
}