import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import type { Subcategory, Category } from "../data/products";
import { getItemPrice } from "../data/products";
import { trackCartActivity } from "../services/activityTracker";

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
  getComboQuantity: (comboId: string) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const itemsRef = useRef<CartItem[]>([]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const updateItems = useCallback((next: CartItem[]) => {
    itemsRef.current = next;
    setItems(next);
  }, []);

  const addItem = useCallback(
    (subcategory: Subcategory, category: Category, qty = 1) => {
      const prev = itemsRef.current;
      const existing = prev.find((i) => i.subcategory.id === subcategory.id);
      const nextQuantity = (existing?.quantity ?? 0) + qty;
      const next = existing
        ? prev.map((i) =>
            i.subcategory.id === subcategory.id ? { ...i, quantity: nextQuantity } : i
          )
        : [...prev, { subcategory, category, quantity: qty }];
      updateItems(next);
      trackCartActivity("add", {
        categoryId: category.id,
        categoryName: category.name,
        productId: subcategory.id,
        productName: subcategory.name,
        price: getItemPrice(subcategory),
        quantity: qty,
        value: getItemPrice(subcategory) * qty,
        metadata: { previousQuantity: existing?.quantity ?? 0, nextQuantity },
      });
    },
    [updateItems]
  );

  const addMultiple = useCallback(
    (selections: Selection[], category: Category) => {
      const next = [...itemsRef.current];
      for (const sel of selections) {
        const existing = next.find((i) => i.subcategory.id === sel.subcategory.id);
        if (existing) {
          const idx = next.indexOf(existing);
          next[idx] = { ...existing, quantity: existing.quantity + sel.quantity };
        } else {
          next.push({ subcategory: sel.subcategory, category, quantity: sel.quantity });
        }
        trackCartActivity("add", {
          categoryId: category.id,
          categoryName: category.name,
          productId: sel.subcategory.id,
          productName: sel.subcategory.name,
          price: getItemPrice(sel.subcategory),
          quantity: sel.quantity,
          value: getItemPrice(sel.subcategory) * sel.quantity,
        });
      }
      updateItems(next);
    },
    [updateItems]
  );

  const removeItem = useCallback(
    (subcategoryId: string) => {
      const item = itemsRef.current.find((i) => i.subcategory.id === subcategoryId);
      updateItems(itemsRef.current.filter((i) => i.subcategory.id !== subcategoryId));
      if (!item) return;
      trackCartActivity("remove", {
        categoryId: item.category.id,
        categoryName: item.category.name,
        productId: item.subcategory.id,
        productName: item.subcategory.name,
        price: getItemPrice(item.subcategory),
        quantity: item.quantity,
        value: getItemPrice(item.subcategory) * item.quantity,
      });
    },
    [updateItems]
  );

  const increment = useCallback(
    (subcategoryId: string) => {
      const item = itemsRef.current.find((i) => i.subcategory.id === subcategoryId);
      if (!item) return;
      updateItems(
        itemsRef.current.map((i) =>
          i.subcategory.id === subcategoryId ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
      trackCartActivity("increase", {
        categoryId: item.category.id,
        categoryName: item.category.name,
        productId: item.subcategory.id,
        productName: item.subcategory.name,
        price: getItemPrice(item.subcategory),
        quantity: 1,
        value: getItemPrice(item.subcategory),
        metadata: { nextQuantity: item.quantity + 1 },
      });
    },
    [updateItems]
  );

  const decrement = useCallback(
    (subcategoryId: string) => {
      const item = itemsRef.current.find((i) => i.subcategory.id === subcategoryId);
      if (!item) return;
      const removesItem = item.quantity <= 1;
      updateItems(
        removesItem
          ? itemsRef.current.filter((i) => i.subcategory.id !== subcategoryId)
          : itemsRef.current.map((i) =>
              i.subcategory.id === subcategoryId ? { ...i, quantity: i.quantity - 1 } : i
            )
      );
      trackCartActivity(removesItem ? "remove" : "decrease", {
        categoryId: item.category.id,
        categoryName: item.category.name,
        productId: item.subcategory.id,
        productName: item.subcategory.name,
        price: getItemPrice(item.subcategory),
        quantity: 1,
        value: getItemPrice(item.subcategory),
        metadata: { nextQuantity: removesItem ? 0 : item.quantity - 1 },
      });
    },
    [updateItems]
  );

  const clearCart = useCallback(() => {
    const cleared = itemsRef.current;
    updateItems([]);
    if (cleared.length === 0) return;
    trackCartActivity("clear", {
      quantity: cleared.reduce((sum, item) => sum + item.quantity, 0),
      value: cleared.reduce(
        (sum, item) => sum + getItemPrice(item.subcategory) * item.quantity,
        0
      ),
      metadata: { items: cleared.map((item) => item.subcategory.id) },
    });
  }, [updateItems]);

  const total = items.reduce(
    (sum, item) => sum + getItemPrice(item.subcategory) * item.quantity,
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

  const getComboQuantity = useCallback(
    (comboId: string) => {
      const prefix = `combo:${comboId}`;
      return items
        .filter((i) => i.subcategory.id.startsWith(prefix))
        .reduce((sum, i) => sum + i.quantity, 0);
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
        getComboQuantity,
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
