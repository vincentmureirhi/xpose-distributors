import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BadgeCheck,
  BarChart3,
  Box,
  CheckCircle2,
  Clock3,
  Eye,
  Loader2,
  LockKeyhole,
  LogOut,
  MessageSquare,
  PackagePlus,
  Store,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatPrice } from "@/context/CartContext";
import { useVendorSession } from "@/context/VendorSessionContext";
import { listCategories } from "@/lib/api/categories";
import {
  changeVendorPassword,
  createVendorProduct,
  fetchVendorAnalytics,
  listMyVendorProducts,
  listMyVendorMessages,
  updateVendorProfile,
  updateVendorMessageStatus,
  type VendorAnalytics,
  type VendorMessage,
  type VendorProductSubmission,
} from "@/lib/api/vendor-portal";
import type { Category } from "@/types/shop";

const emptyProductForm = {
  product_name: "",
  sku: "",
  brand_name: "",
  category_id: "",
  description: "",
  image_url: "",
  proposed_retail_price: "",
  proposed_wholesale_price: "",
  proposed_cost_price: "",
  min_order_qty: "1",
  order_qty_step: "1",
  current_stock: "0",
  selling_unit_label: "piece",
  product_tags: "",
  vendor_notes: "",
  submit: true,
};

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function statusTone(status: string) {
  switch (status) {
    case "approved":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "submitted":
      return "border-blue-200 bg-blue-50 text-blue-800";
    case "changes_requested":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "rejected":
      return "border-red-200 bg-red-50 text-red-800";
    default:
      return "border-border bg-secondary text-muted-foreground";
  }
}

function StatusIcon({ status }: { status: string }) {
  if (status === "approved") return <CheckCircle2 className="h-4 w-4" />;
  if (status === "rejected") return <XCircle className="h-4 w-4" />;
  return <Clock3 className="h-4 w-4" />;
}

