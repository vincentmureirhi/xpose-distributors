import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { listCategories } from "@/lib/api/categories";
import type { Category } from "@/types/shop";

const tones = [
  "from-accent/30 to-accent/5",
  "from-primary/20 to-primary/5",
  "from-success/20 to-success/5",
  "from-accent-glow/30 to-accent/5",
];

function overlayClass(hasImage?: string) {
  return hasImage
    ? "absolute inset-0 p-6 flex flex-col justify-between bg-gradient-to-t from-black/75 via-black/15 to-black/35"
    : "absolute inset-0 p-6 flex flex-col justify-between";
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    document.title = "Categories - XPOSE";
    listCategories().then(setCategories);
  }, []);

  return (
    <div className="container py-10 md:py-14">
      <div className="mb-10">
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Discover</p>
        <h1 className="font-display font-bold text-4xl md:text-6xl tracking-tight">All categories</h1>
        <p className="text-muted-foreground mt-2 max-w-xl">Pick a world to explore, from everyday essentials to one-of-a-kind finds.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
        {categories.map((category, index) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.04 }}
          >
            <Link
              to={`/products?category=${category.id}`}
              className={`group relative block aspect-[4/5] rounded-3xl overflow-hidden bg-gradient-to-br ${tones[index % tones.length]} border border-border hover:shadow-elevated transition-all`}
            >
              {category.image_url && (
                <img
                  src={category.image_url}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
              )}
              <div className={overlayClass(category.image_url)}>
                <span className={`text-xs font-medium ${category.image_url ? "text-white/75" : "text-muted-foreground"}`}>
                  {category.product_count ?? 0} items
                </span>
                <div>
                  <h3 className={`font-display font-bold text-2xl tracking-tight ${category.image_url ? "text-white" : ""}`}>
                    {category.name}
                  </h3>
                  <p className={`text-sm mt-2 inline-flex items-center gap-1 group-hover:gap-2 transition-all ${category.image_url ? "text-white/80" : "text-accent"}`}>
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