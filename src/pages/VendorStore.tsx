import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { BadgeCheck, Loader2, MessageSquare, Store, Tags } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ProductCard from "@/components/products/ProductCard";
import { getPublicVendorStore, sendPublicVendorMessage, type VendorStore } from "@/lib/api/vendor-portal";
import type { Product } from "@/types/shop";

export default function VendorStore() {
  const { slug = "" } = useParams();
  const [store, setStore] = useState<VendorStore | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState("");
  const [messageForm, setMessageForm] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    message: "",
  });

  useEffect(() => {
    if (!slug) return;
    let active = true;
    setLoading(true);
    setError("");

    getPublicVendorStore(slug)
      .then((result) => {
        if (!active) return;
        setStore(result.store);
        setProducts(result.products || []);
        document.title = `${result.store.store_name} - XPOSE`;
      })
      .catch(() => {
        if (!active) return;
        setError("This vendor store is not available.");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  async function submitStoreMessage(event: FormEvent) {
    event.preventDefault();
    if (!store) return;

    setSendingMessage(true);
    try {
      await sendPublicVendorMessage(store.store_slug, messageForm);
      setMessageForm({ customer_name: "", customer_phone: "", customer_email: "", message: "" });
      toast.success("Message sent", {
        description: `${store.store_name} will see it in their XPOSE vendor inbox.`,
      });
    } catch (err) {
      const error = err as { response?: { data?: { error?: string; message?: string } }; message?: string };
      toast.error("Message was not sent", {
        description: error.response?.data?.error || error.response?.data?.message || error.message || "Please try again.",
      });
    } finally {
      setSendingMessage(false);
    }
  }

  if (loading) {
    return (
      <div className="container grid min-h-[55vh] place-items-center py-16">
        <Loader2 className="h-7 w-7 animate-spin text-accent" />
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="container py-16">
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <h1 className="text-2xl font-black">Store unavailable</h1>
          <p className="mt-2 text-muted-foreground">{error || "This store could not be loaded."}</p>
          <Button className="mt-5" asChild>
            <Link to="/vendors">Browse verified stores</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background">
      <section className="relative overflow-hidden border-b border-border bg-[#070b10] text-white">
        {store.banner_url ? (
          <img src={store.banner_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_30%,rgba(255,79,31,0.25),transparent_35%),radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.22),transparent_30%)]" />
        )}
        <div className="container relative py-12 md:py-16">
          <div className="grid gap-6 md:grid-cols-[96px_minmax(0,1fr)]">
            <div className="grid h-24 w-24 place-items-center overflow-hidden rounded-3xl border border-white/15 bg-white text-foreground shadow-2xl">
              {store.logo_url ? (
                <img src={store.logo_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <Store className="h-9 w-9" />
              )}
            </div>
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-500 px-3 py-1 text-xs font-black text-white">
                  <BadgeCheck className="h-3.5 w-3.5" /> {store.verification_badge_label || "Verified by XPOSE"}
                </span>
                {store.storefront_featured && (
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-white/75">
                    Featured
                  </span>
                )}
              </div>
              <h1 className="text-4xl font-black tracking-tight sm:text-6xl">{store.store_name}</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/68">
                {store.public_description || "Approved seller with products reviewed by XPOSE before publishing."}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {(store.product_categories || []).map((category) => (
                  <span key={category} className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
                    <Tags className="h-3 w-3" /> {category}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-8 md:py-10">
        <div className="mb-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <p className="text-sm font-black uppercase tracking-wider text-accent">Verified store</p>
            <h2 className="mt-2 text-2xl font-black">Products reviewed through XPOSE</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Orders still checkout through XPOSE. Store messages go to the vendor inbox so product questions,
              stock requests, and trade enquiries stay traceable.
            </p>
          </div>

          <form onSubmit={submitStoreMessage} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="mb-4 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-accent-foreground">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-black">Message store</h2>
                <p className="text-sm text-muted-foreground">Ask about products, bulk packs, or availability.</p>
              </div>
            </div>
            <div className="grid gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="vendor-message-name">Name</Label>
                <Input
                  id="vendor-message-name"
                  required
                  value={messageForm.customer_name}
                  onChange={(event) => setMessageForm((form) => ({ ...form, customer_name: event.target.value }))}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="vendor-message-phone">Phone</Label>
                  <Input
                    id="vendor-message-phone"
                    value={messageForm.customer_phone}
                    onChange={(event) => setMessageForm((form) => ({ ...form, customer_phone: event.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="vendor-message-email">Email</Label>
                  <Input
                    id="vendor-message-email"
                    type="email"
                    value={messageForm.customer_email}
                    onChange={(event) => setMessageForm((form) => ({ ...form, customer_email: event.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vendor-message-text">Message</Label>
                <Textarea
                  id="vendor-message-text"
                  required
                  rows={4}
                  value={messageForm.message}
                  onChange={(event) => setMessageForm((form) => ({ ...form, message: event.target.value }))}
                />
              </div>
              <Button type="submit" disabled={sendingMessage}>
                {sendingMessage ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Send message
              </Button>
            </div>
          </form>
        </div>

        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-black uppercase tracking-wider text-accent">Live products</p>
            <h2 className="mt-1 text-2xl font-black">{products.length.toLocaleString()} approved listings</h2>
          </div>
          <Button variant="outline" asChild>
            <Link to="/vendors">All verified stores</Link>
          </Button>
        </div>

        {products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
            This store has no live products yet.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
