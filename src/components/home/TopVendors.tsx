import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, BadgeCheck, Store, TrendingUp } from "lucide-react";
import { formatPrice } from "@/context/CartContext";
import type { VendorStore } from "@/lib/api/vendor-portal";

interface Props {
  vendors: VendorStore[];
}

function vendorScore(vendor: VendorStore) {
  return (vendor.storefront_featured ? 10000 : 0) + Number(vendor.product_count || 0) * 10 + Number(vendor.limited_stock_count || 0);
}

export default function TopVendors({ vendors }: Props) {
  const visible = vendors
    .filter((vendor) => vendor.verified || vendor.verification_status === "verified" || vendor.store_visibility_status === "public")
    .sort((a, b) => vendorScore(b) - vendorScore(a))
    .slice(0, 4);

  if (!visible.length) return null;

  return (
    <section className="border-y border-border bg-[#080b10] py-12 text-white md:py-16">
      <div className="container">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-accent">Marketplace favourites</p>
            <h2 className="mt-2 font-display text-3xl font-black tracking-tight sm:text-4xl">Top verified vendors</h2>
          </div>
          <Link to="/vendors" className="inline-flex h-10 items-center gap-2 rounded-full border border-white/15 px-4 text-sm font-black hover:border-accent hover:text-accent">
            View all stores <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {visible.map((vendor, index) => (
            <motion.div
              key={vendor.id}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: index * 0.06 }}
            >
              <Link
                to={`/vendors/${vendor.store_slug}`}
                className="group block h-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] transition-all hover:-translate-y-1 hover:border-accent/55 hover:bg-white/[0.09]"
              >
                <div className="relative h-32 overflow-hidden bg-slate-900">
                  {vendor.banner_url ? (
                    <img src={vendor.banner_url} alt="" className="h-full w-full object-cover opacity-80 transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,91,46,0.45),transparent_34%),radial-gradient(circle_at_80%_70%,rgba(16,185,129,0.3),transparent_35%)]" />
                  )}
                  <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-blue-500 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white">
                    <BadgeCheck className="h-3.5 w-3.5" /> Verified
                  </span>
                  <div className="absolute -bottom-7 left-4 grid h-14 w-14 place-items-center overflow-hidden rounded-2xl border-2 border-[#080b10] bg-white text-slate-950 shadow-xl">
                    {vendor.logo_url ? <img src={vendor.logo_url} alt="" className="h-full w-full object-cover" /> : <Store className="h-6 w-6" />}
                  </div>
                </div>
                <div className="px-4 pb-4 pt-10">
                  <h3 className="line-clamp-1 text-lg font-black group-hover:text-accent">{vendor.store_name}</h3>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-xl bg-white/[0.06] p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-white/45">Products</p>
                      <p className="mt-1 font-black">{Number(vendor.product_count || 0).toLocaleString()}</p>
                    </div>
                    <div className="rounded-xl bg-white/[0.06] p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-white/45">From</p>
                      <p className="mt-1 truncate font-black">{vendor.minimum_price ? formatPrice(Number(vendor.minimum_price)) : "Shop store"}</p>
                    </div>
                  </div>
                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-black text-accent">
                    Shop vendor <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-accent/30 bg-accent/10 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-accent-foreground"><TrendingUp className="h-5 w-5" /></div>
            <div>
              <p className="font-black">Sell more with XPOSE</p>
              <p className="text-sm text-white/60">Get discovered by retail and wholesale buyers.</p>
            </div>
          </div>
          <Link to="/sell-on-xpose" className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-white px-4 text-sm font-black text-slate-950 hover:bg-white/90">
            Start selling <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
