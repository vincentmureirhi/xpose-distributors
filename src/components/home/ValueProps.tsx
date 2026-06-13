import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BadgePercent, Boxes, Clock3, MapPinned } from "lucide-react";

const promos = [
  {
    icon: BadgePercent,
    title: "Flash deals",
    text: "Live offers from admin, with sale pricing applied before checkout.",
    cta: "View deals",
    to: "/flash-sale",
    tone: "bg-accent text-accent-foreground",
  },
  {
    icon: Boxes,
    title: "Bulk savers",
    text: "Carton, dozen, and trade-pack rules for shops and resellers.",
    cta: "Shop cartons",
    to: "/products?sort=price-asc",
    tone: "bg-slate-950 text-white",
  },
  {
    icon: Clock3,
    title: "Limited stock",
    text: "Fast movers are surfaced while stock is still available.",
    cta: "Move fast",
    to: "/products",
    tone: "bg-amber-400 text-slate-950",
  },
  {
    icon: MapPinned,
    title: "Route orders",
    text: "Sales reps can capture credit customer orders in the field.",
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
          <div className="border-b border-border bg-[#0b0f14] p-6 text-white lg:border-b-0 lg:border-r">
            <p className="mb-3 inline-flex rounded-full border border-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white/70">
              Promo command
            </p>
            <h2 className="font-display text-3xl font-black leading-tight md:text-4xl">
              Deals that push stock, not just decorate the page.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/65">
              Use flash sales for urgency, bulk savers for trade buyers, and limited-stock prompts to move inventory before it sits.
            </p>
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
