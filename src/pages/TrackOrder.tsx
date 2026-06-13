import { useState, type FormEvent, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag, CheckCircle2,
  Package, Truck, Home, Loader2, MapPin, XCircle, CreditCard, PhoneCall, ShieldCheck, KeyRound
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trackOrder, trackOrderByToken, trackOrderByPhoneRecovery, trackOrderRecovery } from "@/lib/api/orders";
import {
  CUSTOMER_ORDER_PREPARING_STAGE_KEY,
  CUSTOMER_ORDER_PROGRESS_STAGES,
  getCustomerOrderStatusInfo,
  resolveCustomerOrderStage,
} from "@/lib/orderTrackingStatus";
import type { Order } from "@/types/shop";
import { cn } from "@/lib/utils";

const TILL_NUMBER = "711714";
const WHATSAPP_LINK = "https://wa.me/254701377869";

const STAGE_ICONS = {
  pending: ShoppingBag,
  processing: Package,
  dispatched: Truck,
  completed: Home,
} as const;

const stages = CUSTOMER_ORDER_PROGRESS_STAGES.map((key) => ({
  ...getCustomerOrderStatusInfo(key),
  icon: STAGE_ICONS[key],
}));

interface RecentOrder {
  orderId: string;
  trackingUrl?: string | null;
  savedAt?: string;
}

function toLocalTrackingPath(trackingUrl?: string | null, fallbackId?: string) {
  if (trackingUrl) {
    try {
      const parsed = new URL(trackingUrl);
      return `${parsed.pathname}${parsed.search}`;
    } catch {
      if (trackingUrl.startsWith("/")) return trackingUrl;
    }
  }

  return fallbackId ? `/track-order?id=${encodeURIComponent(fallbackId)}` : "/track-order";
}

