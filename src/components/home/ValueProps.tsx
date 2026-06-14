import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BadgePercent, Boxes, Clock3, MapPinned } from "lucide-react";

const promos = [
  {
    icon: BadgePercent,
    title: "Flash deals",
    text: "Short-window price cuts on selected items. Cart totals show the deal price.",
    cta: "View deals",
    to: "/flash-sale",
    tone: "bg-accent text-accent-foreground",
  },
  {
    icon: Boxes,
    title: "Bulk savers",
    text: "Better value when you buy by carton, dozen, bale, or approved trade pack.",
    cta: "Shop cartons",
    to: "/products?sort=price-asc",
    tone: "bg-slate-950 text-white",
  },
  {
    icon: Clock3,
    title: "Limited stock",
    text: "Low-stock items get a clear hurry-up badge before the shelf runs dry.",
    cta: "Move fast",
    to: "/products",
    tone: "bg-amber-400 text-slate-950",
  },
  {
    icon: MapPinned,
    title: "Route orders",
    text: "Reps can record route customer orders on credit and send them straight to dispatch.",
    cta: "Rep portal",
    to: "/sales-rep/login",
    tone: "bg-emerald-600 text-white",
  },
];

export default function ValueProps() {
  return (
    <section className="container py-10 md:py-12">
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        <div className="grid gap-0 lg:grid-cols-[1.1fr_2fr]">
          <div className="relative overflow-hidden border-b border-border bg-[#0b0f14] p-6 text-white lg:border-b-0 lg:border-r">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,91,46,0.14)_0,transparent_38%),linear-gradient(90deg,rgba(255,255,255,0.055)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:auto,42px_42px,42px_42px]" />
            <div className="absolute -right-10 top-8 h-28 w-48 rotate-[-10deg] rounded-2xl border border-white/10 bg-white/5" />
            <div className="absolute -right-2 bottom-10 h-24 w-40 rotate-[8deg] rounded-2xl border border-accent/30 bg-accent/10" />
            <div className="relative">
              <p className="mb-3 inline-flex rounded-full border border-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white/70">
                Trade deals
              </p>
              <h2 className="font-display text-3xl font-black leading-tight md:text-4xl">
                Offers built to move cartons, bundles, and everyday essentials.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-white/70">
                Pick a deal, load the cart, and checkout with the right carton, dozen, or piece price.
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2">
            {promos.map((promo, index) => {
              const Icon = promo.icon;
              return (
                <motion.div
                  key={promo.title}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.06 }}
                  className="border-b border-border p-5 last:border-b-0 sm:border-r sm:even:border-r-0 sm:[&:nth-last-child(-n+2)]:border-b-0"
                >
                  <div className={`mb-4 grid h-11 w-11 place-items-center rounded-xl ${promo.tone}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-base font-bold">{promo.title}</h3>
                  <p className="mt-1 min-h-[2.75rem] text-sm leading-relaxed text-muted-foreground">{promo.text}</p>
                  <Link
                    to={promo.to}
                    className="mt-4 inline-flex h-9 items-center rounded-full border border-border px-4 text-xs font-bold transition-colors hover:border-accent/50 hover:text-accent"
                  >
                    {promo.cta}
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
