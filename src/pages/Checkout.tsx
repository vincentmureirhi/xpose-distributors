import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, CreditCard, FileText, Loader2, MapPin, Phone, User, Truck, X } from "lucide-react";
import { useCart, formatPrice } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { guestCheckout } from "@/lib/api/orders";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { searchLocations } from "@/lib/kenya-locations";
import OrderSuccessOverlay from "@/components/OrderSuccessOverlay";
import { getCartPricingMessage, isWholesaleEligible } from "@/lib/pricingMessaging";
import {
  buildRouteOrderNotes,
  createRouteCustomer,
  getStoredRouteCustomers,
  saveRouteCustomers,
  type RouteCustomer,
} from "@/lib/routeCustomerWorkflow";

const TRANSPORT_COMPANIES = [
  "NAEKANA Sacco",
  "Coast Bus",
  "Modern Coast",
  "Easy Coach",
  "Ena Coach",
  "Greenline",
  "Climax Coaches",
  "Crown Bus",
  "Dreamline",
  "Mash East Africa",
  "North Rift Shuttle",
  "Mololine",
  "2NK Sacco",
  "G4S Kenya (Cargo)",
  "Wells Fargo (Cargo)",
  "Fargo Courier",
  "Posta Kenya",
  "Sendy",
  "Pickup Mtaani",
  "KBS (Kenya Bus Service)",
  "Metro Trans",
  "Double M",
  "Crossland Express",
  "Tahmeed Coach",
  "Guardian Coach",
  "Simba Coach",
  "Intercity Express",
];

const schema = z.object({
  customer_name: z.string().min(2, "Full name must be at least 2 characters"),
  customer_phone: z
    .string()
    .min(9, "Enter a valid Kenyan phone number")
    .regex(/^(0|\+254|254)[17]\d{8}$/, "Enter a valid Kenyan phone number (e.g. 07XX XXX XXX)"),
  delivery_location: z.string().min(2, "Select or type your delivery location"),
  transport_company: z.string().min(2, "Please select a transport company"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;
type CheckoutWorkflow = "self_service" | "sales_rep";

const fieldVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35 },
  }),
};

