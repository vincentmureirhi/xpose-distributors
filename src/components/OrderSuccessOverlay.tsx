import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Copy, CreditCard, Link2, Loader2, Package, ShieldCheck, Truck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { getMpesaPaymentStatus, initiateMpesaStk } from "@/lib/api/mpesa";

const TILL_NUMBER = import.meta.env.VITE_MPESA_REAL_TILL_NUMBER || "3398071";
const POLL_MS = 2000;
const MAX_POLLS = 30;
const REDIRECT_SECONDS = 12;

interface Props {
  show: boolean;
  orderId: string;
  trackingUrl?: string;
  amountDue?: number;
  paymentMode?: "mpesa" | "route_credit";
  onDone?: () => void;
}

function formatMoney(value?: number) {
  return Number(value || 0).toLocaleString("en-KE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function toLocalTrackingPath(trackingUrl?: string, fallbackId?: string) {
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

export default function OrderSuccessOverlay({ show, orderId, trackingUrl, amountDue = 0, paymentMode = "mpesa", onDone }: Props) {
  const [countdown, setCountdown] = useState(REDIRECT_SECONDS);
  const [copied, setCopied] = useState(false);
  const [paymentState, setPaymentState] = useState<"idle" | "starting" | "pending" | "paid" | "failed">("idle");
  const [paymentMessage, setPaymentMessage] = useState("");
  const [receipt, setReceipt] = useState("");
  const [checkoutRequestId, setCheckoutRequestId] = useState("");
  const pollCount = useRef(0);
  const paymentAttempt = useRef(0);
  const isRouteCredit = paymentMode === "route_credit";
  const trackingPath = toLocalTrackingPath(trackingUrl, orderId);
  const hasPrivateTrackingLink = trackingPath.includes("?t=") || trackingPath.includes("&t=");
  const trackingLabel = typeof window !== "undefined" && trackingPath.startsWith("/")
    ? `${window.location.origin}${trackingPath}`
    : trackingPath;

  const copyTrackingLink = async () => {
    try {
      await navigator.clipboard.writeText(trackingLabel);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  const startPayment = async () => {
    if (!orderId || !amountDue || isRouteCredit) return;
    const attempt = ++paymentAttempt.current;
    setPaymentState("starting");
    setPaymentMessage("Contacting M-Pesa…");
    setReceipt("");
    pollCount.current = 0;

    try {
      const result = await initiateMpesaStk({ orderId, amount: amountDue });
      if (attempt !== paymentAttempt.current) return;
      if (!result.checkout_request_id) throw new Error(result.message || "M-Pesa did not return a checkout request");

      setCheckoutRequestId(result.checkout_request_id);
      setPaymentState("pending");
      setPaymentMessage(result.message || "Check your phone and enter your M-Pesa PIN.");
    } catch (error) {
      if (attempt !== paymentAttempt.current) return;
      const err = error as { response?: { data?: { message?: string; errorMessage?: string } }; message?: string };
      setPaymentState("failed");
      setPaymentMessage(err.response?.data?.message || err.response?.data?.errorMessage || err.message || "M-Pesa STK Push could not be started.");
    }
  };

  useEffect(() => {
    if (!show || isRouteCredit) return;
    setPaymentState("idle");
    setCheckoutRequestId("");
    setPaymentMessage("");
    setReceipt("");
    void startPayment();
    return () => {
      paymentAttempt.current += 1;
    };
  }, [show, isRouteCredit, orderId, amountDue]);

  useEffect(() => {
    if (!show || isRouteCredit || paymentState !== "pending" || !checkoutRequestId) return;
    let active = true;
    const timer = window.setInterval(async () => {
      if (!active) return;
      pollCount.current += 1;
      try {
        const status = await getMpesaPaymentStatus(checkoutRequestId);
        if (!active) return;
        const normalized = String(status.status || "").toLowerCase();
        if (normalized === "completed") {
          active = false;
          setReceipt(status.mpesa_receipt || "");
          setPaymentState("paid");
          setPaymentMessage("Payment confirmed. Your order is now being processed.");
          toast.success("M-Pesa payment confirmed");
          window.clearInterval(timer);
          return;
        }
        if (["failed", "cancelled", "timeout", "reversed"].includes(normalized)) {
          active = false;
          setPaymentState("failed");
          setPaymentMessage(status.result_desc || "The M-Pesa payment was not completed.");
          window.clearInterval(timer);
          return;
        }
        if (pollCount.current >= MAX_POLLS) {
          active = false;
          setPaymentState("failed");
          setPaymentMessage("We could not confirm the payment yet. You can retry the STK Push or use manual payment details below.");
          window.clearInterval(timer);
        }
      } catch {
        if (pollCount.current >= MAX_POLLS) {
          active = false;
          setPaymentState("failed");
          setPaymentMessage("Payment confirmation timed out. Retry the STK Push or use the manual payment option.");
          window.clearInterval(timer);
        }
      }
    }, POLL_MS);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [show, isRouteCredit, paymentState, checkoutRequestId]);

  useEffect(() => {
    if (!show || !isRouteCredit) return;
    setCountdown(REDIRECT_SECONDS);
    const timer = window.setInterval(() => setCountdown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [show, isRouteCredit]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-background/90 px-4 py-6 backdrop-blur-xl"
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            className="relative z-10 flex w-full max-w-lg flex-col items-center rounded-2xl border border-border bg-card/95 px-4 py-6 text-center shadow-elevated sm:px-7 sm:py-7"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-success/10 text-success"><CheckCircle2 className="h-7 w-7" /></div>
              <div className="text-left">
                <h2 className="font-display text-2xl font-bold tracking-tight">{isRouteCredit ? "Route Order Captured" : "Order Placed Successfully!"}</h2>
                <p className="text-xs text-muted-foreground">Order {orderId}</p>
              </div>
            </div>

            <div className="mb-4 w-full rounded-xl border border-border bg-secondary/40 p-3 text-left">
              <div className="flex items-center gap-2"><Package className="h-4 w-4 text-accent" /><span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Order reference</span></div>
              <div className="mt-1 flex items-center gap-2">
                <span className="min-w-0 flex-1 break-all font-display text-lg font-black">{orderId || "—"}</span>
                <button type="button" onClick={() => navigator.clipboard.writeText(orderId).then(() => setCopied(true)).catch(() => {})} className="inline-flex h-8 items-center gap-1 rounded-md bg-background px-2 text-xs font-bold">
                  <Copy className="h-3.5 w-3.5" /> {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            <div className="mb-4 w-full rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-left dark:border-emerald-800/40 dark:bg-emerald-900/10">
              <div className="mb-2 flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-600" /><p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">{hasPrivateTrackingLink ? "Private tracking link ready" : "Tracking access ready"}</p></div>
              <p className="mb-3 text-xs leading-relaxed text-muted-foreground">Keep this link private. It lets you check the order without entering your phone again.</p>
              <div className="flex min-w-0 items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
                <Link2 className="h-4 w-4 flex-shrink-0 text-accent" />
                <span className="min-w-0 flex-1 truncate text-xs font-semibold">{trackingLabel}</span>
                <button type="button" onClick={copyTrackingLink} className="inline-flex h-8 items-center gap-1 rounded-md bg-secondary px-2 text-xs font-bold"><Copy className="h-3.5 w-3.5" />{copied ? "Copied" : "Copy"}</button>
              </div>
            </div>

            {isRouteCredit ? (
              <div className="mb-4 w-full rounded-xl border border-success/25 bg-success/5 p-4 text-left">
                <div className="mb-2 flex items-center gap-2"><CreditCard className="h-4 w-4 text-success" /><p className="text-sm font-semibold">Route credit order</p></div>
                <p className="text-sm text-muted-foreground">The route customer order has been captured and sent to XPOSE for fulfilment.</p>
              </div>
            ) : (
              <div className="mb-4 w-full rounded-2xl border border-border bg-card p-4 text-left">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground"><CreditCard className="h-5 w-5" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black">M-Pesa payment</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Pay <strong>KES {formatMoney(amountDue)}</strong>. We send an STK prompt to the phone number on your order.</p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-border bg-secondary/30 p-4">
                  {paymentState === "starting" && (
                    <div className="flex items-center gap-3 text-sm"><Loader2 className="h-5 w-5 animate-spin text-accent" /><div><p className="font-bold">Starting M-Pesa prompt…</p><p className="text-xs text-muted-foreground">Do not close this window.</p></div></div>
                  )}
                  {paymentState === "pending" && (
                    <div className="flex items-start gap-3"><Loader2 className="mt-0.5 h-5 w-5 animate-spin text-accent" /><div><p className="font-bold">Check your phone</p><p className="mt-1 text-xs text-muted-foreground">{paymentMessage || "Enter your M-Pesa PIN to approve the payment."}</p></div></div>
                  )}
                  {paymentState === "paid" && (
                    <div className="flex items-start gap-3 text-success"><CheckCircle2 className="mt-0.5 h-5 w-5" /><div><p className="font-bold">Payment confirmed</p><p className="mt-1 text-xs">{paymentMessage}{receipt ? ` Receipt: ${receipt}` : ""}</p></div></div>
                  )}
                  {paymentState === "failed" && (
                    <div><div className="flex items-start gap-3 text-destructive"><XCircle className="mt-0.5 h-5 w-5" /><div><p className="font-bold">M-Pesa not confirmed</p><p className="mt-1 text-xs text-muted-foreground">{paymentMessage}</p></div></div><button type="button" onClick={startPayment} className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground">Retry STK Push</button></div>
                  )}
                  {paymentState === "idle" && <p className="text-xs text-muted-foreground">Preparing secure payment…</p>}
                </div>

                {paymentState !== "paid" && (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-800/40 dark:bg-amber-950/20">
                    <p className="text-xs font-bold">Manual fallback</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">If STK is unavailable, pay <strong>KES {formatMoney(amountDue)}</strong> to Buy Goods Till <strong>{TILL_NUMBER}</strong> and use <strong>{orderId}</strong> as your reference.</p>
                  </div>
                )}
              </div>
            )}

            <div className="flex w-full flex-col gap-2">
              <Link to={trackingPath} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-accent px-8 text-sm font-semibold text-accent-foreground"><Truck className="h-4 w-4" />{isRouteCredit ? "Open Route Order" : "Check Order Status"}</Link>
              {!isRouteCredit && <Link to="/products" className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-border bg-background text-sm font-semibold">Continue Shopping</Link>}
              {isRouteCredit && <p className="text-xs text-muted-foreground">Redirecting in {countdown}s…</p>}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
