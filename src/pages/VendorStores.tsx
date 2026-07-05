import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BadgeCheck, Loader2, Search, Store, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/context/CartContext";
import { listPublicVendorStores, type VendorStore } from "@/lib/api/vendor-portal";

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function sellerScore(store: VendorStore) {
  return (store.storefront_featured ? 10000 : 0) + Number(store.product_count || 0) * 10 + Number(store.limited_stock_count || 0);
}

export default function VendorStores() {
  const [stores, setStores] = useState<VendorStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    document.title = "Shop Verified Vendors - XPOSE";
    let active = true;
    setLoading(true);
    listPublicVendorStores()
      .then((rows) => {
        if (!active) return;
        setStores(rows);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return stores
      .filter((store) => {
        if (!q) return true;
        return [store.store_name, ...(store.product_categories || [])]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q);
      })
      .sort((a, b) => sellerScore(b) - sellerScore(a));
  }, [search, stores]);

  return (
    <div className="bg-background">
      <section className="border-b border-border bg-[#070b10] text-white">
        <div className="container grid gap-7 py-10 md:grid-cols-[1fr_390px] md:items-end md:py-14">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-accent">XPOSE Marketplace</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">Shop verified stores.</h1>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search vendors or categories"
              className="h-12 border-white/10 bg-white pl-11 font-semibold text-slate-950"
            />
          </div>
        </div>
      </section>

      <section className="container py-8 md:py-12">
        <div className="mb-6 flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-black uppercase tracking-wider text-accent">{filtered.length.toLocaleString()} stores</p>
            <h2 className="mt-1 text-2xl font-black">Find your next supplier</h2>
          </div>
        </div>

        {loading ? (
          <div className="grid min-h-[260px] place-items-center rounded-2xl border border-border"><Loader2 className="h-7 w-7 animate-spin text-accent" /></div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">No stores match that search.</div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((store) => (
              <Link
                key={store.id}
                to={`/vendors/${store.store_slug}`}
                className="group overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all hover:-translate-y-1 hover:border-accent/45 hover:shadow-elevated"
              >
                <div className="relative h-40 bg-[#070b10]">
                  {store.banner_url ? (
                    <img src={store.banner_url} alt="" className="h-full w-full object-cover opacity-80 transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,79,31,0.34),transparent_34%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.28),transparent_30%)]" />
                  )}
                  <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3">
                    <div className="grid h-14 w-14 place-items-center overflow-hidden rounded-2xl border border-white/20 bg-white text-foreground shadow-lg">
                      {store.logo_url ? <img src={store.logo_url} alt="" className="h-full w-full object-cover" /> : <Store className="h-6 w-6" />}
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      {store.storefront_featured && <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-black text-accent-foreground">Top seller</span>}
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-500 px-2.5 py-1 text-xs font-black text-white"><BadgeCheck className="h-3.5 w-3.5" /> Verified</span>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="text-xl font-black tracking-tight group-hover:text-accent">{store.store_name}</h3>
                  {(store.product_categories || []).length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(store.product_categories || []).slice(0, 3).map((category) => (
                        <span key={category} className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground">{category}</span>
                      ))}
                    </div>
                  )}
                  <div className="mt-5 grid grid-cols-2 gap-2 text-sm">
                    <Metric label="Products" value={Number(store.product_count || 0).toLocaleString()} />
                    <Metric label="Starting at" value={store.minimum_price ? formatPrice(toNumber(store.minimum_price)) : "View store"} />
                  </div>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-accent">
                    Shop this store <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-10 rounded-2xl border border-accent/25 bg-accent/10 p-5 sm:flex sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-accent-foreground"><TrendingUp className="h-5 w-5" /></div>
            <div>
              <p className="font-black">Put your store in front of more buyers</p>
              <p className="mt-1 text-sm text-muted-foreground">Sell retail, wholesale or both.</p>
            </div>
          </div>
          <Button className="mt-4 sm:mt-0" asChild><Link to="/sell-on-xpose">Start selling</Link></Button>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-secondary p-3">
      <p className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 truncate font-black">{value}</p>
    </div>
  );
}
