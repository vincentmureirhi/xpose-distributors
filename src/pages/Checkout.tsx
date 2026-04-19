import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronRight, CreditCard, Smartphone, Truck } from "lucide-react";
import { useCart, formatPrice } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createOrder } from "@/lib/api/orders";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import SuccessOverlay from "@/components/SuccessOverlay";

const steps = ["Shipping", "Payment", "Review"] as const;

export default function Checkout() {
  const { cartItems, totalAmount, clearCart } = useCart();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ id: string } | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    payment_method: "till",
  });

  useEffect(() => {
    document.title = "Checkout — XPOSE";
    if (cartItems.length === 0) navigate("/cart", { replace: true });
  }, [cartItems.length, navigate]);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const canProceed =
    step === 0 ? form.name && form.email && form.phone && form.address && form.city :
    step === 1 ? !!form.payment_method : true;

  const submit = async () => {
    setSubmitting(true);
    try {
      const order = await createOrder({
        items: cartItems,
        customer: { name: form.name, email: form.email, phone: form.phone, address: `${form.address}, ${form.city}` },
        payment_method: form.payment_method,
        total: totalAmount,
      });
      clearCart();
      setSuccess({ id: order.id });
    } catch (e: any) {
      toast.error("Could not place order", { description: e.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-10 md:py-14">
      <SuccessOverlay
        show={!!success}
        title="Order placed!"
        subtitle={success ? `Reference: ${success.id}` : ""}
        onDone={() => success && navigate(`/track-order?id=${success.id}`)}
      />
      <h1 className="font-display font-bold text-4xl md:text-5xl mb-8 tracking-tight">Checkout</h1>

      <div className="grid lg:grid-cols-[1fr_400px] gap-8">
        <div>
          <div className="flex items-center gap-2 mb-8">
            {steps.map((label, i) => (
              <div key={label} className="flex items-center gap-2 flex-1">
                <div className={cn("h-9 w-9 rounded-full grid place-items-center text-sm font-semibold transition-all", i < step ? "bg-success text-success-foreground" : i === step ? "bg-foreground text-background" : "bg-secondary text-muted-foreground")}>
                  {i < step ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span className={cn("text-sm font-medium hidden sm:inline", i === step ? "text-foreground" : "text-muted-foreground")}>{label}</span>
                {i < steps.length - 1 && <div className={cn("flex-1 h-px", i < step ? "bg-success" : "bg-border")} />}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }} className="rounded-2xl border border-border bg-card p-6">
              {step === 0 && (
                <div className="space-y-4">
                  <h2 className="font-display font-bold text-xl mb-2">Shipping details</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div><Label htmlFor="name">Full name</Label><Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} /></div>
                    <div><Label htmlFor="email">Email</Label><Input id="email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></div>
                    <div><Label htmlFor="phone">Phone</Label><Input id="phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} /></div>
                    <div><Label htmlFor="city">City</Label><Input id="city" value={form.city} onChange={(e) => set("city", e.target.value)} /></div>
                    <div className="sm:col-span-2"><Label htmlFor="address">Address</Label><Input id="address" value={form.address} onChange={(e) => set("address", e.target.value)} /></div>
                  </div>
                </div>
              )}
              {step === 1 && (
                <div className="space-y-4">
                  <h2 className="font-display font-bold text-xl mb-2">Payment method</h2>
                  {[
                    { id: "till", icon: Smartphone, label: "Manual Till", desc: "Pay to Till 711714 — fast and verified." },
                    { id: "card", icon: CreditCard, label: "Card", desc: "Visa, Mastercard, Amex." },
                    { id: "cod", icon: Truck, label: "Cash on delivery", desc: "Pay when your order arrives." },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => set("payment_method", m.id)}
                      className={cn("w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left", form.payment_method === m.id ? "border-accent bg-accent/5 shadow-soft" : "border-border hover:border-foreground/20")}
                    >
                      <m.icon className="h-5 w-5 text-accent" />
                      <div className="flex-1">
                        <p className="font-semibold">{m.label}</p>
                        <p className="text-sm text-muted-foreground">{m.desc}</p>
                      </div>
                      <div className={cn("h-5 w-5 rounded-full border-2 grid place-items-center", form.payment_method === m.id ? "border-accent" : "border-muted-foreground/30")}>
                        {form.payment_method === m.id && <div className="h-2.5 w-2.5 rounded-full bg-accent" />}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {step === 2 && (
                <div className="space-y-4">
                  <h2 className="font-display font-bold text-xl mb-2">Review & place order</h2>
                  <div className="rounded-xl bg-secondary p-4 space-y-2 text-sm">
                    <p><span className="text-muted-foreground">Ship to:</span> {form.name}, {form.address}, {form.city}</p>
                    <p><span className="text-muted-foreground">Contact:</span> {form.email} · {form.phone}</p>
                    <p><span className="text-muted-foreground">Payment:</span> {form.payment_method.toUpperCase()}</p>
                  </div>
                  <ul className="divide-y divide-border">
                    {cartItems.map((i) => (
                      <li key={i.id} className="py-3 flex items-center gap-3 text-sm">
                        <span className="flex-1">{i.name} × {i.quantity}</span>
                        <span className="font-semibold">{formatPrice(i.price * i.quantity)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between mt-6">
            <Button variant="ghost" onClick={() => (step === 0 ? navigate("/cart") : setStep(step - 1))}>
              ← {step === 0 ? "Back to cart" : "Previous"}
            </Button>
            {step < steps.length - 1 ? (
              <Button disabled={!canProceed} onClick={() => setStep(step + 1)} className="bg-foreground text-background">
                Continue <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button disabled={submitting} onClick={submit} size="lg" className="bg-gradient-accent text-accent-foreground border-0 shadow-glow">
                {submitting ? "Placing order…" : `Place order — ${formatPrice(totalAmount)}`}
              </Button>
            )}
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display font-bold text-lg mb-4">Order summary</h2>
            <ul className="space-y-3 mb-4 max-h-64 overflow-y-auto">
              {cartItems.map((i) => (
                <li key={i.id} className="flex gap-3 text-sm">
                  <div className="h-12 w-12 rounded-lg bg-secondary overflow-hidden flex-shrink-0">
                    {i.image_url && <img src={i.image_url} alt={i.name} className="h-full w-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="line-clamp-1">{i.name}</p>
                    <p className="text-xs text-muted-foreground">Qty {i.quantity}</p>
                  </div>
                  <span className="font-semibold">{formatPrice(i.price * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="space-y-1 text-sm pt-4 border-t border-border">
              <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{formatPrice(totalAmount)}</span></div>
              <div className="flex justify-between text-muted-foreground"><span>Shipping</span><span>Free</span></div>
              <div className="flex justify-between font-display font-bold text-xl pt-2"><span>Total</span><span>{formatPrice(totalAmount)}</span></div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
