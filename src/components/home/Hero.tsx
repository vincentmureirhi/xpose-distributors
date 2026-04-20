import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listProducts } from "@/lib/api/products";

export default function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y1 = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const [productCount, setProductCount] = useState<number | null>(null);

  useEffect(() => {
    listProducts().then((p) => setProductCount(p.length)).catch(() => {});
  }, []);

  const stats = [
    { v: productCount !== null ? `${productCount}+` : "…", l: "Products" },
    { v: "24 Hrs", l: "Customer Care" },
    { v: "Kenya-Wide", l: "Delivery" },
  ];

  return (
    <section ref={ref} className="relative overflow-hidden bg-primary text-primary-foreground">
      <div className="absolute inset-0 mesh-bg opacity-80" />
      <motion.div style={{ y: y2 }} className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-accent/30 blur-3xl" />
      <motion.div style={{ y: y1 }} className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-primary-glow/40 blur-3xl" />

      <div className="container relative py-20 md:py-32 lg:py-40">
        <motion.div style={{ opacity }} className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-foreground/10 backdrop-blur border border-primary-foreground/20 text-xs font-medium mb-6"
          >
            <Sparkles className="h-3.5 w-3.5 text-accent-glow" />
            New season, new energy
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-display font-bold text-balance text-5xl md:text-7xl lg:text-8xl leading-[0.95] tracking-tighter"
          >
            Shop the<br />
            <span className="bg-gradient-accent bg-clip-text text-transparent">extraordinary.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-6 text-lg md:text-xl text-primary-foreground/70 max-w-xl leading-relaxed"
          >
            A Hybrid Company — Everyday Feels Like{" "}
            <span className="font-bold text-accent-glow">BLACK FRIDAY</span>
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-2 text-sm md:text-base text-primary-foreground/50 max-w-lg leading-relaxed italic"
          >
            Where Wholesale Meets Retail, Quality Meets Affordability
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="mt-10 flex flex-wrap gap-3"
          >
            <Button asChild size="lg" className="h-12 px-7 bg-gradient-accent text-accent-foreground border-0 shadow-glow hover:opacity-95 group">
              <Link to="/products">
                Shop now
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-7 bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
              <Link to="/categories">Browse categories</Link>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="mt-14 grid grid-cols-3 gap-6 max-w-lg"
          >
            {stats.map((s) => (
              <div key={s.l}>
                <p className="font-display font-bold text-3xl">{s.v}</p>
                <p className="text-xs text-primary-foreground/60 uppercase tracking-wider mt-1">{s.l}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
