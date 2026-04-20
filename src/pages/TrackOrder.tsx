import { useState, type FormEvent, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag, Clock, CheckCircle2, ClipboardCheck,
  Package, Truck, Home, Loader2, MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trackOrder } from "@/lib/api/orders";
import type { Order } from "@/types/shop";
import { cn } from "@/lib/utils";

const stages = [
  {
    key: "pending",
    icon: ShoppingBag,
    label: "Order Placed",
    desc: "Your order has been received",
  },
  {
    key: "payment_pending",
    icon: Clock,
    label: "Payment Pending",
    desc: "Awaiting payment confirmation",
  },
  {
    key: "payment_confirmed",
    icon: CheckCircle2,
    label: "Payment Confirmed",
    desc: "Payment verified successfully",
  },
  {
    key: "order_issued",
    icon: ClipboardCheck,
    label: "Order Issued",
    desc: "Your order has been approved and issued",
  },
  {
    key: "processing",
    icon: Package,
    label: "Processing",
    desc: "Your items are being prepared",
  },
  {
    key: "in_transit",
    icon: Truck,
    label: "In Transit",
    desc: "Your order is on the way",
  },
  {
    key: "delivered",
    icon: Home,
    label: "Delivered",
    desc: "Your order has been delivered",
  },
];

// Map backend status values to our stage keys
function resolveStageKey(status: string): string {
  const map: Record<string, string> = {
    pending: "pending",
    payment_pending: "payment_pending",
    awaiting_payment: "payment_pending",
    payment_confirmed: "payment_confirmed",
    paid: "payment_confirmed",
    order_issued: "order_issued",
    issued: "order_issued",
    processing: "processing",
    packing: "processing",
    packed: "processing",
    in_transit: "in_transit",
    shipped: "in_transit",
    out_for_delivery: "in_transit",
    delivered: "delivered",
    completed: "delivered",
  };
  return map[status?.toLowerCase()] || "pending";
}

