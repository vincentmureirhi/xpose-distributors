import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import type { Category } from "@/types/shop";

interface Props {
  categories: Category[];
}

const tones = [
  "from-accent/20 to-accent/5",
  "from-primary/20 to-primary/5",
  "from-success/20 to-success/5",
  "from-accent-glow/20 to-accent/5",
];

function overlayClass(hasImage?: string) {
  return hasImage
    ? "absolute inset-0 p-5 flex flex-col justify-between bg-gradient-to-t from-black/75 via-black/15 to-black/35"
    : "absolute inset-0 p-5 flex flex-col justify-between";
}

export default function CategoryRail({ categories }: Props) {
  return (
    <section className="container py-16 md:py-24">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Browse</p>
          <h2 className="font-display font-bold text-3xl md:text-5xl tracking-tight">Shop by category</h2>
        </div>
        <Link to="/categories" className="text-sm font-medium underline-offset-4 hover:underline hidden sm:inline">
          View all
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {categories.slice(0, 8).map((category, index) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
          >
            <Link
              to={`/products?category=${category.id}`}
              className={`group relative block aspect-[4/5] md:aspect-square rounded-2xl overflow-hidden bg-gradient-to-br ${tones[index % tones.length]} border border-border hover:border-foreground/20 transition-all hover:shadow-elevated`}
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
                  <h3 className={`font-display font-bold text-xl md:text-2xl tracking-tight transition-colors ${category.image_url ? "text-white" : "group-hover:text-accent"}`}>
                    {category.name}
                  </h3>
                  <p className={`text-xs mt-1 transition-colors ${category.image_url ? "text-white/75" : "text-muted-foreground group-hover:text-foreground"}`}>
                    Shop now
                  </p>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}