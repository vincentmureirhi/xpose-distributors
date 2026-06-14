import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Loader2, MapPin, ShieldCheck, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { listLocations, listRegions, type LocationOption, type RegionOption } from "@/lib/api/geography";
import { submitRouteCustomerApplication } from "@/lib/api/route-customer-applications";
import { formatPrice } from "@/context/CartContext";
import { toast } from "sonner";

const KENYAN_PHONE_REGEX = /^(0|\+254|254)[17]\d{8}$/;

export default function RouteDeliveryApply() {
  const [regions, setRegions] = useState<RegionOption[]>([]);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [loadingRegions, setLoadingRegions] = useState(true);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedRef, setSubmittedRef] = useState("");
  const [form, setForm] = useState({
    applicant_name: "",
    business_name: "",
    email: "",
    phone: "",
    address: "",
    region_id: "",
    location_id: "",
    requested_credit_limit: "",
  });

  useEffect(() => {
    document.title = "Route Delivery Application - XPOSE";
    let active = true;
    setLoadingRegions(true);

    listRegions()
      .then((rows) => {
        if (!active) return;
        setRegions(rows);
      })
      .catch(() => {
        if (!active) return;
        toast.error("Could not load service regions");
      })
      .finally(() => {
        if (!active) return;
        setLoadingRegions(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!form.region_id) {
      setLocations([]);
      setForm((current) => ({ ...current, location_id: "" }));
      return;
    }

    let active = true;
    setLoadingLocations(true);

    listLocations({ region_id: form.region_id })
      .then((rows) => {
        if (!active) return;
        setLocations(rows);
        setForm((current) => ({
          ...current,
          location_id: rows.some((location) => location.id === current.location_id) ? current.location_id : "",
        }));
      })
      .catch(() => {
        if (!active) return;
        toast.error("Could not load locations for this region");
      })
      .finally(() => {
        if (!active) return;
        setLoadingLocations(false);
      });

    return () => {
      active = false;
    };
  }, [form.region_id]);

  const selectedRegion = useMemo(
    () => regions.find((region) => region.id === form.region_id),
    [form.region_id, regions]
  );
  const selectedLocation = useMemo(
    () => locations.find((location) => location.id === form.location_id),
    [form.location_id, locations]
  );

  function updateField(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;

    const applicantName = form.applicant_name.trim();
    const businessName = form.business_name.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();
    const address = form.address.trim();
    const requestedCreditLimit = form.requested_credit_limit ? Number(form.requested_credit_limit) : 0;

    if (!applicantName || !email || !phone) {
      toast.error("Name, email, and phone are required");
      return;
    }

    if (!KENYAN_PHONE_REGEX.test(phone)) {
      toast.error("Enter a valid Kenyan phone number");
      return;
    }

    if (!form.region_id || !form.location_id) {
      toast.error("Choose your route region and location");
      return;
    }

    if (!Number.isFinite(requestedCreditLimit) || requestedCreditLimit < 0) {
      toast.error("Requested credit limit must be a valid amount");
      return;
    }

    try {
      setSubmitting(true);
      const response = await submitRouteCustomerApplication({
        applicant_name: applicantName,
        business_name: businessName || undefined,
        email,
        phone,
        address: address || undefined,
        region_id: form.region_id,
        location_id: form.location_id,
        requested_credit_limit: requestedCreditLimit,
        submitted_via: "manual",
        form_reference: `Storefront route delivery application - ${selectedRegion?.name || "Region"} / ${selectedLocation?.name || "Location"}`,
      });

      const applicationId = response?.application?.id;
      setSubmittedRef(applicationId ? `Application #${applicationId}` : "Application received");
      toast.success("Application received", {
        description: "Check your email for the company response after review and approval.",
      });
      setForm({
        applicant_name: "",
        business_name: "",
        email: "",
        phone: "",
        address: "",
        region_id: "",
        location_id: "",
        requested_credit_limit: "",
      });
    } catch (error) {
      const err = error as { response?: { data?: { message?: string; error?: string } }; message?: string };
      toast.error("Could not submit application", {
        description: err.response?.data?.message || err.response?.data?.error || err.message || "Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-background">
      <section className="border-b border-border bg-[#070b10] text-white">
        <div className="container grid gap-10 py-12 md:grid-cols-[minmax(0,1fr)_420px] md:py-16">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white/80">
              <Truck className="h-4 w-4 text-accent" />
              Route delivery
            </div>
            <h1 className="max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
              Apply for scheduled shop delivery and credit access.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/70 sm:text-lg">
              For businesses inside our served regions, XPOSE reps can capture orders on route and dispatch goods for settlement on delivery.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {[
                ["Served areas only", "Choose from live company regions."],
                ["Credit review", "Admin approves the final limit."],
                ["Route orders", "Reps capture orders at your shop."],
              ].map(([title, text]) => (
                <div key={title} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="font-bold">{title}</p>
                  <p className="mt-1 text-sm text-white/60">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-accent-foreground">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold">Approval path</p>
                <p className="text-sm text-white/60">Application, review, credit decision, then route service.</p>
              </div>
            </div>
            <div className="mt-6 space-y-3 text-sm text-white/70">
              <p>1. Submit your business and location details.</p>
              <p>2. Admin reviews the region, location, and requested limit.</p>
              <p>3. Once approved, you receive portal access and a sales rep can serve your route orders.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-10 md:py-14">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-7">
            <div className="mb-6">
              <h2 className="text-2xl font-black tracking-tight">Route customer application</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Applications are accepted only for regions and locations currently listed by XPOSE.
              </p>
            </div>

            {submittedRef && (
              <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0" />
                <div>
                  <p className="font-bold">{submittedRef}</p>
                  <p>Check your email for our response after review. If approved, admin will issue portal access and route service details.</p>
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="applicant-name">Applicant name</Label>
                <Input id="applicant-name" value={form.applicant_name} onChange={(e) => updateField("applicant_name", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="business-name">Business name</Label>
                <Input id="business-name" value={form.business_name} onChange={(e) => updateField("business_name", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="route-email">Email</Label>
                <Input id="route-email" type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="route-phone">Phone</Label>
                <Input id="route-phone" type="tel" placeholder="07XX XXX XXX" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="route-region">Region</Label>
                <select
                  id="route-region"
                  value={form.region_id}
                  onChange={(e) => updateField("region_id", e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">{loadingRegions ? "Loading regions..." : "Select served region"}</option>
                  {regions.map((region) => (
                    <option key={region.id} value={region.id}>
                      {region.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="route-location">Location</Label>
                <select
                  id="route-location"
                  value={form.location_id}
                  onChange={(e) => updateField("location_id", e.target.value)}
                  disabled={!form.region_id || loadingLocations}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
                >
                  <option value="">
                    {!form.region_id ? "Select region first" : loadingLocations ? "Loading locations..." : "Select location"}
                  </option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="route-address">Shop address or landmark</Label>
                <Textarea id="route-address" rows={3} value={form.address} onChange={(e) => updateField("address", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="credit-limit">Requested credit limit</Label>
                <Input
                  id="credit-limit"
                  type="number"
                  min="0"
                  value={form.requested_credit_limit}
                  onChange={(e) => updateField("requested_credit_limit", e.target.value)}
                  placeholder="Example: 5000"
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" disabled={submitting} className="h-11 w-full">
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit application"
                  )}
                </Button>
              </div>
            </div>
          </form>

          <aside className="rounded-2xl border border-border bg-secondary/40 p-5">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
              <MapPin className="h-4 w-4 text-accent" />
              Served regions
            </div>
            <div className="mt-4 space-y-3">
              {regions.length === 0 && !loadingRegions ? (
                <p className="text-sm text-muted-foreground">No route regions are currently listed.</p>
              ) : (
                regions.slice(0, 12).map((region) => (
                  <div key={region.id} className="rounded-xl border border-border bg-background p-3">
                    <p className="font-bold">{region.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {Number(region.location_count || 0) > 0
                        ? `${region.location_count} listed location${Number(region.location_count) === 1 ? "" : "s"}`
                        : "Locations listed by admin"}
                    </p>
                  </div>
                ))
              )}
            </div>
            <div className="mt-5 rounded-xl border border-border bg-background p-4 text-sm text-muted-foreground">
              Already approved? Use the route customer portal link issued by admin. For normal shopping, continue to{" "}
              <Link to="/products" className="font-bold text-foreground underline">
                the shop
              </Link>.
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
