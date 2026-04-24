import { createContext, useContext, useState, type ReactNode } from "react";

export type Lang = "PT" | "EN" | "DE" | "NL";

export interface CartProduct {
  id: string;
  name: Record<Lang, string>;
  price: number;
  image: string;
}

export interface CartItem extends CartProduct {
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (product: CartProduct) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
  total: number;
  count: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const addItem = (product: CartProduct) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsOpen(true);
  };

  const removeItem = (id: string) =>
    setItems((prev) => prev.filter((i) => i.id !== id));

  const updateQty = (id: string, qty: number) => {
    if (qty <= 0) return removeItem(id);
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: qty } : i)));
  };

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
        addItem,
        removeItem,
        updateQty,
        clearCart: () => setItems([]),
        total,
        count,
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
