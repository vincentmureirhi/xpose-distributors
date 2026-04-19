import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { listCategories } from "@/lib/api/categories";
import type { Category } from "@/types/shop";
import { ArrowRight } from "lucide-react";

const tones = [
  "from-accent/30 to-accent/5",
  "from-primary/20 to-primary/5",
  "from-success/20 to-success/5",
  "from-accent-glow/30 to-accent/5",
];

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  useEffect(() => {
    document.title = "Categories — XPOSE";
    listCategories().then(setCategories);
  }, []);

  return (
    <div className="container py-10 md:py-14">
      <div className="mb-10">
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Discover</p>
        <h1 className="font-display font-bold text-4xl md:text-6xl tracking-tight">All categories</h1>
        <p className="text-muted-foreground mt-2 max-w-xl">Pick a world to explore — from everyday essentials to one-of-a-kind finds.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
        {categories.map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.04 }}
          >
            <Link
              to={`/products?category=${c.id}`}
              className={`group relative block aspect-[4/5] rounded-3xl overflow-hidden bg-gradient-to-br ${tones[i % tones.length]} border border-border hover:shadow-elevated transition-all`}
            >
              <div className="absolute inset-0 p-6 flex flex-col justify-between">
                <span className="text-xs text-muted-foreground font-medium">{c.product_count ?? 0} items</span>
                <div>
                  <h3 className="font-display font-bold text-2xl tracking-tight">{c.name}</h3>
                  <p className="text-sm mt-2 inline-flex items-center gap-1 text-accent group-hover:gap-2 transition-all">
                    Shop now <ArrowRight className="h-4 w-4" />
                  </p>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
