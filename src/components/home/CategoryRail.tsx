import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import type { Category } from "@/types/shop";

interface Props { categories: Category[] }

const tones = [
  "from-accent/20 to-accent/5",
  "from-primary/20 to-primary/5",
  "from-success/20 to-success/5",
  "from-accent-glow/20 to-accent/5",
];

export default function CategoryRail({ categories }: Props) {
  return (
    <section className="container py-16 md:py-24">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Browse</p>
          <h2 className="font-display font-bold text-3xl md:text-5xl tracking-tight">Shop by category</h2>
        </div>
        <Link to="/categories" className="text-sm font-medium underline-offset-4 hover:underline hidden sm:inline">
          View all →
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {categories.slice(0, 8).map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: i * 0.05 }}
          >
            <Link
              to={`/products?category=${c.id}`}
              className={`group relative block aspect-[4/5] md:aspect-square rounded-2xl overflow-hidden bg-gradient-to-br ${tones[i % tones.length]} border border-border hover:border-foreground/20 transition-all hover:shadow-elevated`}
            >
              <div className="absolute inset-0 p-5 flex flex-col justify-between">
                <span className="text-xs text-muted-foreground font-medium">{c.product_count ?? 0} items</span>
                <div>
                  <h3 className="font-display font-bold text-xl md:text-2xl tracking-tight group-hover:text-accent transition-colors">{c.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1 group-hover:text-foreground transition-colors">Shop now →</p>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