export default function TrackOrder() {
  const [params] = useSearchParams();
  const secureToken = params.get("t") || "";
  const [orderId, setOrderId] = useState(params.get("id") || "");
  const [phone, setPhone] = useState("");
  const [phoneLast3, setPhoneLast3] = useState("");
  const [recoveryPhone, setRecoveryPhone] = useState("");
  const [recoveryTotal, setRecoveryTotal] = useState("");
  const [recoveryLocation, setRecoveryLocation] = useState("");
  const [recoveryStep, setRecoveryStep] = useState<"identity" | "challenge">("identity");
  const [verificationType, setVerificationType] = useState<"total" | "location">("total");
  const [verificationAnswer, setVerificationAnswer] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [recentOrder, setRecentOrder] = useState<RecentOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("xpose_recent_order");
      if (!raw) return;
      const parsed = JSON.parse(raw) as RecentOrder;
      if (parsed?.orderId) setRecentOrder(parsed);
    } catch {
      setRecentOrder(null);
    }
  }, []);

  const lookupByToken = useCallback(async () => {
    if (!secureToken) return;

    setValidationError(null);
    setLoading(true);
    setSearched(true);

    try {
      const o = await trackOrderByToken(secureToken);
      setOrder(o);
      setLastRefresh(o ? new Date() : null);
      if (!o) {
        setValidationError("This tracking link is invalid or has expired. Use manual verification below or contact support.");
      }
    } finally {
      setLoading(false);
    }
  }, [secureToken]);

  const lookup = useCallback(async (e?: FormEvent) => {
    e?.preventDefault();
    setValidationError(null);
    if (!orderId.trim() && !phone.trim()) {
      setValidationError("Please enter your order number and phone number.");
      return;
    }
    if (!orderId.trim()) {
      setValidationError("Please enter your order number.");
      return;
    }
    if (!phone.trim()) {
      setValidationError("Please enter your phone number.");
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const o = await trackOrder(orderId.trim(), phone.trim());
      setOrder(o);
      setLastRefresh(o ? new Date() : null);
    } finally {
      setLoading(false);
    }
  }, [orderId, phone]);

  const beginRecovery = useCallback((e?: FormEvent) => {
    e?.preventDefault();
    setValidationError(null);
    setOrder(null);
    setSearched(false);

    if (!orderId.trim()) {
      setValidationError("Enter your order number first.");
      return;
    }

    const digits = phoneLast3.replace(/\D/g, "");
    if (digits.length !== 3) {
      setValidationError("Enter exactly the last 3 digits of the phone number used during checkout.");
      return;
    }

    setPhoneLast3(digits);
    setRecoveryStep("challenge");
  }, [orderId, phoneLast3]);

  const lookupByRecovery = useCallback(async (e?: FormEvent) => {
    e?.preventDefault();
    setValidationError(null);

    if (!orderId.trim()) {
      setValidationError("Enter your order number first.");
      return;
    }

    const digits = phoneLast3.replace(/\D/g, "");
    if (digits.length !== 3) {
      setValidationError("Enter exactly the last 3 phone digits.");
      setRecoveryStep("identity");
      return;
    }

    if (!verificationAnswer.trim()) {
      setValidationError(
        verificationType === "total"
          ? "Enter the order total in Kenya shillings."
          : "Enter the delivery town, estate, or route area used on the order."
      );
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      const o = await trackOrderRecovery({
        orderNumber: orderId.trim(),
        phoneLast3: digits,
        verificationType,
        verificationAnswer: verificationAnswer.trim(),
      });
      setOrder(o);
      setLastRefresh(o ? new Date() : null);
      if (!o) {
        setValidationError("We could not verify that order. Check the order number and answers, then try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [orderId, phoneLast3, verificationAnswer, verificationType]);

  const lookupWithoutOrderNumber = useCallback(async (e?: FormEvent) => {
    e?.preventDefault();
    setValidationError(null);

    if (!recoveryPhone.trim()) {
      setValidationError("Enter the phone number used during checkout.");
      return;
    }

    if (!recoveryTotal.trim()) {
      setValidationError("Enter the order total in Kenya shillings.");
      return;
    }

    if (!recoveryLocation.trim()) {
      setValidationError("Enter the delivery town, estate, or route area used on the order.");
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      const o = await trackOrderByPhoneRecovery({
        phone: recoveryPhone.trim(),
        orderTotal: recoveryTotal.trim(),
        deliveryArea: recoveryLocation.trim(),
      });
      setOrder(o);
      setLastRefresh(o ? new Date() : null);
      if (o?.order_number) setOrderId(String(o.order_number));
      if (!o) {
        setValidationError("We could not verify that order. Check the phone, amount, and delivery area, then try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [recoveryLocation, recoveryPhone, recoveryTotal]);

  // Auto-load only secure links. Plain order numbers still need phone verification.
  useEffect(() => {
    if (secureToken) lookupByToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secureToken]);

  // Poll every 30 seconds when order is loaded and not in a terminal state
  useEffect(() => {
    if (!order) return;
    const stageKey = resolveCustomerOrderStage(order.order_status || order.status || "");
    if (stageKey === "completed" || stageKey === "cancelled") return;
    const interval = setInterval(() => {
      const request = secureToken
        ? trackOrderByToken(secureToken)
        : phone.trim()
          ? trackOrder(orderId, phone)
          : phoneLast3.trim() && verificationAnswer.trim()
            ? trackOrderRecovery({
                orderNumber: orderId,
                phoneLast3,
                verificationType,
                verificationAnswer,
              })
            : recoveryPhone.trim() && recoveryTotal.trim() && recoveryLocation.trim()
              ? trackOrderByPhoneRecovery({
                  phone: recoveryPhone,
                  orderTotal: recoveryTotal,
                  deliveryArea: recoveryLocation,
                })
            : null;

      if (!request) return;

      request.then((o) => {
        if (o) { setOrder(o); setLastRefresh(new Date()); }
      }).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [order, orderId, phone, phoneLast3, recoveryLocation, recoveryPhone, recoveryTotal, secureToken, verificationAnswer, verificationType]);

  const rawStatus = order?.order_status || order?.status || "";
  const resolvedKey = resolveCustomerOrderStage(rawStatus);
  const currentStatus = getCustomerOrderStatusInfo(rawStatus);
  const preparingOrderLabel = getCustomerOrderStatusInfo(CUSTOMER_ORDER_PREPARING_STAGE_KEY).label;
  const isCancelled = resolvedKey === "cancelled";
  const isPending = resolvedKey === "pending";
  const currentIndex = isCancelled ? -1 : stages.findIndex((s) => s.key === resolvedKey);
  const progressPct = currentIndex >= 0 ? (currentIndex / (stages.length - 1)) * 100 : 0;
  const orderTotal = order?.total || order?.total_amount;

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
          Use your private tracking link for the fastest access. If you lost it, recover the order with two small checks only the buyer should know.
        </motion.p>

        {secureToken && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="mb-5 flex items-start gap-3 rounded-xl border border-success/20 bg-success/5 p-4 text-sm"
          >
            <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-success" />
            <div>
              <p className="font-semibold text-foreground">Secure tracking link</p>
              <p className="text-muted-foreground">
                This private link verifies your order without asking for your phone number. Keep it private.
              </p>
            </div>
          </motion.div>
        )}

        {!secureToken && recentOrder && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="mb-5 rounded-xl border border-accent/25 bg-accent/5 p-4 text-sm"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-foreground">Recent order on this device</p>
                <p className="text-muted-foreground">
                  {recentOrder.orderId}
                  {recentOrder.savedAt ? ` - saved ${new Date(recentOrder.savedAt).toLocaleDateString()}` : ""}
                </p>
              </div>
              <Link
                to={toLocalTrackingPath(recentOrder.trackingUrl, recentOrder.orderId)}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-accent px-4 text-sm font-bold text-accent-foreground"
              >
                Open tracking
              </Link>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid gap-4"
        >
          <form
            onSubmit={lookupWithoutOrderNumber}
            className="rounded-2xl border border-accent/25 bg-card p-5 shadow-soft md:p-6"
          >
            <div className="mb-4 flex items-start gap-3">
              <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">
                <PhoneCall className="h-5 w-5" />
              </div>
              <div>
                <p className="font-display text-lg font-bold">I do not have my order number</p>
                <p className="text-sm text-muted-foreground">
                  Use the checkout phone, order total, and delivery area. We only show the order when all details match.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <Label htmlFor="recovery-phone">Checkout phone</Label>
                <Input
                  id="recovery-phone"
                  value={recoveryPhone}
                  onChange={(e) => setRecoveryPhone(e.target.value)}
                  placeholder="07XX XXX XXX"
                />
              </div>
              <div>
                <Label htmlFor="recovery-total">Order total</Label>
                <Input
                  id="recovery-total"
                  inputMode="decimal"
                  value={recoveryTotal}
                  onChange={(e) => setRecoveryTotal(e.target.value)}
                  placeholder="1350"
                />
              </div>
              <div>
                <Label htmlFor="recovery-location">Delivery area</Label>
                <Input
                  id="recovery-location"
                  value={recoveryLocation}
                  onChange={(e) => setRecoveryLocation(e.target.value)}
                  placeholder="Westlands"
                />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="mt-4 h-11 w-full bg-foreground text-background">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Find my order securely"}
            </Button>
          </form>

          <form
            onSubmit={recoveryStep === "identity" ? beginRecovery : lookupByRecovery}
            className="rounded-2xl border border-border bg-card/80 p-5 shadow-soft md:p-6"
          >
            <div className="mb-4 flex items-start gap-3">
              <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-accent/10 text-accent">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="font-display text-lg font-bold">I have my order number</p>
                <p className="text-sm text-muted-foreground">
                  Use the order number, last 3 phone digits, then one order detail. Wrong answers do not reveal order data.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="recovery-order">Order number</Label>
                <Input
                  id="recovery-order"
                  value={orderId}
                  onChange={(e) => {
                    setOrderId(e.target.value);
                    setRecoveryStep("identity");
                  }}
                  placeholder="ORD-XXXXXX"
                />
              </div>
              <div>
                <Label htmlFor="phone-last3">Last 3 phone digits</Label>
                <Input
                  id="phone-last3"
                  inputMode="numeric"
                  maxLength={3}
                  value={phoneLast3}
                  onChange={(e) => {
                    setPhoneLast3(e.target.value.replace(/\D/g, "").slice(0, 3));
                    setRecoveryStep("identity");
                  }}
                  placeholder="006"
                />
              </div>
            </div>

            {recoveryStep === "challenge" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 rounded-xl border border-border bg-secondary/35 p-4"
              >
                <p className="mb-3 text-sm font-semibold text-foreground">One more check</p>
                <div className="mb-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setVerificationType("total");
                      setVerificationAnswer("");
                    }}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-sm font-semibold transition-colors",
                      verificationType === "total"
                        ? "border-accent bg-accent text-accent-foreground"
                        : "border-border bg-background hover:border-accent/50"
                    )}
                  >
                    Order total
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVerificationType("location");
                      setVerificationAnswer("");
                    }}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-sm font-semibold transition-colors",
                      verificationType === "location"
                        ? "border-accent bg-accent text-accent-foreground"
                        : "border-border bg-background hover:border-accent/50"
                    )}
                  >
                    Delivery area
                  </button>
                </div>
                <Label htmlFor="verification-answer">
                  {verificationType === "total" ? "Approximate order total" : "Delivery town, estate, or route area"}
                </Label>
                <Input
                  id="verification-answer"
                  value={verificationAnswer}
                  onChange={(e) => setVerificationAnswer(e.target.value)}
                  placeholder={verificationType === "total" ? "Example: 1350" : "Example: Westlands"}
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  For totals, KES 1 difference is accepted for rounding. For area, use a place name from the delivery details.
                </p>
              </motion.div>
            )}

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Button type="submit" disabled={loading} className="h-11 flex-1 bg-foreground text-background">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : recoveryStep === "identity" ? "Continue securely" : "Show my order"}
              </Button>
              {recoveryStep === "challenge" && (
                <Button
                  type="button"
                  variant="outline"
                  className="h-11"
                  onClick={() => {
                    setRecoveryStep("identity");
                    setVerificationAnswer("");
                  }}
                >
                  Edit details
                </Button>
              )}
            </div>
          </form>

          <form
            onSubmit={lookup}
            className="rounded-2xl border border-border bg-card/70 p-5 shadow-soft md:p-6"
          >
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <KeyRound className="h-4 w-4" />
              Have the full phone number?
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <div>
                <Label htmlFor="order">Order number</Label>
                <Input id="order" value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="ORD-XXXXXX" />
              </div>
              <div>
                <Label htmlFor="phone">Phone number</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XX XXX XXX" />
              </div>
              <Button type="submit" disabled={loading} variant="outline" className="h-10 min-w-[110px]">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Track"}
              </Button>
            </div>
          </form>
        </motion.div>

        {validationError && (
          <p className="mt-3 text-sm text-destructive">{validationError}</p>
        )}

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
                <span className="text-sm">Locating your order...</span>
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
              {/* Order header */}
              <div className="flex items-baseline justify-between mb-6 flex-wrap gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Order</p>
                  <p className="font-display font-bold text-2xl">{order.order_number || order.id}</p>
                  {order.customer_phone_masked && (
                    <p className="mt-1 text-xs text-muted-foreground">Phone: {order.customer_phone_masked}</p>
                  )}
                </div>
                <motion.span
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 220, damping: 16, delay: 0.2 }}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm font-semibold",
                    isCancelled
                      ? "bg-destructive/10 text-destructive"
                      : resolvedKey === "completed"
                        ? "bg-success/10 text-success"
                        : "bg-accent/10 text-accent"
                  )}
                >
                  {currentStatus.label}
                </motion.span>
              </div>

              <div
                className={cn(
                  "mb-6 rounded-xl border p-4",
                  isCancelled
                    ? "border-destructive/20 bg-destructive/5"
                    : resolvedKey === "completed"
                      ? "border-success/20 bg-success/5"
                      : "border-border bg-secondary/30"
                )}
              >
                <h3 className="text-xs uppercase tracking-wider text-muted-foreground">What this means</h3>
                <p className={cn("text-sm mt-1", isCancelled && "text-destructive/90")}>{currentStatus.description}</p>
              </div>

              {/* Cancelled state */}
              {isCancelled && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-destructive/20 bg-destructive/5 p-5 flex gap-4 items-start"
                >
                  <XCircle className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-destructive mb-1">Cancelled - this order will not be fulfilled</p>
                    <p className="text-sm text-muted-foreground">
                      If you believe this is an error or need assistance, please{" "}
                      <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="text-accent underline">
                        contact us via WhatsApp
                      </a>
                      .
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Payment instructions for pending orders */}
              {isPending && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800/40 dark:bg-amber-900/10 p-5 mb-6"
                >
                  <div className="flex gap-3 items-start">
                    <CreditCard className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-amber-800 dark:text-amber-300 mb-1">Waiting for payment confirmation</p>
                      <p className="text-sm text-amber-700 dark:text-amber-400 mb-3">
                        Already paid? Do not worry. Your order will update once M-Pesa or admin reconciliation confirms the payment.
                      </p>
                      <div className="rounded-lg bg-white dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 p-3 text-sm space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Pay via</span>
                          <span className="font-semibold">M-Pesa Buy Goods</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Till Number</span>
                          <span className="font-bold text-lg text-foreground tracking-widest">{TILL_NUMBER}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Business Name</span>
                          <span className="font-semibold">XPOSE</span>
                        </div>
                        {orderTotal && orderTotal > 0 && (
                          <div className="flex justify-between border-t border-amber-200 dark:border-amber-800/40 pt-2 mt-1">
                            <span className="text-muted-foreground">Order Total</span>
                            <span className="font-bold">KES {orderTotal.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-amber-600 dark:text-amber-500 mt-2">
                        If you have not paid yet, use the Till number above and your order number as reference. Once confirmed, your order will move to {preparingOrderLabel}.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <a
                          href="tel:*150*00#"
                          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors"
                        >
                          <PhoneCall className="h-3.5 w-3.5" />
                          Need to pay? Open M-Pesa
                        </a>
                        <a
                          href={WHATSAPP_LINK}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg border border-border text-sm font-medium hover:bg-secondary transition-colors"
                        >
                          Need help?
                        </a>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Progress bar — only for non-cancelled orders */}
              {!isCancelled && (
                <>
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
                            <p className="text-sm text-muted-foreground">{s.description}</p>
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
                              Done
                            </span>
                          )}
                        </motion.li>
                      );
                    })}
                  </ul>
                </>
              )}

              {lastRefresh && !isCancelled && (
                <p className="text-xs text-muted-foreground mt-6 text-right">
                  Last updated: {lastRefresh.toLocaleTimeString()} - Auto-refreshes every 30s
                </p>
              )}
            </motion.div>
          )}

          {!loading && !order && searched && (
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
                <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="text-accent underline">
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
