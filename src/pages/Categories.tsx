import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { listStorefrontCategories } from "@/lib/api/categories";
import type { Category } from "@/types/shop";

const tones = [
  "from-[#ff4f1f]/25 to-[#111827]/5",
  "from-[#111827]/15 to-[#ff4f1f]/5",
  "from-[#059669]/20 to-[#111827]/5",
  "from-[#2563eb]/20 to-[#ff4f1f]/5",
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
    listStorefrontCategories().then(setCategories);
  }, []);

  return (
    <div className="container py-10 md:py-14">
      <div className="mb-10">
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Product lines</p>
        <h1 className="font-display font-bold text-4xl md:text-6xl tracking-tight">All categories</h1>
        <p className="text-muted-foreground mt-2 max-w-xl">Browse active stock by department, from hygiene and beauty to route-ready trade packs.</p>
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
              className={`group relative block min-h-[210px] rounded-2xl overflow-hidden bg-gradient-to-br ${tones[index % tones.length]} border border-border hover:shadow-elevated transition-all`}
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
                <span className={`w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold ${category.image_url ? "bg-black/35 text-white" : "bg-background/70 text-muted-foreground"}`}>
                  {category.product_count ?? 0} items
                </span>
                <div className="min-w-0">
                  <h3 className={`font-display text-xl font-black leading-tight tracking-tight sm:text-2xl ${category.image_url ? "text-white drop-shadow-sm" : ""}`}>
                    {category.name}
                  </h3>
                  <p className={`mt-3 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition-all group-hover:gap-2 ${category.image_url ? "bg-white/15 text-white" : "bg-background/70 text-accent"}`}>
                    Open line <ArrowRight className="h-3.5 w-3.5" />
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
