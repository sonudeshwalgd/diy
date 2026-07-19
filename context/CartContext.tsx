import { createContext, useContext, useState, useCallback } from "react";
import type { Subcategory, Category } from "../data/products";

export interface CartItem {
  subcategory: Subcategory;
  category: Category;
  quantity: number;
}

interface Selection {
  subcategory: Subcategory;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (subcategory: Subcategory, category: Category, qty?: number) => void;
  addMultiple: (selections: Selection[], category: Category) => void;
  removeItem: (subcategoryId: string) => void;
  increment: (subcategoryId: string) => void;
  decrement: (subcategoryId: string) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
  getCategoryCount: (categoryId: string) => number;
  getItemQuantity: (subcategoryId: string) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback(
    (subcategory: Subcategory, category: Category, qty = 1) => {
      setItems((prev) => {
        const existing = prev.find((i) => i.subcategory.id === subcategory.id);
        if (existing) {
          return prev.map((i) =>
            i.subcategory.id === subcategory.id
              ? { ...i, quantity: i.quantity + qty }
              : i
          );
        }
        return [...prev, { subcategory, category, quantity: qty }];
      });
    },
    []
  );

  const addMultiple = useCallback(
    (selections: Selection[], category: Category) => {
      setItems((prev) => {
        const next = [...prev];
        for (const sel of selections) {
          const existing = next.find((i) => i.subcategory.id === sel.subcategory.id);
          if (existing) {
            const idx = next.indexOf(existing);
            next[idx] = { ...existing, quantity: existing.quantity + sel.quantity };
          } else {
            next.push({ subcategory: sel.subcategory, category, quantity: sel.quantity });
          }
        }
        return next;
      });
    },
    []
  );

  const removeItem = useCallback((subcategoryId: string) => {
    setItems((prev) => prev.filter((i) => i.subcategory.id !== subcategoryId));
  }, []);

  const increment = useCallback((subcategoryId: string) => {
    setItems((prev) =>
      prev.map((i) =>
        i.subcategory.id === subcategoryId ? { ...i, quantity: i.quantity + 1 } : i
      )
    );
  }, []);

  const decrement = useCallback((subcategoryId: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.subcategory.id === subcategoryId);
      if (item && item.quantity <= 1) {
        return prev.filter((i) => i.subcategory.id !== subcategoryId);
      }
      return prev.map((i) =>
        i.subcategory.id === subcategoryId ? { ...i, quantity: i.quantity - 1 } : i
      );
    });
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const total = items.reduce(
    (sum, item) => sum + item.subcategory.price * item.quantity,
    0
  );

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const getCategoryCount = useCallback(
    (categoryId: string) =>
      items
        .filter((i) => i.category.id === categoryId)
        .reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  const getItemQuantity = useCallback(
    (subcategoryId: string) => {
      const item = items.find((i) => i.subcategory.id === subcategoryId);
      return item ? item.quantity : 0;
    },
    [items]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        addMultiple,
        removeItem,
        increment,
        decrement,
        clearCart,
        total,
        itemCount,
        getCategoryCount,
        getItemQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
