import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, Loader2, Search, Store, Tags } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/context/CartContext";
import { listPublicVendorStores, type VendorStore } from "@/lib/api/vendor-portal";

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export default function VendorStores() {
  const [stores, setStores] = useState<VendorStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    document.title = "Verified Stores - XPOSE";
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
    if (!q) return stores;
    return stores.filter((store) => {
      const haystack = [
        store.store_name,
        store.public_description,
        ...(store.product_categories || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [search, stores]);

  return (
    <div className="bg-background">
      <section className="border-b border-border bg-[#070b10] text-white">
        <div className="container py-12 md:py-16">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-white/75">
              <BadgeCheck className="h-4 w-4 text-blue-400" />
              Verified marketplace
            </div>
            <h1 className="text-4xl font-black tracking-tight sm:text-6xl">Stores checked by XPOSE.</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/65">
              Browse approved sellers whose products and pricing pass XPOSE review before going live.
            </p>
          </div>
        </div>
      </section>

      <section className="container py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black uppercase tracking-wider text-accent">Marketplace stores</p>
            <h2 className="mt-1 text-2xl font-black">{filtered.length.toLocaleString()} verified sellers</h2>
          </div>
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search stores or categories"
              className="pl-9"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid min-h-[260px] place-items-center rounded-2xl border border-border">
            <Loader2 className="h-7 w-7 animate-spin text-accent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
            No verified stores match this search.
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((store) => (
              <Link
                key={store.id}
                to={`/vendors/${store.store_slug}`}
                className="group overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all hover:-translate-y-1 hover:shadow-elevated"
              >
                <div className="relative h-36 bg-[#070b10]">
                  {store.banner_url ? (
                    <img src={store.banner_url} alt="" className="h-full w-full object-cover opacity-80" />
                  ) : (
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,79,31,0.28),transparent_32%),radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.25),transparent_28%)]" />
                  )}
                  <div className="absolute bottom-4 left-4 flex items-center gap-3">
                    <div className="grid h-14 w-14 place-items-center overflow-hidden rounded-2xl border border-white/20 bg-white text-foreground shadow-lg">
                      {store.logo_url ? (
                        <img src={store.logo_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Store className="h-6 w-6" />
                      )}
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-500 px-2.5 py-1 text-xs font-black text-white">
                      <BadgeCheck className="h-3.5 w-3.5" /> Verified
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-xl font-black tracking-tight group-hover:text-accent">{store.store_name}</h3>
                  <p className="mt-2 line-clamp-2 min-h-[44px] text-sm leading-6 text-muted-foreground">
                    {store.public_description || "Approved seller with products reviewed by XPOSE."}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {(store.product_categories || []).slice(0, 3).map((category) => (
                      <span key={category} className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground">
                        {category}
                      </span>
                    ))}
                  </div>
                  <div className="mt-5 grid grid-cols-3 gap-2 text-sm">
                    <Mini label="Products" value={store.product_count || 0} />
                    <Mini label="Limited" value={store.limited_stock_count || 0} />
                    <Mini label="From" value={store.minimum_price ? formatPrice(toNumber(store.minimum_price)) : "-"} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-10 rounded-2xl border border-border bg-secondary/40 p-5 sm:flex sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Tags className="mt-1 h-5 w-5 text-accent" />
            <div>
              <p className="font-black">Want your store here?</p>
              <p className="mt-1 text-sm text-muted-foreground">Apply, get reviewed, and publish products after XPOSE approval.</p>
            </div>
          </div>
          <Button className="mt-4 sm:mt-0" asChild>
            <Link to="/sell-on-xpose">Apply to sell</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-secondary p-3">
      <p className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 truncate font-black">{value}</p>
    </div>
  );
}
