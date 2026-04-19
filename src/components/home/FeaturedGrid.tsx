import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import type { Product } from "@/types/shop";
import ProductCard from "@/components/products/ProductCard";

interface Props { products: Product[]; title?: string; eyebrow?: string }

export default function FeaturedGrid({ products, title = "Featured this week", eyebrow = "Editor's picks" }: Props) {
  return (
    <section className="container py-16 md:py-24">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex items-end justify-between mb-8">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{eyebrow}</p>
          <h2 className="font-display font-bold text-3xl md:text-5xl tracking-tight">{title}</h2>
        </div>
        <Link to="/products" className="text-sm font-medium underline-offset-4 hover:underline hidden sm:inline">
          See all →
        </Link>
      </motion.div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {products.map((p, i) => (
          <ProductCard key={p.id} product={p} index={i} />
        ))}
      </div>
    </section>
  );
}
