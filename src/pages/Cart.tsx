import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart, formatPrice } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export default function Cart() {
  const { cartItems, updateQuantity, removeFromCart, totalAmount, clearCart } = useCart();
  useEffect(() => { document.title = "Cart — XPOSE"; }, []);

  if (cartItems.length === 0) {
    return (
      <div className="container py-32 text-center">
        <div className="h-20 w-20 rounded-full bg-secondary grid place-items-center mx-auto mb-5">
          <ShoppingBag className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="font-display font-bold text-3xl">Your cart is empty</h1>
        <p className="text-muted-foreground mt-2">Start exploring beautiful things you'll love.</p>
        <Button asChild className="mt-6"><Link to="/products">Browse products</Link></Button>
      </div>
    );
  }

  return (
    <div className="container py-10 md:py-14">
      <h1 className="font-display font-bold text-4xl md:text-5xl mb-8 tracking-tight">Cart</h1>

      <div className="grid lg:grid-cols-[1fr_400px] gap-8">
        <ul className="space-y-3">
          <AnimatePresence>
            {cartItems.map((item) => (
              <motion.li
                key={item.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 50 }}
                className="flex gap-4 p-4 rounded-2xl bg-card border border-border"
              >
                <Link to={`/products/${item.id}`} className="h-24 w-24 md:h-28 md:w-28 rounded-xl overflow-hidden bg-secondary flex-shrink-0">
                  {item.image_url && <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" loading="lazy" />}
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-3">
                    <Link to={`/products/${item.id}`} className="flex-1">
                      <h3 className="font-medium hover:text-accent transition-colors line-clamp-2">{item.name}</h3>
                    </Link>
                    <button onClick={() => removeFromCart(item.id)} className="text-muted-foreground hover:text-destructive p-1" aria-label="Remove">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{formatPrice(item.price)} each</p>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-1 bg-secondary rounded-full p-0.5">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="h-8 w-8 rounded-full grid place-items-center hover:bg-background transition-colors"><Minus className="h-3.5 w-3.5" /></button>
                      <motion.span key={item.quantity} initial={{ scale: 0.7 }} animate={{ scale: 1 }} className="w-8 text-center text-sm font-semibold">{item.quantity}</motion.span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="h-8 w-8 rounded-full grid place-items-center hover:bg-background transition-colors"><Plus className="h-3.5 w-3.5" /></button>
                    </div>
                    <p className="font-display font-bold">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
          <div className="pt-2">
            <Button variant="ghost" size="sm" onClick={clearCart} className="text-muted-foreground hover:text-destructive">Clear cart</Button>
          </div>
        </ul>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <h2 className="font-display font-bold text-xl">Order summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{formatPrice(totalAmount)}</span></div>
              <div className="flex justify-between text-muted-foreground"><span>Shipping</span><span>At checkout</span></div>
              <div className="flex justify-between font-display font-bold text-2xl pt-3 border-t border-border">
                <span>Total</span><span>{formatPrice(totalAmount)}</span>
              </div>
            </div>
            <Button asChild size="lg" className="w-full bg-gradient-accent text-accent-foreground border-0 shadow-glow hover:opacity-95">
              <Link to="/checkout">Proceed to checkout</Link>
            </Button>
            <Button asChild variant="outline" className="w-full"><Link to="/products">Continue shopping</Link></Button>
            <p className="text-xs text-muted-foreground text-center">Pricing is confirmed when your order is placed.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