export default function Checkout() {
  const { cartItems, totalAmount, clearCart, evaluations } = useCart();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ id: string } | null>(null);
  const [workflow, setWorkflow] = useState<CheckoutWorkflow>(
    searchParams.get("workflow") === "sales-rep" ? "sales_rep" : "self_service"
  );
  const [routeCustomers, setRouteCustomers] = useState<RouteCustomer[]>([]);
  const [selectedRouteCustomerId, setSelectedRouteCustomerId] = useState("");
  const [repName, setRepName] = useState("");
  const [repPhone, setRepPhone] = useState("");
  const [repArea, setRepArea] = useState("");
  const [newRouteCustomer, setNewRouteCustomer] = useState({
    name: "",
    phone: "",
    location: "",
    notes: "",
  });

  const [locationQuery, setLocationQuery] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [locationOpen, setLocationOpen] = useState(false);
  const locationRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    document.title = "Checkout — XPOSE";
    if (cartItems.length === 0) navigate("/cart", { replace: true });
  }, [cartItems.length, navigate]);

  useEffect(() => {
    setRouteCustomers(getStoredRouteCustomers());
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (locationRef.current && !locationRef.current.contains(e.target as Node)) {
        setLocationOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLocationInput = (q: string) => {
    setLocationQuery(q);
    setValue("delivery_location", q);
    const results = searchLocations(q, 8);
    setLocationSuggestions(results);
    setLocationOpen(results.length > 0);
  };

  const selectLocation = (loc: string) => {
    setLocationQuery(loc);
    setValue("delivery_location", loc, { shouldValidate: true });
    setLocationOpen(false);
  };

  const applyRouteCustomer = (customer: RouteCustomer) => {
    setSelectedRouteCustomerId(customer.id);
    setValue("customer_name", customer.name, { shouldValidate: true });
    setValue("customer_phone", customer.phone, { shouldValidate: true });
    if (customer.location) {
      setLocationQuery(customer.location);
      setValue("delivery_location", customer.location, { shouldValidate: true });
    }
  };

  const changeWorkflow = (next: CheckoutWorkflow) => {
    setWorkflow(next);
    const nextParams = new URLSearchParams(searchParams);
    if (next === "sales_rep") {
      nextParams.set("workflow", "sales-rep");
      if (!selectedRouteCustomerId && routeCustomers[0]) {
        applyRouteCustomer(routeCustomers[0]);
      }
    } else {
      nextParams.delete("workflow");
      setSelectedRouteCustomerId("");
    }
    setSearchParams(nextParams, { replace: true });
  };

  const selectedRouteCustomer = routeCustomers.find((c) => c.id === selectedRouteCustomerId);

  const addRouteCustomerInline = () => {
    const name = newRouteCustomer.name.trim();
    const phone = newRouteCustomer.phone.trim();
    const location = newRouteCustomer.location.trim();
    if (!name || !phone || !location) {
      toast.error("Add customer details", {
        description: "Name, phone, and location are required for route customers.",
      });
      return;
    }

    const customer = createRouteCustomer(newRouteCustomer, new Date());
    const updated = [customer, ...routeCustomers];
    setRouteCustomers(updated);
    saveRouteCustomers(updated);
    applyRouteCustomer(customer);
    setNewRouteCustomer({ name: "", phone: "", location: "", notes: "" });
    toast.success("Route customer saved", {
      description: `${customer.name} is now selected for this order.`,
    });
  };

  const clearSelectedRouteCustomer = () => {
    setSelectedRouteCustomerId("");
    setValue("customer_name", "", { shouldValidate: true });
    setValue("customer_phone", "", { shouldValidate: true });
  };

  const resolveCheckoutCustomerData = (values: FormValues) => {
    if (workflow === "sales_rep" && selectedRouteCustomer) {
      return {
        customerName: selectedRouteCustomer.name,
        customerPhone: selectedRouteCustomer.phone,
        deliveryLocation: selectedRouteCustomer.location || values.delivery_location,
      };
    }

    return {
      customerName: values.customer_name,
      customerPhone: values.customer_phone,
      deliveryLocation: values.delivery_location,
    };
  };

  const onSubmit = async (values: FormValues) => {
    if (workflow === "sales_rep") {
      if (!repName.trim()) {
        toast.error("Sales rep name required", {
          description: "Add your name to capture a route customer order.",
        });
        return;
      }
      if (!selectedRouteCustomer) {
        toast.error("Select a route customer", {
          description: "Choose an existing route customer or add one inline.",
        });
        return;
      }
    }

    setSubmitting(true);
    try {
      const orderNotes =
        workflow === "sales_rep" && selectedRouteCustomer
          ? buildRouteOrderNotes({
              rep_name: repName,
              rep_phone: repPhone || undefined,
              rep_area: repArea || undefined,
              route_customer: selectedRouteCustomer,
              order_notes: values.notes || undefined,
            })
          : values.notes || undefined;

      const { customerName, customerPhone, deliveryLocation } = resolveCheckoutCustomerData(values);

      const result = await guestCheckout({
        customer_name: customerName,
        customer_phone: customerPhone,
        delivery_address: `${deliveryLocation} — ${values.transport_company}`,
        notes: orderNotes,
        items: cartItems.map((i) => {
          const ev = evaluations[i.id];
          return { product_id: i.id, quantity: i.quantity, unit_price: ev ? ev.unit_price : i.price };
        }),
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
      <OrderSuccessOverlay
        show={!!success}
        orderId={success?.id || ""}
        onDone={() => navigate(success?.id ? `/track-order?id=${success.id}` : "/track-order")}
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
                {workflow === "sales_rep"
                  ? "Capture orders for route customers in the field."
                  : "No account needed — just fill in your details below."}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-secondary/40 p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Checkout workflow</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={workflow === "self_service" ? "default" : "outline"}
                  className="h-10"
                  onClick={() => changeWorkflow("self_service")}
                >
                  Customer self-service
                </Button>
                <Button
                  type="button"
                  variant={workflow === "sales_rep" ? "default" : "outline"}
                  className="h-10"
                  onClick={() => changeWorkflow("sales_rep")}
                >
                  Sales rep order capture
                </Button>
              </div>
            </div>

            {workflow === "sales_rep" && (
              <>
                <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-3">
                  <p className="text-sm font-semibold">Sales rep details</p>
                  <div className="grid md:grid-cols-3 gap-3">
                    <Input
                      value={repName}
                      onChange={(e) => setRepName(e.target.value)}
                      placeholder="Rep name *"
                      className="h-11"
                    />
                    <Input
                      value={repPhone}
                      onChange={(e) => setRepPhone(e.target.value)}
                      placeholder="Rep phone"
                      className="h-11"
                    />
                    <Input
                      value={repArea}
                      onChange={(e) => setRepArea(e.target.value)}
                      placeholder="Current area / route"
                      className="h-11"
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-3">
                  <p className="text-sm font-semibold">Route customer</p>
                  <div className="grid md:grid-cols-[1fr_auto] gap-3">
                    <select
                      value={selectedRouteCustomerId}
                      onChange={(e) => {
                        const customer = routeCustomers.find((c) => c.id === e.target.value);
                        if (customer) applyRouteCustomer(customer);
                        else clearSelectedRouteCustomer();
                      }}
                      className="w-full h-11 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring"
                    >
                      <option value="">Select existing route customer…</option>
                      {routeCustomers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name} — {customer.location}
                        </option>
                      ))}
                    </select>
                    <Button type="button" variant="outline" className="h-11" onClick={clearSelectedRouteCustomer}>
                      Clear
                    </Button>
                  </div>

                  <div className="rounded-lg border border-dashed border-border p-3 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Add route customer inline
                    </p>
                    <div className="grid md:grid-cols-3 gap-3">
                      <Input
                        value={newRouteCustomer.name}
                        onChange={(e) => setNewRouteCustomer((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="Business / customer name"
                        className="h-11"
                      />
                      <Input
                        value={newRouteCustomer.phone}
                        onChange={(e) => setNewRouteCustomer((prev) => ({ ...prev, phone: e.target.value }))}
                        placeholder="Phone number"
                        className="h-11"
                      />
                      <Input
                        value={newRouteCustomer.location}
                        onChange={(e) => setNewRouteCustomer((prev) => ({ ...prev, location: e.target.value }))}
                        placeholder="Location / area"
                        className="h-11"
                      />
                    </div>
                    <Textarea
                      value={newRouteCustomer.notes}
                      onChange={(e) => setNewRouteCustomer((prev) => ({ ...prev, notes: e.target.value }))}
                      placeholder="Route customer notes (optional)"
                      rows={2}
                      className="resize-none"
                    />
                    <Button type="button" variant="outline" className="h-10" onClick={addRouteCustomerInline}>
                      Save and use customer
                    </Button>
                  </div>

                  {selectedRouteCustomer && (
                    <div className="rounded-lg border border-accent/30 bg-accent/5 p-3 text-sm">
                      <p className="font-semibold">Ordering for: {selectedRouteCustomer.name}</p>
                      <p className="text-muted-foreground">{selectedRouteCustomer.phone} • {selectedRouteCustomer.location}</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Full Name */}
            <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-1.5">
              <Label htmlFor="customer_name">
                <span className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  {workflow === "sales_rep" ? "Route Customer Name" : "Full Name"} <span className="text-destructive ml-0.5">*</span>
                </span>
              </Label>
              <Input
                id="customer_name"
                placeholder={workflow === "sales_rep" ? "Selected route customer" : "Jane Doe"}
                {...register("customer_name")}
                readOnly={workflow === "sales_rep"}
                className={cn(
                  "h-12",
                  workflow === "sales_rep" && "bg-secondary/50",
                  errors.customer_name && "border-destructive focus-visible:ring-destructive"
                )}
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
                  {workflow === "sales_rep" ? "Route Customer Phone" : "Phone Number"} <span className="text-destructive ml-0.5">*</span>
                </span>
              </Label>
              <Input
                id="customer_phone"
                type="tel"
                placeholder={workflow === "sales_rep" ? "Selected route customer phone" : "0701 377 869"}
                {...register("customer_phone")}
                readOnly={workflow === "sales_rep"}
                className={cn(
                  "h-12",
                  workflow === "sales_rep" && "bg-secondary/50",
                  errors.customer_phone && "border-destructive focus-visible:ring-destructive"
                )}
              />
              {errors.customer_phone && (
                <p className="text-xs text-destructive">{errors.customer_phone.message}</p>
              )}
            </motion.div>

            {/* Delivery Location — autocomplete */}
            <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-1.5">
              <Label htmlFor="delivery_location">
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  Delivery Location <span className="text-destructive ml-0.5">*</span>
                </span>
              </Label>
              <Controller
                name="delivery_location"
                control={control}
                render={() => (
                  <div className="relative" ref={locationRef}>
                    <div className="relative">
                      <Input
                        id="delivery_location"
                        value={locationQuery}
                        onChange={(e) => handleLocationInput(e.target.value)}
                        onFocus={() => {
                          if (locationSuggestions.length > 0) setLocationOpen(true);
                        }}
                        placeholder="Type a city or area (e.g. Nairobi, Westlands…)"
                        autoComplete="off"
                        className={cn("h-12 pr-8", errors.delivery_location && "border-destructive focus-visible:ring-destructive")}
                      />
                      {locationQuery && (
                        <button
                          type="button"
                          onClick={() => { setLocationQuery(""); setValue("delivery_location", ""); setLocationOpen(false); }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <AnimatePresence>
                      {locationOpen && locationSuggestions.length > 0 && (
                        <motion.ul
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.15 }}
                          className="absolute z-30 top-full left-0 right-0 mt-1 rounded-xl border border-border bg-card shadow-elevated overflow-hidden max-h-56 overflow-y-auto"
                        >
                          {locationSuggestions.map((loc) => (
                            <li key={loc}>
                              <button
                                type="button"
                                onMouseDown={() => selectLocation(loc)}
                                className="w-full text-left px-4 py-2.5 text-sm hover:bg-secondary flex items-center gap-2"
                              >
                                <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                {loc}
                              </button>
                            </li>
                          ))}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              />
              {errors.delivery_location && (
                <p className="text-xs text-destructive">{errors.delivery_location.message}</p>
              )}
            </motion.div>

            {/* Mode of Transport */}
            <motion.div custom={3} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-1.5">
              <Label htmlFor="transport_company">
                <span className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  Mode of Transport <span className="text-destructive ml-0.5">*</span>
                </span>
              </Label>
              <select
                id="transport_company"
                {...register("transport_company")}
                className={cn(
                  "w-full h-12 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring",
                  errors.transport_company && "border-destructive"
                )}
              >
                <option value="">Select transport company…</option>
                {TRANSPORT_COMPANIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {errors.transport_company && (
                <p className="text-xs text-destructive">{errors.transport_company.message}</p>
              )}
            </motion.div>

            {/* Notes */}
            <motion.div custom={4} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-1.5">
              <Label htmlFor="notes">
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  {workflow === "sales_rep" ? "Order Notes" : "Additional Notes"}
                  <span className="text-muted-foreground text-xs font-normal">(optional)</span>
                </span>
              </Label>
              <Textarea
                id="notes"
                placeholder="Any special instructions for your order…"
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
                  `${workflow === "sales_rep" ? "Capture route order" : "Place order"} — ${formatPrice(totalAmount)}`
                )}
              </Button>
            </motion.div>
            {workflow === "sales_rep" && selectedRouteCustomer && (
              <p className="text-xs text-muted-foreground">
                This order will be submitted on behalf of <span className="font-semibold text-foreground">{selectedRouteCustomer.name}</span>.
              </p>
            )}
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
            {workflow === "sales_rep" && selectedRouteCustomer && (
              <div className="mb-4 rounded-lg border border-accent/30 bg-accent/5 p-3 text-sm">
                <p className="font-semibold">Route customer order</p>
                <p className="text-muted-foreground">
                  {selectedRouteCustomer.name} • {selectedRouteCustomer.location}
                </p>
              </div>
            )}
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                    <th className="py-2 text-left font-medium">Product</th>
                    <th className="py-2 text-center font-medium">Qty</th>
                    <th className="py-2 text-right font-medium">Price</th>
                    <th className="py-2 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {cartItems.map((i) => {
                    const ev = evaluations[i.id];
                    const unitPrice = ev ? ev.unit_price : i.price;
                    const lineTotal = ev ? ev.line_total : i.price * i.quantity;
                    const pricingLabel = ev?.pricing_label;
                    const pricingMessage = getCartPricingMessage(ev, i.quantity);
                    const wholesaleEligible = isWholesaleEligible(ev);
                    return (
                    <tr key={i.id} className="border-b border-border/50">
                      <td className="py-2.5 pr-2">
                        <div className="flex items-center gap-2">
                          {i.image_url && (
                            <div className="h-8 w-8 rounded-md bg-secondary overflow-hidden flex-shrink-0">
                              <img src={i.image_url} alt={i.name} className="h-full w-full object-cover" />
                            </div>
                          )}
                          <div>
                            <span className="line-clamp-2 leading-snug">{i.name}</span>
                            {pricingLabel && (
                              <span className={`block text-[10px] font-semibold uppercase tracking-wider mt-0.5 ${wholesaleEligible ? "text-accent" : "text-muted-foreground"}`}>
                                {pricingLabel}
                              </span>
                            )}
                            {pricingMessage && (
                              <span className={`block text-[10px] mt-0.5 ${wholesaleEligible ? "text-accent" : "text-muted-foreground"}`}>
                                {pricingMessage}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 text-center text-muted-foreground">{i.quantity}</td>
                      <td className="py-2.5 text-right whitespace-nowrap">{formatPrice(unitPrice)}</td>
                      <td className="py-2.5 text-right whitespace-nowrap font-semibold">{formatPrice(lineTotal)}</td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="space-y-1 text-sm pt-3 border-t border-border">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatPrice(totalAmount)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span>{totalAmount >= 75000 ? "Free" : "Calculated at dispatch"}</span>
              </div>
              <div className="flex justify-between font-display font-bold text-xl pt-2 border-t border-border">
                <span>Total</span>
                <span>{formatPrice(totalAmount)}</span>
              </div>
            </div>

            {/* Payment info */}
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Payment</p>
              </div>
              <div className="rounded-lg bg-secondary/60 p-3 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Method</span>
                  <span className="font-semibold">M-Pesa Buy Goods</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Till Number</span>
                  <span className="font-bold tracking-widest">711714</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Business</span>
                  <span className="font-semibold">XPOSE</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Payment instructions will be shown after placing your order.
              </p>
            </div>
          </motion.div>
        </aside>
      </div>
    </div>
  );
}
