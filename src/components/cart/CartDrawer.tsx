import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCart, formatPrice } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export default function CartDrawer() {
  const { isOpen, closeCart, cartItems, updateQuantity, removeFromCart, totalAmount, itemCount } = useCart();

  return (
    <Sheet open={isOpen} onOpenChange={(o) => (o ? null : closeCart())}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="px-6 py-5 border-b border-border">
          <SheetTitle className="flex items-center gap-2 font-display">
            <ShoppingBag className="h-5 w-5" />
            Your Cart
            {itemCount > 0 && (
              <span className="ml-auto text-sm font-normal text-muted-foreground">{itemCount} item{itemCount !== 1 ? "s" : ""}</span>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16">
              <div className="h-20 w-20 rounded-full bg-secondary grid place-items-center mb-4">
                <ShoppingBag className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-display font-semibold text-lg">Your cart is empty</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-6">Discover beautiful things you'll love.</p>
              <Button onClick={closeCart} asChild>
                <Link to="/products">Browse products</Link>
              </Button>
            </div>
          ) : (
            <ul className="space-y-3">
              <AnimatePresence initial={false}>
                {cartItems.map((item) => (
                  <motion.li
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 40, height: 0, marginTop: 0 }}
                    transition={{ duration: 0.25 }}
                    className="flex gap-3 p-3 rounded-xl bg-secondary/50 border border-border"
                  >
                    <div className="h-20 w-20 rounded-lg overflow-hidden bg-background flex-shrink-0">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <div className="h-full w-full grid place-items-center text-muted-foreground"><ShoppingBag className="h-6 w-6" /></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2">
                        <h4 className="text-sm font-medium leading-snug line-clamp-2 flex-1">{item.name}</h4>
                        <button onClick={() => removeFromCart(item.id)} className="text-muted-foreground hover:text-destructive transition-colors p-0.5" aria-label="Remove">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-sm font-semibold mt-1">{formatPrice(item.price)}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-1 bg-background border border-border rounded-full p-0.5">
                          <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="h-7 w-7 rounded-full grid place-items-center hover:bg-secondary transition-colors" aria-label="Decrease">
                            <Minus className="h-3 w-3" />
                          </button>
                          <motion.span key={item.quantity} initial={{ scale: 0.7 }} animate={{ scale: 1 }} className="text-sm font-semibold w-6 text-center">
                            {item.quantity}
                          </motion.span>
                          <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="h-7 w-7 rounded-full grid place-items-center hover:bg-secondary transition-colors" aria-label="Increase">
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <span className="text-sm font-semibold">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="border-t border-border px-6 py-5 space-y-4 bg-background">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{formatPrice(totalAmount)}</span></div>
              <div className="flex justify-between text-muted-foreground"><span>Shipping</span><span>Calculated at checkout</span></div>
              <div className="flex justify-between font-display font-bold text-lg pt-2 border-t border-border">
                <span>Total</span><span>{formatPrice(totalAmount)}</span>
              </div>
            </div>
            <div className="grid gap-2">
              <Button asChild size="lg" className="w-full bg-gradient-accent hover:opacity-90 text-accent-foreground border-0 shadow-glow" onClick={closeCart}>
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
