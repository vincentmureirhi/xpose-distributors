import { motion } from "framer-motion";
import { Truck, ShieldCheck, Headphones, RotateCcw } from "lucide-react";

const items = [
  { icon: Truck, title: "Free shipping", text: "On orders over KES 5,000" },
  { icon: ShieldCheck, title: "Secure checkout", text: "Encrypted & verified" },
  { icon: Headphones, title: "24/7 support", text: "Real humans, fast replies" },
  { icon: RotateCcw, title: "Easy returns", text: "30 days, no questions" },
];

export default function ValueProps() {
  return (
    <section className="container py-12">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {items.map((it, i) => (
          <motion.div
            key={it.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="rounded-2xl bg-card border border-border p-5 hover:shadow-card transition-shadow"
          >
            <it.icon className="h-6 w-6 text-accent mb-3" />
            <h3 className="font-display font-semibold text-sm">{it.title}</h3>
            <p className="text-xs text-muted-foreground mt-1">{it.text}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
