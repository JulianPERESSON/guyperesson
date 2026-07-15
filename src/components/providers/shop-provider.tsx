"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type CartLine = { productId: string; quantity: number };

type ShopContextValue = {
  cart: CartLine[];
  cartCount: number;
  favorites: string[];
  addToCart: (productId: string, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  toggleFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
};

const ShopContext = createContext<ShopContextValue | null>(null);
const CART_KEY = "linventaire-cart-v1";
const FAVORITES_KEY = "linventaire-favorites-v1";

function readStored<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setCart(readStored<CartLine[]>(CART_KEY, []));
      setFavorites(readStored<string[]>(FAVORITES_KEY, []));
      setHydrated(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => { if (hydrated) window.localStorage.setItem(CART_KEY, JSON.stringify(cart)); }, [cart, hydrated]);
  useEffect(() => { if (hydrated) window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites)); }, [favorites, hydrated]);

  const addToCart = useCallback((productId: string, quantity = 1) => {
    setCart((current) => {
      const existing = current.find((line) => line.productId === productId);
      if (existing) return current.map((line) => line.productId === productId ? { ...line, quantity: Math.min(1, line.quantity + quantity) } : line);
      return [...current, { productId, quantity: Math.min(1, quantity) }];
    });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) setCart((current) => current.filter((line) => line.productId !== productId));
    else setCart((current) => current.map((line) => line.productId === productId ? { ...line, quantity: Math.min(1, quantity) } : line));
  }, []);
  const removeFromCart = useCallback((productId: string) => setCart((current) => current.filter((line) => line.productId !== productId)), []);
  const clearCart = useCallback(() => setCart([]), []);
  const toggleFavorite = useCallback((productId: string) => setFavorites((current) => current.includes(productId) ? current.filter((id) => id !== productId) : [...current, productId]), []);
  const isFavorite = useCallback((productId: string) => favorites.includes(productId), [favorites]);

  const value = useMemo(() => ({ cart, cartCount: cart.reduce((sum, line) => sum + line.quantity, 0), favorites, addToCart, updateQuantity, removeFromCart, clearCart, toggleFavorite, isFavorite }), [cart, favorites, addToCart, updateQuantity, removeFromCart, clearCart, toggleFavorite, isFavorite]);
  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const context = useContext(ShopContext);
  if (!context) throw new Error("useShop doit être utilisé dans ShopProvider");
  return context;
}
