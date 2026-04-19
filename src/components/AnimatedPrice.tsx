import { useEffect, useRef, useState } from "react";
import { animate } from "framer-motion";
import { formatPrice } from "@/context/CartContext";

interface Props {
  value: number;
  className?: string;
  duration?: number;
}

export default function AnimatedPrice({ value, className, duration = 0.6 }: Props) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    const controls = animate(prev.current, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(v),
      onComplete: () => {
        prev.current = value;
      },
    });
    return () => controls.stop();
  }, [value, duration]);

  return <span className={className}>{formatPrice(Math.round(display))}</span>;
}