export default function VendorDashboard() {
  const navigate = useNavigate();
  const {
    status,
    isVendorAuthenticated,
    vendor,
    vendorUser,
    workspace,
    logout,
    refreshWorkspace,
    applyWorkspace,
    getErrorMessage,
  } = useVendorSession();

  const [categories, setCategories] = useState<Category[]>([]);
  const [submissions, setSubmissions] = useState<VendorProductSubmission[]>([]);
  const [analytics, setAnalytics] = useState<VendorAnalytics | null>(null);
  const [messages, setMessages] = useState<VendorMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [profileForm, setProfileForm] = useState({
    public_description: "",
    support_phone: "",
    support_email: "",
    website_url: "",
    logo_url: "",
    banner_url: "",
    store_visibility_status: "hidden",
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [productForm, setProductForm] = useState(emptyProductForm);

  useEffect(() => {
    document.title = "Vendor Dashboard - XPOSE";
  }, []);

  useEffect(() => {
    if (status === "restoring") return;
    if (!isVendorAuthenticated) navigate("/vendor/login", { replace: true });
  }, [isVendorAuthenticated, navigate, status]);

  useEffect(() => {
    if (!vendor) return;
    setProfileForm({
      public_description: vendor.public_description || "",
      support_phone: vendor.support_phone || "",
      support_email: vendor.support_email || "",
      website_url: vendor.website_url || "",
      logo_url: vendor.logo_url || "",
      banner_url: vendor.banner_url || "",
      store_visibility_status: vendor.store_visibility_status === "public" ? "public" : "hidden",
    });
  }, [vendor]);

  useEffect(() => {
    if (!isVendorAuthenticated) return;
    let active = true;
    setLoading(true);

    Promise.all([listCategories(), listMyVendorProducts(), fetchVendorAnalytics(30), listMyVendorMessages()])
      .then(([categoryRows, submissionRows, analyticsData, messageRows]) => {
        if (!active) return;
        setCategories(Array.isArray(categoryRows) ? categoryRows : []);
        setSubmissions(Array.isArray(submissionRows) ? submissionRows : []);
        setAnalytics(analyticsData || null);
        setMessages(Array.isArray(messageRows) ? messageRows : []);
      })
      .catch((error) => {
        if (!active) return;
        toast.error("Could not load vendor workspace", {
          description: getErrorMessage(error, "Please refresh and try again."),
        });
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [getErrorMessage, isVendorAuthenticated]);

  const stats = useMemo(() => {
    const rows = submissions || [];
    return {
      drafts: rows.filter((item) => item.submission_status === "draft").length,
      submitted: rows.filter((item) => item.submission_status === "submitted").length,
      approved: rows.filter((item) => item.submission_status === "approved").length,
      changes: rows.filter((item) => item.submission_status === "changes_requested").length,
    };
  }, [submissions]);

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    setSavingProfile(true);
    try {
      const updatedVendor = await updateVendorProfile(profileForm);
      if (workspace) {
        applyWorkspace({ ...workspace, vendor: updatedVendor });
      }
      toast.success("Store profile updated");
    } catch (error) {
      toast.error("Profile update failed", {
        description: getErrorMessage(error, "Please check the profile details."),
      });
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePassword(event: FormEvent) {
    event.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error("Passwords do not match");
      return;
    }

    setSavingPassword(true);
    try {
      await changeVendorPassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
      await refreshWorkspace();
      toast.success("Password updated");
    } catch (error) {
      toast.error("Password update failed", {
        description: getErrorMessage(error, "Please check your current password."),
      });
    } finally {
      setSavingPassword(false);
    }
  }

  async function saveProduct(event: FormEvent) {
    event.preventDefault();
    setSavingProduct(true);
    try {
      const created = await createVendorProduct({
        ...productForm,
        category_id: productForm.category_id,
        product_tags: productForm.product_tags,
        submit: productForm.submit,
      });
      setSubmissions((rows) => [created, ...rows]);
      setProductForm(emptyProductForm);
      await refreshWorkspace();
      toast.success(productForm.submit ? "Product submitted for review" : "Product draft saved");
    } catch (error) {
      toast.error("Product submission failed", {
        description: getErrorMessage(error, "Please check product details and pricing."),
      });
    } finally {
      setSavingProduct(false);
    }
  }

  async function markMessage(message: VendorMessage, nextStatus: "read" | "closed") {
    try {
      const updated = await updateVendorMessageStatus(message.id, { status: nextStatus });
      setMessages((rows) => rows.map((row) => (row.id === updated.id ? updated : row)));
      setAnalytics((current) => {
        if (!current) return current;
        const wasNew = message.status === "new";
        const isNew = updated.status === "new";
        return {
          ...current,
          messages: {
            ...current.messages,
            new_messages: Math.max(0, current.messages.new_messages + (isNew ? 1 : 0) - (wasNew ? 1 : 0)),
          },
        };
      });
      toast.success(nextStatus === "closed" ? "Message closed" : "Message marked as read");
    } catch (error) {
      toast.error("Message update failed", {
        description: getErrorMessage(error, "Please try again."),
      });
    }
  }

  if (status === "restoring" || !isVendorAuthenticated || !vendor) {
    return (
      <div className="container grid min-h-[55vh] place-items-center py-16">
        <Loader2 className="h-7 w-7 animate-spin text-accent" />
      </div>
    );
  }

  const verified = vendor.verification_status === "verified";
  const publicStoreUrl = `/vendors/${vendor.store_slug}`;
  const sales = analytics?.sales;
  const productStats = analytics?.product_stats;
  const messageStats = analytics?.messages;
  const topProducts = analytics?.top_products || [];
  const recentMessages = messages.slice(0, 6);

  return (
    <div className="bg-background">
      <section className="border-b border-border bg-[#070b10] text-white">
        <div className="container py-8 md:py-10">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-white/75">
                  Vendor workspace
                </span>
                {verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-500 px-3 py-1 text-xs font-black text-white">
                    <BadgeCheck className="h-3.5 w-3.5" /> Verified
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-black tracking-tight sm:text-5xl">{vendor.store_name}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
                Submit products for XPOSE approval, keep your store profile sharp, and publish only after verification.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {verified && (
                <Button variant="secondary" asChild>
                  <Link to={publicStoreUrl}>
                    <Eye className="mr-2 h-4 w-4" /> View store
                  </Link>
                </Button>
              )}
              <Button
                variant="outline"
                className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                onClick={() => {
                  logout();
                  navigate("/vendor/login", { replace: true });
                }}
              >
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </Button>
            </div>
          </div>

          <div className="mt-7 grid gap-3 md:grid-cols-4">
            <Metric label="Live products" value={workspace?.stats?.live_products ?? 0} />
            <Metric label="Pending review" value={workspace?.stats?.pending_submissions ?? stats.submitted} />
            <Metric label="Plan" value={vendor.plan_name || "Custom"} />
            <Metric label="Commission" value={`${toNumber(vendor.commission_rate).toFixed(1)}%`} />
          </div>
        </div>
      </section>

      <section className="container grid gap-6 py-8 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-6">
          {vendorUser?.must_change_password && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
              <p className="font-black">Temporary password still active</p>
              <p className="mt-1 text-sm">Change it before handing this account to anyone else in your store.</p>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <VendorSignalCard
              icon={TrendingUp}
              label="30-day sales"
              value={formatPrice(toNumber(sales?.gross_sales))}
              sub={`${toNumber(sales?.order_count)} orders`}
            />
            <VendorSignalCard
              icon={Box}
              label="Units ordered"
              value={toNumber(sales?.units_ordered).toLocaleString()}
              sub="Across approved listings"
            />
            <VendorSignalCard
              icon={Store}
              label="Live products"
              value={toNumber(productStats?.live_products).toLocaleString()}
              sub={`${toNumber(productStats?.limited_stock_products)} limited stock`}
            />
            <VendorSignalCard
              icon={MessageSquare}
              label="Customer requests"
              value={toNumber(messageStats?.new_messages).toLocaleString()}
              sub={`${toNumber(messageStats?.total_messages)} total messages`}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <div className="mb-4 flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-accent" />
                <div>
                  <h2 className="text-xl font-black">Product performance</h2>
                  <p className="text-sm text-muted-foreground">30-day movement from approved vendor products.</p>
                </div>
              </div>
              {topProducts.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                  Product sales will appear here after customer orders include your listings.
                </div>
              ) : (
                <div className="space-y-3">
                  {topProducts.map((product) => (
                    <div key={product.id} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-secondary">
                          {product.image_url ? (
                            <img src={product.image_url} alt="" className="h-full w-full object-contain p-1" />
                          ) : (
                            <Box className="h-5 w-5 text-accent" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-bold">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {product.units_ordered.toLocaleString()} units ordered
                          </p>
                        </div>
                      </div>
                      <p className="text-sm font-black">{formatPrice(toNumber(product.gross_sales))}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <div className="mb-4 flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-accent" />
                <div>
                  <h2 className="text-xl font-black">Customer inbox</h2>
                  <p className="text-sm text-muted-foreground">Requests sent from your public store.</p>
                </div>
              </div>
              {recentMessages.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                  No customer messages yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {recentMessages.map((message) => (
                    <div key={message.id} className="rounded-xl border border-border p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold">{message.customer_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {message.customer_phone || message.customer_email || "No contact shown"}
                          </p>
                        </div>
                        <span className={`rounded-full px-2 py-1 text-[11px] font-black ${
                          message.status === "new" ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground"
                        }`}>
                          {message.status}
                        </span>
                      </div>
                      {message.product_name && (
                        <p className="mt-2 text-xs font-semibold text-muted-foreground">{message.product_name}</p>
                      )}
                      <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{message.message}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {message.status === "new" && (
                          <Button size="sm" variant="outline" onClick={() => markMessage(message, "read")}>
                            Mark read
                          </Button>
                        )}
                        {message.status !== "closed" && (
                          <Button size="sm" variant="outline" onClick={() => markMessage(message, "closed")}>
                            Close
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <form onSubmit={saveProduct} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="mb-5 flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-accent-foreground">
                <PackagePlus className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-black">Submit a product</h2>
                <p className="text-sm text-muted-foreground">XPOSE reviews price and product fit before publishing.</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Product name" id="vendor-product-name">
                <Input id="vendor-product-name" required value={productForm.product_name} onChange={(e) => setProductForm((f) => ({ ...f, product_name: e.target.value }))} />
              </Field>
              <Field label="SKU" id="vendor-sku">
                <Input id="vendor-sku" value={productForm.sku} onChange={(e) => setProductForm((f) => ({ ...f, sku: e.target.value }))} />
              </Field>
              <Field label="Brand" id="vendor-brand">
                <Input id="vendor-brand" value={productForm.brand_name} onChange={(e) => setProductForm((f) => ({ ...f, brand_name: e.target.value }))} />
              </Field>
              <Field label="Category" id="vendor-category">
                <select
                  id="vendor-category"
                  required
                  value={productForm.category_id}
                  onChange={(e) => setProductForm((f) => ({ ...f, category_id: e.target.value }))}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Retail price" id="vendor-retail">
                <Input id="vendor-retail" type="number" min="0" required value={productForm.proposed_retail_price} onChange={(e) => setProductForm((f) => ({ ...f, proposed_retail_price: e.target.value }))} />
              </Field>
              <Field label="Wholesale price" id="vendor-wholesale">
                <Input id="vendor-wholesale" type="number" min="0" value={productForm.proposed_wholesale_price} onChange={(e) => setProductForm((f) => ({ ...f, proposed_wholesale_price: e.target.value }))} />
              </Field>
              <Field label="Your cost price" id="vendor-cost">
                <Input id="vendor-cost" type="number" min="0" value={productForm.proposed_cost_price} onChange={(e) => setProductForm((f) => ({ ...f, proposed_cost_price: e.target.value }))} />
              </Field>
              <Field label="Stock available" id="vendor-stock">
                <Input id="vendor-stock" type="number" min="0" required value={productForm.current_stock} onChange={(e) => setProductForm((f) => ({ ...f, current_stock: e.target.value }))} />
              </Field>
              <Field label="Selling unit" id="vendor-unit">
                <Input id="vendor-unit" placeholder="piece, carton, dozen" value={productForm.selling_unit_label} onChange={(e) => setProductForm((f) => ({ ...f, selling_unit_label: e.target.value }))} />
              </Field>
              <Field label="Minimum order" id="vendor-min-order">
                <Input id="vendor-min-order" type="number" min="1" required value={productForm.min_order_qty} onChange={(e) => setProductForm((f) => ({ ...f, min_order_qty: e.target.value }))} />
              </Field>
              <Field label="Order step" id="vendor-step">
                <Input id="vendor-step" type="number" min="1" required value={productForm.order_qty_step} onChange={(e) => setProductForm((f) => ({ ...f, order_qty_step: e.target.value }))} />
              </Field>
              <Field label="Image URL" id="vendor-image">
                <Input id="vendor-image" value={productForm.image_url} onChange={(e) => setProductForm((f) => ({ ...f, image_url: e.target.value }))} />
              </Field>
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="vendor-description">Description</Label>
                <Textarea id="vendor-description" rows={3} value={productForm.description} onChange={(e) => setProductForm((f) => ({ ...f, description: e.target.value }))} />
              </div>
              <Field label="Tags" id="vendor-tags">
                <Input id="vendor-tags" placeholder="comma separated" value={productForm.product_tags} onChange={(e) => setProductForm((f) => ({ ...f, product_tags: e.target.value }))} />
              </Field>
              <Field label="Notes to XPOSE" id="vendor-notes">
                <Input id="vendor-notes" value={productForm.vendor_notes} onChange={(e) => setProductForm((f) => ({ ...f, vendor_notes: e.target.value }))} />
              </Field>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={productForm.submit}
                  onChange={(e) => setProductForm((f) => ({ ...f, submit: e.target.checked }))}
                />
                Submit immediately for review
              </label>
              <Button type="submit" disabled={savingProduct}>
                {savingProduct ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {productForm.submit ? "Submit product" : "Save draft"}
              </Button>
            </div>
          </form>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black">Product queue</h2>
                <p className="text-sm text-muted-foreground">Drafts, reviews, approvals, and required changes.</p>
              </div>
              {loading ? <Loader2 className="h-5 w-5 animate-spin text-accent" /> : null}
            </div>
            <div className="space-y-3">
              {submissions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                  No vendor products yet.
                </div>
              ) : (
                submissions.map((item) => (
                  <div key={item.id} className="rounded-xl border border-border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-black">{item.product_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.category_name || "Category"} - {formatPrice(toNumber(item.proposed_retail_price))}
                        </p>
                      </div>
                      <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-black ${statusTone(item.submission_status)}`}>
                        <StatusIcon status={item.submission_status} />
                        {item.submission_status.replace(/_/g, " ")}
                      </span>
                    </div>
                    {(item.admin_review_notes || item.rejection_reason) && (
                      <p className="mt-3 rounded-lg bg-secondary p-3 text-sm text-muted-foreground">
                        {item.rejection_reason || item.admin_review_notes}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <form onSubmit={saveProfile} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="mb-4 flex items-center gap-3">
              <Store className="h-5 w-5 text-accent" />
              <h2 className="text-lg font-black">Public store</h2>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="public-description">Store description</Label>
                <Textarea id="public-description" rows={4} value={profileForm.public_description} onChange={(e) => setProfileForm((f) => ({ ...f, public_description: e.target.value }))} />
              </div>
              <Field label="Support phone" id="support-phone">
                <Input id="support-phone" value={profileForm.support_phone} onChange={(e) => setProfileForm((f) => ({ ...f, support_phone: e.target.value }))} />
              </Field>
              <Field label="Support email" id="support-email">
                <Input id="support-email" type="email" value={profileForm.support_email} onChange={(e) => setProfileForm((f) => ({ ...f, support_email: e.target.value }))} />
              </Field>
              <Field label="Website" id="vendor-website">
                <Input id="vendor-website" value={profileForm.website_url} onChange={(e) => setProfileForm((f) => ({ ...f, website_url: e.target.value }))} />
              </Field>
              <Field label="Logo URL" id="vendor-logo">
                <Input id="vendor-logo" value={profileForm.logo_url} onChange={(e) => setProfileForm((f) => ({ ...f, logo_url: e.target.value }))} />
              </Field>
              <Field label="Banner URL" id="vendor-banner">
                <Input id="vendor-banner" value={profileForm.banner_url} onChange={(e) => setProfileForm((f) => ({ ...f, banner_url: e.target.value }))} />
              </Field>
              <div className="space-y-1.5">
                <Label htmlFor="store-visibility">Visibility</Label>
                <select
                  id="store-visibility"
                  value={profileForm.store_visibility_status}
                  disabled={!verified}
                  onChange={(e) => setProfileForm((f) => ({ ...f, store_visibility_status: e.target.value }))}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:opacity-60"
                >
                  <option value="public">Public</option>
                  <option value="hidden">Hidden</option>
                </select>
                {!verified && <p className="text-xs text-muted-foreground">XPOSE verification is required before public publishing.</p>}
              </div>
              <Button type="submit" className="w-full" disabled={savingProfile}>
                {savingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save store profile
              </Button>
            </div>
          </form>

          <form onSubmit={savePassword} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="mb-4 flex items-center gap-3">
              <LockKeyhole className="h-5 w-5 text-accent" />
              <h2 className="text-lg font-black">Password</h2>
            </div>
            <div className="space-y-4">
              <Field label="Current password" id="vendor-current-password">
                <Input id="vendor-current-password" type="password" value={passwordForm.current_password} onChange={(e) => setPasswordForm((f) => ({ ...f, current_password: e.target.value }))} />
              </Field>
              <Field label="New password" id="vendor-new-password">
                <Input id="vendor-new-password" type="password" value={passwordForm.new_password} onChange={(e) => setPasswordForm((f) => ({ ...f, new_password: e.target.value }))} />
              </Field>
              <Field label="Confirm new password" id="vendor-confirm-password">
                <Input id="vendor-confirm-password" type="password" value={passwordForm.confirm_password} onChange={(e) => setPasswordForm((f) => ({ ...f, confirm_password: e.target.value }))} />
              </Field>
              <Button type="submit" className="w-full" variant="outline" disabled={savingPassword}>
                {savingPassword ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Change password
              </Button>
            </div>
          </form>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="mb-3 flex items-center gap-2">
              <Box className="h-5 w-5 text-accent" />
              <p className="font-black">Commercial terms</p>
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Plan: <span className="font-semibold text-foreground">{vendor.plan_name || "Custom"}</span></p>
              <p>Monthly fee: <span className="font-semibold text-foreground">{formatPrice(toNumber(vendor.monthly_fee))}</span></p>
              <p>Commission: <span className="font-semibold text-foreground">{toNumber(vendor.commission_rate).toFixed(1)}%</span></p>
              <p>Product limit: <span className="font-semibold text-foreground">{Number(vendor.max_products || 0).toLocaleString()}</span></p>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs font-black uppercase tracking-wider text-white/50">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}

function VendorSignalCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  sub: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="mb-4 grid h-10 w-10 place-items-center rounded-xl bg-accent/10 text-accent">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{sub}</p>
    </div>
  );
}

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
