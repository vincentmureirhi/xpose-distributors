import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { CartItem, PricingEvaluation, Product } from "@/types/shop";
import { evaluatePricing } from "@/lib/api/pricing";

const CART_KEY = "customerCart";

const getStored = (): CartItem[] => {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const normalizePrice = (p: Product) =>
  Number(p.discounted_price || p.retail_price || p.price || p.wholesale_price || 0);

const getQuantityRules = (source: Product | CartItem) => {
  const min = Math.max(1, Number(source.min_order_qty || 1));
  const step = Math.max(1, Number(source.order_qty_step || 1));
  return { min, step };
};

const alignQuantity = (quantity: number, source: Product | CartItem) => {
  const { min, step } = getQuantityRules(source);
  if (!Number.isFinite(quantity) || quantity <= 0) return 0;
  if (quantity <= min) return min;
  return min + Math.ceil((quantity - min) / step) * step;
};

const normalizeAddQuantity = (quantity: number, source: Product | CartItem) => {
  const { min, step } = getQuantityRules(source);
  if (!Number.isFinite(quantity) || quantity <= 0) return min;
  if (quantity < min) return min;
  return Math.ceil(quantity / step) * step;
};

interface CartCtx {
  cartItems: CartItem[];
  itemCount: number;
  totalAmount: number;
  isOpen: boolean;
  pricingLoading: boolean;
  evaluations: Record<string | number, PricingEvaluation>;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (product: Product, quantity?: number, unitPrice?: number) => void;
  updateQuantity: (id: string | number, quantity: number) => void;
  removeFromCart: (id: string | number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => getStored());
  const [isOpen, setIsOpen] = useState(false);
  const [evaluations, setEvaluations] = useState<Record<string | number, PricingEvaluation>>({});
  const [pricingLoading, setPricingLoading] = useState(false);
  const pricingRequestSeq = useRef(0);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  // Stable key based on ids and quantities only. Backend pricing is verified after the user stops changing quantities.
  const qtySignature = useMemo(
    () => cartItems.map((i) => `${i.id}:${i.quantity}`).join("|"),
    [cartItems]
  );

  useEffect(() => {
    if (!qtySignature) {
      pricingRequestSeq.current += 1;
      setEvaluations({});
      setPricingLoading(false);
      return;
    }

    const items = qtySignature.split("|").map((seg) => {
      const [id, qty] = seg.split(":");
      return { product_id: id, quantity: Number(qty) };
    });

    let cancelled = false;
    const requestId = ++pricingRequestSeq.current;

    const timer = window.setTimeout(() => {
      if (cancelled) return;
      setPricingLoading(true);

      evaluatePricing(items)
        .then((results) => {
          if (cancelled || requestId !== pricingRequestSeq.current) return;
          const map: Record<string | number, PricingEvaluation> = {};
          results.forEach((r) => {
            map[r.product_id] = r;
          });
          setEvaluations(map);
        })
        .catch(() => {
          // Keep existing evaluations and fall back to local prices if the pricing service is busy.
        })
        .finally(() => {
          if (!cancelled && requestId === pricingRequestSeq.current) setPricingLoading(false);
        });
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [qtySignature]);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const addToCart = useCallback((product: Product, quantity = 1, unitPrice?: number) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      const addition = normalizeAddQuantity(quantity, product);
      if (existing) {
        return prev.map((i) =>
          i.id === product.id
            ? {
                ...i,
                quantity: alignQuantity(i.quantity + addition, i),
                ...(unitPrice !== undefined ? { price: unitPrice } : {}),
              }
            : i
        );
      }
      const price = unitPrice !== undefined ? unitPrice : normalizePrice(product);
      return [
        ...prev,
        {
          id: product.id,
          category_id: product.category_id,
          name: product.name,
          price,
          image_url: product.image_url || "",
          quantity: alignQuantity(addition, product),
          min_order_qty: Math.max(1, Number(product.min_order_qty || 1)),
          order_qty_step: Math.max(1, Number(product.order_qty_step || 1)),
          selling_unit_label: product.selling_unit_label || "piece",
        },
      ];
    });
    setIsOpen(true);
  }, []);

  const updateQuantity = useCallback((id: string | number, quantity: number) => {
    if (quantity <= 0) {
      setCartItems((prev) => prev.filter((i) => i.id !== id));
      return;
    }
    setCartItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: alignQuantity(quantity, i) } : i)));
  }, []);

  const removeFromCart = useCallback((id: string | number) => {
    setCartItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
    setEvaluations({});
  }, []);

  const itemCount = useMemo(() => cartItems.reduce((s, i) => s + i.quantity, 0), [cartItems]);

  // totalAmount uses backend-evaluated unit prices when available, falls back to item.price
  const totalAmount = useMemo(
    () =>
      cartItems.reduce((s, i) => {
        const ev = evaluations[i.id];
        const unitPrice = ev ? ev.unit_price : Number(i.price || 0);
        return s + unitPrice * i.quantity;
      }, 0),
    [cartItems, evaluations]
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        itemCount,
        totalAmount,
        isOpen,
        pricingLoading,
        evaluations,
        openCart,
        closeCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}

export const formatPrice = (n: number) =>
  new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(n);
