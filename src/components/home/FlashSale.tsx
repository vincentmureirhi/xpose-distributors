import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import type { Product } from "@/types/shop";
import ProductCard from "@/components/products/ProductCard";

interface Props {
  products: Product[];
  endDate: string;
  saleName?: string;
}

function useCountdown(endDate: string) {
  const [t, setT] = useState(() => {
    const diff = Math.max(0, new Date(endDate).getTime() - Date.now());
    const totalSeconds = Math.floor(diff / 1000);
    return {
      h: Math.floor(totalSeconds / 3600),
      m: Math.floor((totalSeconds % 3600) / 60),
      s: totalSeconds % 60,
    };
  });

  useEffect(() => {
    const calc = () => {
      const diff = Math.max(0, new Date(endDate).getTime() - Date.now());
      const totalSeconds = Math.floor(diff / 1000);
      return {
        h: Math.floor(totalSeconds / 3600),
        m: Math.floor((totalSeconds % 3600) / 60),
        s: totalSeconds % 60,
      };
    };
    setT(calc());
    const id = setInterval(() => setT(calc()), 1000);
    return () => clearInterval(id);
  }, [endDate]);

  return t;
}

export default function FlashSale({ products, endDate, saleName }: Props) {
  const t = useCountdown(endDate);

  if (!products.length) return null;

  return (
    <section className="container py-16 md:py-24">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-bold uppercase tracking-wider mb-3">
            <Flame className="h-3.5 w-3.5" /> Flash Sale
          </div>
          <h2 className="font-display font-bold text-3xl md:text-5xl tracking-tight">
            {saleName || "Ends soon."}
          </h2>
        </motion.div>

        <div className="flex items-center gap-3">
          {([
            ["HRS", t.h],
            ["MIN", t.m],
            ["SEC", t.s],
          ] as const).map(([label, val]) => (
            <div key={label} className="text-center">
              <div className="h-14 w-14 md:h-16 md:w-16 rounded-2xl bg-primary text-primary-foreground grid place-items-center font-display font-bold text-2xl md:text-3xl shadow-elevated">
                {String(val).padStart(2, "0")}
              </div>
              <p className="text-[10px] mt-1 text-muted-foreground tracking-wider">{label}</p>
            </div>
          ))}
          <Link to="/products" className="ml-2 text-sm font-medium underline-offset-4 hover:underline">
            Shop all →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {products.slice(0, 4).map((p, i) => (
          <ProductCard key={p.id} product={p} index={i} />
        ))}
      </div>
    </section>
  );
}
