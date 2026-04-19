import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, FileText, Loader2, Mail, MapPin, Phone, User } from "lucide-react";
import { useCart, formatPrice } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { guestCheckout } from "@/lib/api/orders";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import SuccessOverlay from "@/components/SuccessOverlay";

const schema = z.object({
  customer_name: z.string().min(2, "Full name must be at least 2 characters"),
  customer_phone: z.string().min(9, "Enter a valid phone number"),
  customer_email: z
    .string()
    .email("Enter a valid email address")
    .optional()
    .or(z.literal("")),
  delivery_address: z.string().min(5, "Enter a complete delivery address"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const fieldVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35 },
  }),
};

export default function Checkout() {
  const { cartItems, totalAmount, clearCart } = useCart();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ id: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    document.title = "Checkout — XPOSE";
    if (cartItems.length === 0) navigate("/cart", { replace: true });
  }, [cartItems.length, navigate]);

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const result = await guestCheckout({
        customer_name: values.customer_name,
        customer_phone: values.customer_phone,
        customer_email: values.customer_email || undefined,
        delivery_address: values.delivery_address,
        notes: values.notes || undefined,
        items: cartItems.map((i) => ({ product_id: i.id, quantity: i.quantity })),
      });
      clearCart();
      const orderId = result.order_number || result.id;
      setSuccess({ id: orderId ? String(orderId) : "" });
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      toast.error("Could not place order", {
        description: err?.response?.data?.message || err.message || "Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-10 md:py-14">
      <SuccessOverlay
        show={!!success}
        title="Order placed! 🎉"
        subtitle={success?.id ? `Order reference: ${success.id}` : "Your order has been received!"}
        onDone={() => navigate("/")}
      />

      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
          <Link to="/cart">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to cart
          </Link>
        </Button>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="font-display font-bold text-4xl md:text-5xl tracking-tight">Checkout</h1>
          <p className="text-muted-foreground mt-2">Fill in your details and we'll handle the rest.</p>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-[1fr_400px] gap-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="rounded-2xl border border-border bg-card p-6 md:p-8 space-y-6"
          >
            <div>
              <h2 className="font-display font-bold text-xl">Your details</h2>
              <p className="text-sm text-muted-foreground mt-1">
                No account needed — just fill in your details below.
              </p>
            </div>

            {/* Full Name */}
            <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-1.5">
              <Label htmlFor="customer_name">
                <span className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Full Name <span className="text-destructive ml-0.5">*</span>
                </span>
              </Label>
              <Input
                id="customer_name"
                placeholder="Jane Doe"
                {...register("customer_name")}
                className={cn("h-12", errors.customer_name && "border-destructive focus-visible:ring-destructive")}
              />
              {errors.customer_name && (
                <p className="text-xs text-destructive">{errors.customer_name.message}</p>
              )}
            </motion.div>

            {/* Phone */}
            <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-1.5">
              <Label htmlFor="customer_phone">
                <span className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  Phone Number <span className="text-destructive ml-0.5">*</span>
                </span>
              </Label>
              <Input
                id="customer_phone"
                type="tel"
                placeholder="0712 345 678"
                {...register("customer_phone")}
                className={cn("h-12", errors.customer_phone && "border-destructive focus-visible:ring-destructive")}
              />
              {errors.customer_phone && (
                <p className="text-xs text-destructive">{errors.customer_phone.message}</p>
              )}
            </motion.div>

            {/* Email */}
            <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-1.5">
              <Label htmlFor="customer_email">
                <span className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  Email Address
                  <span className="text-muted-foreground text-xs font-normal">(optional)</span>
                </span>
              </Label>
              <Input
                id="customer_email"
                type="email"
                placeholder="jane@example.com"
                {...register("customer_email")}
                className={cn("h-12", errors.customer_email && "border-destructive focus-visible:ring-destructive")}
              />
              {errors.customer_email && (
                <p className="text-xs text-destructive">{errors.customer_email.message}</p>
              )}
            </motion.div>

            {/* Delivery Address */}
            <motion.div custom={3} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-1.5">
              <Label htmlFor="delivery_address">
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  Delivery Address <span className="text-destructive ml-0.5">*</span>
                </span>
              </Label>
              <Input
                id="delivery_address"
                placeholder="123 Main St, Nairobi"
                {...register("delivery_address")}
                className={cn("h-12", errors.delivery_address && "border-destructive focus-visible:ring-destructive")}
              />
              {errors.delivery_address && (
                <p className="text-xs text-destructive">{errors.delivery_address.message}</p>
              )}
            </motion.div>

            {/* Notes */}
            <motion.div custom={4} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-1.5">
              <Label htmlFor="notes">
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Additional Notes
                  <span className="text-muted-foreground text-xs font-normal">(optional)</span>
                </span>
              </Label>
              <Textarea
                id="notes"
                placeholder="Please deliver before 5pm, leave at gate…"
                rows={3}
                {...register("notes")}
                className="resize-none"
              />
            </motion.div>

            <motion.div custom={5} variants={fieldVariants} initial="hidden" animate="visible">
              <Button
                type="submit"
                size="lg"
                disabled={submitting}
                className="w-full h-14 bg-gradient-accent text-accent-foreground border-0 shadow-glow text-base font-semibold"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Placing order…
                  </>
                ) : (
                  `Place order — ${formatPrice(totalAmount)}`
                )}
              </Button>
            </motion.div>
          </form>
        </motion.div>

        {/* Order Summary */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="rounded-2xl border border-border bg-card p-6"
          >
            <h2 className="font-display font-bold text-lg mb-4">Order summary</h2>
            <ul className="space-y-3 mb-4 max-h-64 overflow-y-auto">
              {cartItems.map((i) => (
                <li key={i.id} className="flex gap-3 text-sm">
                  <div className="h-12 w-12 rounded-lg bg-secondary overflow-hidden flex-shrink-0">
                    {i.image_url && (
                      <img src={i.image_url} alt={i.name} className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="line-clamp-1">{i.name}</p>
                    <p className="text-xs text-muted-foreground">Qty {i.quantity}</p>
                  </div>
                  <span className="font-semibold whitespace-nowrap">{formatPrice(i.price * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="space-y-1 text-sm pt-4 border-t border-border">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatPrice(totalAmount)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <div className="flex justify-between font-display font-bold text-xl pt-2 border-t border-border">
                <span>Total</span>
                <span>{formatPrice(totalAmount)}</span>
              </div>
            </div>
          </motion.div>
        </aside>
      </div>
    </div>
  );
}
