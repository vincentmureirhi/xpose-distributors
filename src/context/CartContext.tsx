import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { CartItem, Product } from "@/types/shop";

const CART_KEY = "customerCart";

const getStored = (): CartItem[] => {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const normalizePrice = (p: Product) => Number(p.retail_price || p.price || 0);

export interface GroupThresholdInfo {
  ruleName: string;
  threshold: number;
  cartQty: number;
  met: boolean;
}

interface CartCtx {
  cartItems: CartItem[];
  itemCount: number;
  totalAmount: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (product: Product, quantity?: number) => void;
  updateQuantity: (id: string | number, quantity: number) => void;
  removeFromCart: (id: string | number) => void;
  clearCart: () => void;
  /** Progress for each GROUP_THRESHOLD rule currently in the cart, keyed by pricing_rule_id */
  groupThresholdProgress: Record<string, GroupThresholdInfo>;
}

const CartContext = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => getStored());
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const addToCart = useCallback((product: Product, quantity = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) => (i.id === product.id ? { ...i, quantity: i.quantity + quantity } : i));
      }
      const item: CartItem = {
        id: product.id,
        name: product.name,
        price: normalizePrice(product),
        image_url: product.image_url || "",
        quantity,
        pricing_rule_id: product.pricing_rule_id,
        pricing_rule_type: product.pricing_rule_type,
        pricing_rule_name: product.pricing_rule_name,
        wholesale_threshold_qty: product.wholesale_threshold_qty ?? product.min_qty_wholesale,
      };
      return [...prev, item];
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

  const clearCart = useCallback(() => setCartItems([]), []);

  const itemCount = useMemo(() => cartItems.reduce((s, i) => s + i.quantity, 0), [cartItems]);
  const totalAmount = useMemo(
    () => cartItems.reduce((s, i) => s + Number(i.price || 0) * i.quantity, 0),
    [cartItems]
  );

  /** Aggregate cart quantities for each GROUP_THRESHOLD pricing rule */
  const groupThresholdProgress = useMemo<Record<string, GroupThresholdInfo>>(() => {
    const map: Record<string, GroupThresholdInfo> = {};
    for (const item of cartItems) {
      if (item.pricing_rule_type === "GROUP_THRESHOLD" && item.pricing_rule_id != null) {
        const key = String(item.pricing_rule_id);
        const threshold = item.wholesale_threshold_qty ?? 0;
        if (!map[key]) {
          map[key] = {
            ruleName: item.pricing_rule_name || "this group",
            threshold,
            cartQty: 0,
            met: false,
          };
        }
        map[key].cartQty += item.quantity;
      }
    }
    for (const key of Object.keys(map)) {
      map[key].met = map[key].threshold > 0 && map[key].cartQty >= map[key].threshold;
    }
    return map;
  }, [cartItems]);

  return (
    <CartContext.Provider
      value={{ cartItems, itemCount, totalAmount, isOpen, openCart, closeCart, addToCart, updateQuantity, removeFromCart, clearCart, groupThresholdProgress }}
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
