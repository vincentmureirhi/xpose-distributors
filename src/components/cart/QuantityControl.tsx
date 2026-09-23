import { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { motion } from "framer-motion";

type Props = {
  itemId: string | number;
  quantity: number;
  minQty: number;
  step: number;
  updateQuantity: (id: string | number, quantity: number) => void;
  compact?: boolean;
};

export default function QuantityControl({
  itemId,
  quantity,
  minQty,
  step,
  updateQuantity,
  compact = false,
}: Props) {
  const [draft, setDraft] = useState(String(quantity));

  useEffect(() => {
    setDraft(String(quantity));
  }, [quantity]);

  const commit = () => {
    const parsed = Number(draft);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setDraft(String(quantity));
      return;
    }
    updateQuantity(itemId, Math.floor(parsed));
  };

  const decrease = () => updateQuantity(itemId, quantity - step);
  const increase = () => updateQuantity(itemId, quantity + step);

  const height = compact ? "h-8" : "h-9";
  const width = compact ? "w-8" : "w-9";

  return (
    <div className={`flex ${height} items-center rounded-lg border border-border bg-secondary/40`}>
      <button
        type="button"
        onClick={decrease}
        disabled={quantity <= minQty}
        className={`grid ${height} ${width} place-items-center disabled:opacity-35`}
        aria-label="Decrease quantity"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>

      <motion.input
        value={draft}
        onChange={(event) => {
          if (/^\d*$/.test(event.target.value)) setDraft(event.target.value);
        }}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.currentTarget.blur();
          }
          if (event.key === "Escape") {
            setDraft(String(quantity));
            event.currentTarget.blur();
          }
        }}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        aria-label="Quantity"
        className={`${compact ? "w-10" : "w-12"} h-full border-0 bg-transparent p-0 text-center text-sm font-bold tabular-nums outline-none focus:ring-0`}
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
      />

      <button
        type="button"
        onClick={increase}
        className={`grid ${height} ${width} place-items-center`}
        aria-label="Increase quantity"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