export default function TrackOrder() {
  const [params] = useSearchParams();
  const [orderId, setOrderId] = useState(params.get("id") || "");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const lookup = useCallback(async (e?: FormEvent) => {
    e?.preventDefault();
    if (!orderId) return;
    setLoading(true);
    const o = await trackOrder(orderId, phone);
    setOrder(o);
    setLastRefresh(new Date());
    setLoading(false);
  }, [orderId, phone]);

  // Auto-load when id is in URL
  useEffect(() => {
    if (params.get("id")) lookup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll every 30 seconds when order is loaded and not delivered
  useEffect(() => {
    if (!order) return;
    const stageKey = resolveStageKey(order.order_status || order.status || "");
    if (stageKey === "delivered") return;
    const interval = setInterval(() => {
      trackOrder(orderId, phone).then((o) => {
        if (o) { setOrder(o); setLastRefresh(new Date()); }
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [order, orderId, phone]);

  const rawStatus = order?.order_status || order?.status || "";
  const resolvedKey = resolveStageKey(rawStatus);
  const currentIndex = stages.findIndex((s) => s.key === resolvedKey);
  const progressPct = currentIndex >= 0 ? (currentIndex / (stages.length - 1)) * 100 : 0;

  return (
    <div className="container py-10 md:py-14">
      <div className="max-w-2xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display font-bold text-4xl md:text-5xl tracking-tight mb-2"
        >
          Track your order
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-muted-foreground mb-8"
        >
          Enter your order number to see real-time status updates.
        </motion.p>

        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          onSubmit={lookup}
          className="rounded-2xl border border-border bg-card p-6 grid sm:grid-cols-[1fr_1fr_auto] gap-3 items-end shadow-soft"
        >
          <div>
            <Label htmlFor="order">Order number</Label>
            <Input id="order" value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="ORD-XXXXXX" />
          </div>
          <div>
            <Label htmlFor="phone">Phone (optional)</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XX XXX XXX" />
          </div>
          <Button type="submit" disabled={loading} className="bg-foreground text-background h-10 min-w-[110px]">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Track"}
          </Button>
        </motion.form>

        <AnimatePresence mode="wait">
          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-8 rounded-2xl border border-border bg-card p-10 grid place-items-center"
            >
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <motion.div
                  animate={{ x: [-20, 20, -20] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Truck className="h-8 w-8 text-accent" />
                </motion.div>
                <span className="text-sm">Locating your package…</span>
              </div>
            </motion.div>
          )}

          {order && !loading && (
            <motion.div
              key="order"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="mt-8 rounded-2xl border border-border bg-card p-6 md:p-8 shadow-card overflow-hidden"
            >
              <div className="flex items-baseline justify-between mb-6 flex-wrap gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Order</p>
                  <p className="font-display font-bold text-2xl">{order.id}</p>
                </div>
                <motion.span
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 220, damping: 16, delay: 0.2 }}
                  className="px-3 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-semibold uppercase tracking-wider"
                >
                  {resolvedKey.replace(/_/g, " ")}
                </motion.span>
              </div>

              {/* Progress bar */}
              <div className="hidden md:block mb-10">
                <div className="relative h-1.5 rounded-full bg-secondary overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                    className="absolute inset-y-0 left-0 bg-gradient-accent rounded-full"
                  />
                </div>
                <div className="relative mt-3 flex justify-between">
                  {stages.map((s, i) => (
                    <div key={s.key} className="flex flex-col items-center" style={{ width: `${100 / stages.length}%` }}>
                      <div className={cn(
                        "h-2 w-2 rounded-full mb-1",
                        i <= currentIndex ? "bg-accent" : "bg-secondary border border-border"
                      )} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Stage list */}
              <ul className="relative space-y-1">
                <div className="absolute left-5 top-6 bottom-6 w-px bg-border" />
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: currentIndex > 0 ? `${(currentIndex / (stages.length - 1)) * 100}%` : 0 }}
                  transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                  className="absolute left-5 top-6 w-px bg-gradient-to-b from-success to-accent"
                />
                {stages.map((s, i) => {
                  const done = i < currentIndex;
                  const active = i === currentIndex;
                  const Icon = s.icon;
                  return (
                    <motion.li
                      key={s.key}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.1 }}
                      className="flex items-start gap-4 relative py-3"
                    >
                      <div className="relative z-10 flex-shrink-0">
                        {active && (
                          <motion.span
                            animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
                            transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
                            className="absolute inset-0 rounded-full bg-accent/40"
                          />
                        )}
                        <div
                          className={cn(
                            "h-10 w-10 rounded-full grid place-items-center transition-colors",
                            done && "bg-success text-success-foreground",
                            active && "bg-accent text-accent-foreground shadow-glow",
                            !done && !active && "bg-secondary text-muted-foreground"
                          )}
                        >
                          {done ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : active ? (
                            <MapPin className="h-4 w-4" />
                          ) : (
                            <Icon className="h-4 w-4" />
                          )}
                        </div>
                      </div>
                      <div className="flex-1 pt-1">
                        <p
                          className={cn(
                            "font-semibold leading-tight transition-colors",
                            done || active ? "text-foreground" : "text-muted-foreground"
                          )}
                        >
                          {s.label}
                        </p>
                        <p className="text-sm text-muted-foreground">{s.desc}</p>
                      </div>
                      {active && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-xs font-semibold uppercase tracking-wider text-accent self-center flex-shrink-0"
                        >
                          Current
                        </motion.span>
                      )}
                      {done && (
                        <span className="text-xs font-semibold uppercase tracking-wider text-success self-center flex-shrink-0">
                          Done ✓
                        </span>
                      )}
                    </motion.li>
                  );
                })}
              </ul>

              {lastRefresh && (
                <p className="text-xs text-muted-foreground mt-6 text-right">
                  Last updated: {lastRefresh.toLocaleTimeString()} · Auto-refreshes every 30s
                </p>
              )}
            </motion.div>
          )}

          {!loading && !order && orderId && (
            <motion.div
              key="not-found"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-8 rounded-2xl border border-border bg-card p-10 text-center"
            >
              <Package className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="font-display font-bold text-xl mb-2">Order not found</h3>
              <p className="text-muted-foreground text-sm">
                Check your order number and try again, or contact us via{" "}
                <a href="https://wa.me/254701377869" target="_blank" rel="noopener noreferrer" className="text-accent underline">
                  WhatsApp
                </a>
                .
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
