import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import type { Product } from "@/types/shop";
import ProductCard from "@/components/products/ProductCard";

interface Props {
  products: Product[];
  endDate?: string;
}

function useCountdown(endDate?: string) {
  const getRemaining = (ed?: string) => {
    if (!ed) return { h: 2, m: 14, s: 39 };
    const diff = Math.max(0, new Date(ed).getTime() - Date.now());
    const totalSeconds = Math.floor(diff / 1000);
    return {
      h: Math.floor(totalSeconds / 3600),
      m: Math.floor((totalSeconds % 3600) / 60),
      s: totalSeconds % 60,
    };
  };

  const [t, setT] = useState(() => getRemaining(endDate));

  useEffect(() => {
    const id = setInterval(() => {
      if (endDate) {
        setT(getRemaining(endDate));
      } else {
        setT((p) => {
          let { h, m, s } = p;
          if (s > 0) s--;
          else if (m > 0) { m--; s = 59; }
          else if (h > 0) { h--; m = 59; s = 59; }
          else { h = 2; m = 14; s = 39; }
          return { h, m, s };
        });
      }
    }, 1000);
    return () => clearInterval(id);
  }, [endDate]);

  return t;
}

export default function FlashSale({ products, endDate }: Props) {
  const t = useCountdown(endDate);

  return (
    <section className="container py-16 md:py-24">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-bold uppercase tracking-wider mb-3">
            <Flame className="h-3.5 w-3.5" /> Flash Sale
          </div>
          <h2 className="font-display font-bold text-3xl md:text-5xl tracking-tight">Ends soon.</h2>
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
