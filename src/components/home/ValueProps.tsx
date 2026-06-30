import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, BadgePercent, Boxes, Clock3, MapPinned } from "lucide-react";

const buyingPaths = [
  { icon: BadgePercent, title: "Flash deals", text: "Timed prices on selected stock.", cta: "Shop deals", to: "/flash-sale", tone: "bg-accent text-accent-foreground" },
  { icon: Boxes, title: "Wholesale value", text: "Carton, dozen and trade-pack rates.", cta: "Shop bulk", to: "/products?sort=price-asc", tone: "bg-slate-950 text-white" },
  { icon: Clock3, title: "Low stock", text: "Available while current stock lasts.", cta: "View stock", to: "/products?stock=limited", tone: "bg-amber-400 text-slate-950" },
  { icon: MapPinned, title: "Route delivery", text: "Apply for scheduled route supply.", cta: "Check coverage", to: "/route-delivery", tone: "bg-emerald-600 text-white" },
];

export default function ValueProps() {
  return (
    <section className="container py-10 md:py-14">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-accent">Buying options</p>
          <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Shop your way</h2>
        </div>
        <Link to="/products" className="hidden items-center gap-1 text-sm font-bold hover:text-accent sm:inline-flex">
          All products <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {buyingPaths.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.article
              key={item.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: index * 0.05 }}
              className="rounded-lg border border-border bg-card p-4 shadow-soft"
            >
              <div className={`grid h-10 w-10 place-items-center rounded-md ${item.tone}`}>
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-base font-bold">{item.title}</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.text}</p>
              <Link to={item.to} className="mt-4 inline-flex items-center gap-1 text-sm font-bold hover:text-accent">
                {item.cta} <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}