import { motion } from "framer-motion";
import { BadgeCheck, Boxes, MapPinned, ReceiptText } from "lucide-react";

const items = [
  { icon: Boxes, title: "Trade-pack pricing", text: "Carton, dozen, and piece rules are shown before checkout." },
  { icon: BadgeCheck, title: "Verified stock", text: "Products show live stock status before you add them to cart." },
  { icon: ReceiptText, title: "Private tracking", text: "Every order can be followed through a secure tracking link." },
  { icon: MapPinned, title: "Route-ready service", text: "Sales reps can capture route customer orders in the field." },
];

export default function ValueProps() {
  return (
    <section className="container py-10 md:py-12">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4 md:gap-4">
        {items.map((it, i) => (
          <motion.div
            key={it.title}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
            className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-card"
          >
            <it.icon className="mb-3 h-6 w-6 text-accent" />
            <h3 className="font-display text-sm font-bold">{it.title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{it.text}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
