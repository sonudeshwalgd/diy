import { useMemo, useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  getItemPrice,
  type Category,
  type Subcategory,
  type Variant,
} from "../data/products";
import { useCart } from "../context/CartContext";
import Sheet from "./Sheet";

interface Props {
  visible: boolean;
  category: Category | null;
  onClose: () => void;
}

interface DraftSelection {
  subcategory: Subcategory;
  quantity: number;
}

export default function SubcategorySheet({ visible, category, onClose }: Props) {
  if (!category) return null;

  return (
    <SubcategorySheetContent
      key={category.id}
      visible={visible}
      category={category}
      onClose={onClose}
    />
  );
}

function SubcategorySheetContent({
  visible,
  category,
  onClose,
}: {
  visible: boolean;
  category: Category;
  onClose: () => void;
}) {
  const { addItem, addMultiple, removeItem, decrement, getItemQuantity } =
    useCart();
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const keepOpenAfterAdd = category.id === "pancakes";
  const isAutoAdd = !keepOpenAfterAdd;
  const showInCart = keepOpenAfterAdd;

  const draftSelections = useMemo<DraftSelection[]>(() => {
    const list: DraftSelection[] = [];
    for (const sub of category.subcategories) {
      if (sub.variants?.length) {
        for (const variant of sub.variants) {
          const key = `${sub.id}:${variant.id}`;
          const quantity = quantities[key] ?? 0;
          if (quantity > 0) {
            list.push({
              subcategory: {
                ...sub,
                id: key,
                name: `${sub.name} · ${variant.name}`,
                price: variant.price,
              },
              quantity,
            });
          }
        }
      } else {
        const quantity = quantities[sub.id] ?? 0;
        if (quantity > 0) list.push({ subcategory: sub, quantity });
      }
    }
    return list;
  }, [category, quantities]);

  const selectedCount = draftSelections.reduce(
    (sum, selection) => sum + selection.quantity,
    0
  );
  const selectedTotal = draftSelections.reduce(
    (sum, selection) =>
      sum + getItemPrice(selection.subcategory) * selection.quantity,
    0
  );

  const changeQuantity = (key: string, delta: number) => {
    setQuantities((prev) => {
      const quantity = Math.max(0, (prev[key] ?? 0) + delta);
      const next = { ...prev };
      if (quantity === 0) {
        delete next[key];
      } else {
        next[key] = quantity;
      }
      return next;
    });
  };

  const changeVariantQuantity = (
    sub: Subcategory,
    variant: Variant,
    delta: number
  ) => {
    const key = `${sub.id}:${variant.id}`;
    setQuantities((prev) => {
      const quantity = Math.max(0, (prev[key] ?? 0) + delta);
      const next = { ...prev };
      if (quantity === 0) {
        delete next[key];
      } else {
        next[key] = quantity;
        if (sub.maxOneVariant) {
          sub.variants?.forEach((v) => {
            if (v.id !== variant.id) delete next[`${sub.id}:${v.id}`];
          });
        }
      }
      return next;
    });
  };

  const addDirectItem = (sub: Subcategory, variant?: Variant) => {
    if (!variant) {
      addItem(sub, category, 1);
      return;
    }

    const key = `${sub.id}:${variant.id}`;
    if (sub.maxOneVariant) {
      sub.variants?.forEach((v) => {
        if (v.id !== variant.id) removeItem(`${sub.id}:${v.id}`);
      });
    }

    addItem(
      {
        ...sub,
        id: key,
        name: `${sub.name} · ${variant.name}`,
        price: variant.price,
      },
      category,
      1
    );
  };

  const handleAdd = () => {
    if (draftSelections.length === 0) return;

    for (const { subcategory } of draftSelections) {
      if (!subcategory.maxOneVariant) continue;
      const baseId = subcategory.id.split(":")[0];
      subcategory.variants?.forEach((variant) => {
        const key = `${baseId}:${variant.id}`;
        if (key !== subcategory.id) removeItem(key);
      });
    }

    addMultiple(draftSelections, category);
    setQuantities({});
    if (!keepOpenAfterAdd) onClose();
  };

  const handleClose = () => {
    setQuantities({});
    onClose();
  };

  return (
    <Sheet
      visible={visible}
      onClose={handleClose}
      sheetClassName=""
      sheetStyle={{ maxHeight: "85%" }}
    >
      <View className="px-5 pt-2 pb-3 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <Image
            source={category.image}
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              backgroundColor: "#F5F5F4",
            }}
            resizeMode="contain"
          />
          <View className="flex-1">
            <Text className="text-xl font-sans-bold text-gray-900">
              {category.name}
            </Text>
            <Text className="text-xs text-gray-500">
              {isAutoAdd
                ? "Tap + to add items directly to the cart"
                : "Pick quantities for one or more items"}
            </Text>
          </View>
        </View>
        <Pressable onPress={handleClose} className="p-1">
          <Ionicons name="close" size={24} color="#6B7280" />
        </Pressable>
      </View>

      <ScrollView
        style={{ flexShrink: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {category.subcategories.map((sub) => {
          const variants = sub.variants?.length ? sub.variants : undefined;

          if (variants) {
            return (
              <View
                key={sub.id}
                className="bg-white/80 rounded-3xl mb-3 border border-white/80 overflow-hidden"
              >
                <View className="flex-row items-center gap-3 p-3">
                  <Image
                    source={sub.image}
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 16,
                      backgroundColor: "#F5F5F4",
                    }}
                    resizeMode="contain"
                  />
                  <View className="flex-1">
                    <Text className="text-base font-sans-bold text-gray-900">
                      {sub.name}
                    </Text>
                    <Text className="text-xs text-gray-500 mt-0.5">
                      {sub.variantLabel ?? "Choose a size"}
                    </Text>
                  </View>
                </View>

                {variants.map((v, idx) => {
                  const cartId = `${sub.id}:${v.id}`;
                  const inCart = getItemQuantity(cartId);
                  const quantity = isAutoAdd
                    ? inCart
                    : quantities[cartId] ?? 0;

                  return (
                    <View
                      key={v.id}
                      className={`flex-row items-center px-4 py-3 ${
                        idx > 0 ? "border-t border-gray-100" : ""
                      } ${quantity > 0 ? "bg-green-50" : ""}`}
                    >
                      <View className="flex-1">
                        <Text
                          className={`text-sm ${
                            quantity > 0
                              ? "text-gray-900 font-sans-semibold"
                              : "text-gray-600"
                          }`}
                        >
                          {v.name}
                        </Text>
                        {showInCart && inCart > 0 && (
                          <Text className="text-[11px] text-green-600 mt-0.5">
                            {inCart} in cart
                          </Text>
                        )}
                      </View>
                      <Text className="text-base font-sans-extrabold text-orange-600 mr-3">
                        ₹{v.price}
                      </Text>
                      <QuantityControl
                        quantity={quantity}
                        onDecrease={() =>
                          isAutoAdd
                            ? decrement(cartId)
                            : changeVariantQuantity(sub, v, -1)
                        }
                        onIncrease={() =>
                          isAutoAdd
                            ? addDirectItem(sub, v)
                            : changeVariantQuantity(sub, v, 1)
                        }
                      />
                    </View>
                  );
                })}
              </View>
            );
          }

          const quantity = isAutoAdd
            ? getItemQuantity(sub.id)
            : quantities[sub.id] ?? 0;
          const inCart = getItemQuantity(sub.id);

          return (
            <View
              key={sub.id}
              className={`flex-row items-center p-3 rounded-3xl mb-3 border ${
                quantity > 0
                  ? "bg-emerald-50 border-emerald-400"
                  : "bg-white/80 border-white/80"
              }`}
            >
              <View className="relative">
                <Image
                  source={sub.image}
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 16,
                    backgroundColor: "#F5F5F4",
                  }}
                  resizeMode="contain"
                />
                {quantity > 0 && (
                  <View className="absolute -top-1 -right-1 bg-green-500 rounded-full min-w-6 h-6 px-1 items-center justify-center border-2 border-white">
                    <Text className="text-white text-[10px] font-sans-bold">
                      {quantity}
                    </Text>
                  </View>
                )}
              </View>

              <View className="flex-1 ml-3">
                <Text
                  className={`text-base ${
                    quantity > 0
                      ? "text-gray-900 font-sans-bold"
                      : "text-gray-800 font-sans-semibold"
                  }`}
                  numberOfLines={2}
                >
                  {sub.name}
                </Text>
                {showInCart && inCart > 0 && (
                  <Text className="text-xs text-green-600 mt-1 font-sans-medium">
                    {inCart} in cart
                  </Text>
                )}
              </View>

              <View className="items-end ml-2">
                <Text className="text-lg font-sans-extrabold text-orange-600 mb-1.5">
                  ₹{getItemPrice(sub)}
                </Text>
                <QuantityControl
                  quantity={quantity}
                  onDecrease={() =>
                    isAutoAdd
                      ? decrement(sub.id)
                      : changeQuantity(sub.id, -1)
                  }
                  onIncrease={() =>
                    isAutoAdd
                      ? addDirectItem(sub)
                      : changeQuantity(sub.id, 1)
                  }
                />
              </View>
            </View>
          );
        })}
      </ScrollView>

      {!isAutoAdd && selectedCount > 0 && (
        <View className="px-4 pt-3 pb-6 border-t border-white/70 bg-white/70">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-xs text-gray-500">
                {selectedCount} {selectedCount === 1 ? "item" : "items"} selected
              </Text>
              <Text className="text-xl font-sans-extrabold text-orange-600">
                ₹{selectedTotal}
              </Text>
            </View>
            <Pressable
              onPress={handleAdd}
              className="rounded-xl px-5 py-3 flex-row items-center gap-1.5 bg-orange-600"
            >
              <Ionicons name="cart-outline" size={18} color="white" />
              <Text className="text-white text-sm font-sans-bold">
                Add to Cart
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </Sheet>
  );
}

function QuantityControl({
  quantity,
  onDecrease,
  onIncrease,
}: {
  quantity: number;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  if (quantity === 0) {
    return (
      <Pressable
        onPress={onIncrease}
        className="w-9 h-9 rounded-full border border-orange-500 items-center justify-center"
      >
        <Ionicons name="add" size={18} color="#EA580C" />
      </Pressable>
    );
  }

  return (
    <View className="flex-row items-center gap-2">
      <Pressable
        onPress={onDecrease}
        className="w-8 h-8 rounded-full bg-gray-200 items-center justify-center"
      >
        <Ionicons name="remove" size={16} color="#374151" />
      </Pressable>
      <Text className="text-sm font-sans-bold text-gray-900 w-5 text-center">
        {quantity}
      </Text>
      <Pressable
        onPress={onIncrease}
        className="w-8 h-8 rounded-full bg-orange-600 items-center justify-center"
      >
        <Ionicons name="add" size={16} color="white" />
      </Pressable>
    </View>
  );
}
