import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BadgeCheck, CheckCircle2, Loader2, PackageSearch, ShieldCheck, Store, WalletCards } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatPrice } from "@/context/CartContext";
import { listPublicVendorPlans, submitVendorApplication, type VendorPlan } from "@/lib/api/vendors";

const KENYAN_PHONE_REGEX = /^(0|\+254|254)[17]\d{8}$/;

const emptyForm = {
  store_name: "",
  legal_name: "",
  contact_person: "",
  phone: "",
  email: "",
  business_type: "",
  business_registration_no: "",
  kra_pin: "",
  national_id: "",
  address: "",
  product_categories: "",
  estimated_skus: "",
  expected_monthly_sales: "",
  sample_price_min: "",
  sample_price_max: "",
  pricing_notes: "",
  preferred_plan_id: "",
  fulfillment_preference: "xpose_reviewed",
};

type VendorForm = typeof emptyForm;

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseOptionalNumber(value: string) {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function splitCategories(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 25);
}

function PlanCard({
  plan,
  selected,
  onSelect,
}: {
  plan: VendorPlan;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group rounded-2xl border p-5 text-left transition-all ${
        selected
          ? "border-accent bg-accent/10 shadow-soft"
          : "border-border bg-card hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-soft"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-wider text-accent">{plan.name}</p>
          <p className="mt-2 text-3xl font-black">{formatPrice(toNumber(plan.monthly_fee))}</p>
          <p className="mt-1 text-sm text-muted-foreground">monthly listing fee</p>
        </div>
        <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-bold">
          {toNumber(plan.commission_rate).toFixed(1)}% commission
        </span>
      </div>
      <p className="mt-4 min-h-[44px] text-sm leading-6 text-muted-foreground">
        {plan.description || "XPOSE reviews store quality, product fit, and pricing before approval."}
      </p>
      <div className="mt-5 grid gap-2 text-sm">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-accent" />
          Up to {toNumber(plan.max_products).toLocaleString()} products
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-accent" />
          Price review {plan.price_review_required ? "required" : "optional"}
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-accent" />
          Minimum margin {toNumber(plan.minimum_margin_percent).toFixed(1)}%
        </div>
      </div>
    </button>
  );
}

export default function VendorApply() {
  const [plans, setPlans] = useState<VendorPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittedRef, setSubmittedRef] = useState("");
  const [form, setForm] = useState<VendorForm>(emptyForm);

  useEffect(() => {
    document.title = "Sell on XPOSE - Vendor Marketplace";
    let active = true;
    setLoadingPlans(true);

    listPublicVendorPlans()
      .then((rows) => {
        if (!active) return;
        setPlans(rows);
        setForm((current) => ({
          ...current,
          preferred_plan_id: current.preferred_plan_id || (rows[0]?.id ? String(rows[0].id) : ""),
        }));
      })
      .catch(() => {
        if (!active) return;
        toast.error("Could not load vendor plans");
      })
      .finally(() => {
        if (!active) return;
        setLoadingPlans(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const selectedPlan = useMemo(
    () => plans.find((plan) => String(plan.id) === String(form.preferred_plan_id)),
    [form.preferred_plan_id, plans]
  );

  function updateField(key: keyof VendorForm, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;

    const storeName = form.store_name.trim();
    const contactPerson = form.contact_person.trim();
    const phone = form.phone.trim();
    const email = form.email.trim();
    const categories = splitCategories(form.product_categories);

    if (!storeName || !contactPerson || !phone || !email) {
      toast.error("Store name, contact person, phone, and email are required");
      return;
    }

    if (!KENYAN_PHONE_REGEX.test(phone)) {
      toast.error("Enter a valid Kenyan phone number");
      return;
    }

    if (categories.length === 0) {
      toast.error("List at least one product category");
      return;
    }

    const sampleMin = parseOptionalNumber(form.sample_price_min);
    const sampleMax = parseOptionalNumber(form.sample_price_max);
    if (sampleMin !== undefined && sampleMax !== undefined && sampleMax < sampleMin) {
      toast.error("Maximum sample price cannot be lower than minimum sample price");
      return;
    }

    try {
      setSubmitting(true);
      const result = await submitVendorApplication({
        store_name: storeName,
        legal_name: form.legal_name.trim() || undefined,
        contact_person: contactPerson,
        phone,
        email,
        business_type: form.business_type.trim() || undefined,
        business_registration_no: form.business_registration_no.trim() || undefined,
        kra_pin: form.kra_pin.trim() || undefined,
        national_id: form.national_id.trim() || undefined,
        address: form.address.trim() || undefined,
        product_categories: categories,
        estimated_skus: parseOptionalNumber(form.estimated_skus),
        expected_monthly_sales: parseOptionalNumber(form.expected_monthly_sales),
        sample_price_min: sampleMin,
        sample_price_max: sampleMax,
        pricing_notes: form.pricing_notes.trim() || undefined,
        preferred_plan_id: parseOptionalNumber(form.preferred_plan_id),
        fulfillment_preference: form.fulfillment_preference as "xpose_reviewed",
      });

      const ref = result.application?.application_number || "Application received";
      setSubmittedRef(ref);
      toast.success("Vendor application received", {
        description: "XPOSE will review your store, pricing, product fit, and verification details.",
      });
      setForm({ ...emptyForm, preferred_plan_id: plans[0]?.id ? String(plans[0].id) : "" });
    } catch (error) {
      const err = error as { response?: { data?: { message?: string; error?: string } }; message?: string };
      toast.error("Could not submit vendor application", {
        description: err.response?.data?.message || err.response?.data?.error || err.message || "Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-background">
      <section className="relative overflow-hidden border-b border-border bg-[#070b10] text-white">
        <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_50%_30%,rgba(255,79,31,0.22),transparent_35%),linear-gradient(135deg,rgba(255,255,255,0.10),transparent_55%)] lg:block" />
        <div className="container relative grid gap-10 py-12 md:py-16 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white/80">
              <Store className="h-4 w-4 text-accent" />
              XPOSE Marketplace
            </div>
            <h1 className="max-w-3xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              Put your products in front of XPOSE buyers.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/70 sm:text-lg">
              Apply to run a verified vendor store under XPOSE. We review your product fit, pricing, and fulfillment model before anything goes live.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {[
                [BadgeCheck, "Verified store", "Approval before listing."],
                [PackageSearch, "Price review", "Your prices are checked before launch."],
                [WalletCards, "Monthly plan", "Clear fee and commission terms."],
              ].map(([Icon, title, text]) => {
                const RealIcon = Icon as typeof Store;
                return (
                  <div key={String(title)} className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <RealIcon className="mb-3 h-5 w-5 text-accent" />
                    <p className="font-bold">{title as string}</p>
                    <p className="mt-1 text-sm text-white/60">{text as string}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-accent-foreground">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold">Controlled launch</p>
                <p className="text-sm text-white/60">Application, verification, plan setup, then product approval.</p>
              </div>
            </div>
            <div className="mt-6 space-y-3 text-sm text-white/70">
              <p>1. Submit store and product category details.</p>
              <p>2. XPOSE reviews commercial terms and product pricing.</p>
              <p>3. Approved vendors receive marketplace access after verification.</p>
            </div>
            <Button className="mt-7 w-full" asChild>
              <a href="#vendor-application">
                Start application <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      <section className="container py-10 md:py-14">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-wider text-accent">Commercial plans</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight">Choose a starting package</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-muted-foreground">
            The final fee, commission, and product limit are confirmed by XPOSE during approval.
          </p>
        </div>

        {loadingPlans ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-muted-foreground">Loading vendor plans...</div>
        ) : plans.length ? (
          <div className="grid gap-4 md:grid-cols-3">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                selected={String(plan.id) === String(form.preferred_plan_id)}
                onSelect={() => updateField("preferred_plan_id", String(plan.id))}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-8 text-muted-foreground">
            Vendor plans are being prepared. You can still submit the form and XPOSE will review manually.
          </div>
        )}
      </section>

      <section id="vendor-application" className="container pb-14">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-7">
            <div className="mb-6">
              <h2 className="text-2xl font-black tracking-tight">Vendor application</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Give us enough detail to review your store, pricing, and product fit.
              </p>
            </div>

            {submittedRef && (
              <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0" />
                <div>
                  <p className="font-bold">{submittedRef}</p>
                  <p>XPOSE will review your application. If approved, admin will issue vendor access and commercial terms.</p>
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="store-name">Store name</Label>
                <Input id="store-name" value={form.store_name} onChange={(e) => updateField("store_name", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="legal-name">Legal/business name</Label>
                <Input id="legal-name" value={form.legal_name} onChange={(e) => updateField("legal_name", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contact-person">Contact person</Label>
                <Input id="contact-person" value={form.contact_person} onChange={(e) => updateField("contact_person", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vendor-phone">Phone</Label>
                <Input id="vendor-phone" type="tel" placeholder="07XX XXX XXX" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vendor-email">Email</Label>
                <Input id="vendor-email" type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="business-type">Business type</Label>
                <Input id="business-type" placeholder="Manufacturer, importer, distributor..." value={form.business_type} onChange={(e) => updateField("business_type", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="registration-no">Registration number</Label>
                <Input id="registration-no" value={form.business_registration_no} onChange={(e) => updateField("business_registration_no", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="kra-pin">KRA PIN</Label>
                <Input id="kra-pin" value={form.kra_pin} onChange={(e) => updateField("kra_pin", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="national-id">National ID</Label>
                <Input id="national-id" value={form.national_id} onChange={(e) => updateField("national_id", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="estimated-skus">Estimated SKUs</Label>
                <Input id="estimated-skus" type="number" min="0" value={form.estimated_skus} onChange={(e) => updateField("estimated_skus", e.target.value)} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="address">Business address</Label>
                <Input id="address" value={form.address} onChange={(e) => updateField("address", e.target.value)} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="categories">Product categories</Label>
                <Input id="categories" placeholder="Sanitary, snacks, household, cosmetics..." value={form.product_categories} onChange={(e) => updateField("product_categories", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="expected-sales">Expected monthly sales</Label>
                <Input id="expected-sales" type="number" min="0" value={form.expected_monthly_sales} onChange={(e) => updateField("expected_monthly_sales", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fulfillment">Fulfillment preference</Label>
                <select
                  id="fulfillment"
                  value={form.fulfillment_preference}
                  onChange={(e) => updateField("fulfillment_preference", e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="xpose_reviewed">XPOSE reviewed</option>
                  <option value="xpose_fulfilled">XPOSE fulfilled</option>
                  <option value="vendor_fulfilled">Vendor fulfilled</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="price-min">Lowest sample price</Label>
                <Input id="price-min" type="number" min="0" value={form.sample_price_min} onChange={(e) => updateField("sample_price_min", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="price-max">Highest sample price</Label>
                <Input id="price-max" type="number" min="0" value={form.sample_price_max} onChange={(e) => updateField("sample_price_max", e.target.value)} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="pricing-notes">Pricing notes</Label>
                <Textarea
                  id="pricing-notes"
                  rows={4}
                  placeholder="Tell us how you price cartons, pieces, wholesale packs, or recommended retail prices."
                  value={form.pricing_notes}
                  onChange={(e) => updateField("pricing_notes", e.target.value)}
                />
              </div>
            </div>

            <Button type="submit" size="lg" className="mt-6 w-full sm:w-auto" disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Submit vendor application
            </Button>
          </form>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <p className="font-black">Pricing review</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Vendor prices do not go live automatically. XPOSE reviews margin, market fit, quantity rules, and fulfillment cost first.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <p className="font-black">Product approval</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                After approval, vendors submit products for review before customers can order them.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-[#070b10] p-5 text-white shadow-soft">
              <p className="font-black">Already in touch?</p>
              <p className="mt-2 text-sm leading-6 text-white/65">
                You can also contact XPOSE directly for onboarding and verification documents.
              </p>
              <Button className="mt-4 w-full" variant="secondary" asChild>
                <Link to="/terms">Review terms</Link>
              </Button>
            </div>
            {selectedPlan && (
              <div className="rounded-2xl border border-accent/30 bg-accent/10 p-5 shadow-soft">
                <p className="text-sm font-black uppercase tracking-wider text-accent">Selected plan</p>
                <p className="mt-2 text-xl font-black">{selectedPlan.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatPrice(toNumber(selectedPlan.monthly_fee))} monthly, {toNumber(selectedPlan.commission_rate).toFixed(1)}% commission.
                </p>
              </div>
            )}
          </aside>
        </div>
      </section>
    </div>
  );
}
