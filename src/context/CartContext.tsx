import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
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
  Number(p.retail_price || p.price || p.wholesale_price || 0);

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

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  // Stable key based on ids+quantities only — re-evaluate backend pricing when this changes
  const qtySignature = useMemo(
    () => cartItems.map((i) => `${i.id}:${i.quantity}`).join("|"),
    [cartItems]
  );

  useEffect(() => {
    if (!qtySignature) {
      setEvaluations({});
      return;
    }

    let cancelled = false;
    setPricingLoading(true);

    evaluatePricing(cartItems.map((i) => ({ product_id: i.id, quantity: i.quantity })))
      .then((results) => {
        if (cancelled) return;
        const map: Record<string | number, PricingEvaluation> = {};
        results.forEach((r) => {
          map[r.product_id] = r;
        });
        setEvaluations(map);
      })
      .catch(() => {
        // Backend unavailable — keep existing evaluations, fall back to local prices
      })
      .finally(() => {
        if (!cancelled) setPricingLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [qtySignature]); // eslint-disable-line react-hooks/exhaustive-deps

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const addToCart = useCallback((product: Product, quantity = 1, unitPrice?: number) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.id === product.id
            ? {
                ...i,
                quantity: i.quantity + quantity,
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
          name: product.name,
          price,
          image_url: product.image_url || "",
          quantity,
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
    setCartItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity } : i)));
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
