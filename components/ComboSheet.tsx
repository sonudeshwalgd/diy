import { useMemo, useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  categories,
  combosCategory,
  customComboRule,
  isCustomCombo,
  type Combo,
  type ComboOption,
  type ComboSelectionGroup,
} from "../data/products";
import { useCart } from "../context/CartContext";
import Sheet from "./Sheet";

interface Props {
  visible: boolean;
  combo: Combo | null;
  onClose: () => void;
}

interface CustomItem {
  key: string;
  name: string;
  price: number;
  categoryId: string;
  categoryName: string;
}

const CUSTOM_MIN = customComboRule.eligibility.subtotal.amount;
const CUSTOM_DISCOUNT = customComboRule.discount.amount;

export default function ComboSheet({ visible, combo, onClose }: Props) {
  if (!combo) return null;
  return (
    <ComboSheetContent
      key={combo.id}
      visible={visible}
      combo={combo}
      onClose={onClose}
    />
  );
}

function ComboSheetContent({
  visible,
  combo,
  onClose,
}: {
  visible: boolean;
  combo: Combo;
  onClose: () => void;
}) {
  const { addItem, getComboQuantity } = useCart();

  const [selections, setSelections] = useState<Record<string, string[]>>(() => {
    const init: Record<string, string[]> = {};
    for (const group of combo.selectionGroups) {
      init[group.id] =
        group.required && group.maxSelections === 1 && group.options.length
          ? [group.options[0].id]
          : [];
    }
    return init;
  });
  const [customQty, setCustomQty] = useState<Record<string, number>>({});

  const customCombo = isCustomCombo(combo);

  const customItems = useMemo<CustomItem[]>(() => {
    const list: CustomItem[] = [];
    for (const cat of categories) {
      if (cat.id === combosCategory.id) continue;
      for (const sub of cat.subcategories) {
        if (sub.variants?.length) {
          for (const v of sub.variants) {
            list.push({
              key: `${sub.id}:${v.id}`,
              name: `${sub.name} · ${v.name}`,
              price: v.price,
              categoryId: cat.id,
              categoryName: cat.name,
            });
          }
        } else {
          list.push({
            key: sub.id,
            name: sub.name,
            price: sub.price ?? 0,
            categoryId: cat.id,
            categoryName: cat.name,
          });
        }
      }
    }
    return list;
  }, []);

  const customByCategory = useMemo(() => {
    const map = new Map<string, CustomItem[]>();
    for (const item of customItems) {
      const arr = map.get(item.categoryId) ?? [];
      arr.push(item);
      map.set(item.categoryId, arr);
    }
    return Array.from(map.values());
  }, [customItems]);

  const itemImage = (categoryId: string, itemId?: string) => {
    if (!itemId) return undefined;
    const cat = categories.find((c) => c.id === categoryId);
    return cat?.subcategories.find((s) => s.id === itemId)?.image;
  };

  const selectedOptions: ComboOption[] = [];
  for (const group of combo.selectionGroups) {
    for (const id of selections[group.id] ?? []) {
      const option = group.options.find((o) => o.id === id);
      if (option) selectedOptions.push(option);
    }
  }

  const fixedTotal = combo.items.reduce((sum, item) => sum + item.price, 0);
  const optionsTotal = selectedOptions.reduce((sum, o) => sum + o.price, 0);
  const comboTotal = fixedTotal + optionsTotal;

  const customSelected = customItems.filter((i) => (customQty[i.key] ?? 0) > 0);
  const customSubtotal = customSelected.reduce(
    (sum, i) => sum + i.price * (customQty[i.key] ?? 0),
    0
  );
  const customDiscount = customSubtotal >= CUSTOM_MIN ? CUSTOM_DISCOUNT : 0;
  const customTotal = customSubtotal - customDiscount;

  const unmetGroups = combo.selectionGroups.filter(
    (group) =>
      (selections[group.id]?.length ?? 0) <
      (group.required ? group.minSelections : 0)
  );

  const canAdd = customCombo
    ? customSelected.length > 0
    : unmetGroups.length === 0;

  const displayTotal = customCombo ? customTotal : comboTotal;
  const inCartQty = getComboQuantity(combo.id);

  const toggleOption = (group: ComboSelectionGroup, optionId: string) => {
    setSelections((prev) => {
      const current = prev[group.id] ?? [];
      const isSelected = current.includes(optionId);
      let next: string[];
      if (group.maxSelections === 1) {
        next = isSelected ? [] : [optionId];
      } else if (isSelected) {
        next = current.filter((id) => id !== optionId);
      } else if (current.length >= group.maxSelections) {
        next = [...current.slice(1), optionId];
      } else {
        next = [...current, optionId];
      }
      return { ...prev, [group.id]: next };
    });
  };

  const changeCustomQty = (key: string, delta: number) => {
    setCustomQty((prev) => {
      const next = Math.max(0, (prev[key] ?? 0) + delta);
      const updated = { ...prev };
      if (next === 0) {
        delete updated[key];
      } else {
        updated[key] = next;
      }
      return updated;
    });
  };

  const handleAdd = () => {
    if (!canAdd) return;

    if (customCombo) {
      const signature = customSelected
        .map((i) => `${i.key}x${customQty[i.key]}`)
        .sort()
        .join(",");
      const name = `Custom Combo: ${customSelected
        .map((i) =>
          (customQty[i.key] ?? 1) > 1 ? `${i.name} ×${customQty[i.key]}` : i.name
        )
        .join(", ")}`;
      addItem(
        {
          id: `combo:${combo.id}:${signature}`,
          name,
          price: customTotal,
          image: combo.image,
        },
        combosCategory,
        1
      );
    } else {
      const selectedLabels = selectedOptions.map((o) => o.name);
      const signature = selectedOptions
        .map((o) => o.id)
        .sort()
        .join(",");
      const name =
        selectedLabels.length > 0
          ? `${combo.name} (${selectedLabels.join(", ")})`
          : combo.name;
      addItem(
        {
          id: `combo:${combo.id}:${signature}`,
          name,
          price: comboTotal,
          image: combo.image,
        },
        combosCategory,
        1
      );
    }

    onClose();
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      sheetClassName=""
      sheetStyle={{ maxHeight: "80%" }}
    >
      {/* Header */}
      <View className="px-5 pt-2 pb-3 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <Image
            source={combo.image}
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              backgroundColor: "#F5F5F4",
            }}
            resizeMode="contain"
          />
          <View className="flex-1">
            <Text className="text-xl font-sans-bold text-gray-900">{combo.name}</Text>
            <Text className="text-xs text-gray-500">{combo.description}</Text>
          </View>
        </View>
        <Pressable onPress={onClose} className="p-1">
          <Ionicons name="close" size={24} color="#6B7280" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {customCombo ? (
          <>
            <View className="bg-amber-50 rounded-xl px-4 py-3 mb-3 border border-amber-200 flex-row items-center gap-2">
              <Ionicons name="pricetag" size={16} color="#D97706" />
              <Text className="flex-1 text-xs text-amber-800">
                Pick any items. Orders of ₹{CUSTOM_MIN} or more get ₹
                {CUSTOM_DISCOUNT} off.
              </Text>
            </View>

            {customByCategory.map((items) => (
              <View
                key={items[0].categoryId}
                className="bg-white/80 rounded-3xl mb-3 border border-white/80 overflow-hidden"
              >
                <Text className="text-sm font-sans-bold text-gray-900 px-4 pt-3 pb-1">
                  {items[0].categoryName}
                </Text>
                {items.map((item, idx) => {
                  const qty = customQty[item.key] ?? 0;
                  const image = itemImage(
                    item.categoryId,
                    item.key.split(":")[0]
                  );
                  return (
                    <View
                      key={item.key}
                      className={`flex-row items-center px-4 py-2.5 ${
                        idx > 0 ? "border-t border-gray-100" : ""
                      }`}
                    >
                      {image ? (
                        <Image
                          source={image}
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 12,
                            backgroundColor: "#F5F5F4",
                          }}
                          resizeMode="contain"
                        />
                      ) : (
                        <View className="w-12 h-12 rounded-xl bg-gray-100 items-center justify-center">
                          <Ionicons name="fast-food" size={20} color="#9CA3AF" />
                        </View>
                      )}
                      <Text
                        className="flex-1 ml-3 text-sm text-gray-800"
                        numberOfLines={2}
                      >
                        {item.name}
                      </Text>
                      <Text className="text-base font-sans-extrabold text-orange-600 mr-3">
                        ₹{item.price}
                      </Text>
                      {qty > 0 ? (
                        <View className="flex-row items-center gap-2">
                          <Pressable
                            onPress={() => changeCustomQty(item.key, -1)}
                            className="w-8 h-8 rounded-full bg-gray-200 items-center justify-center"
                          >
                            <Ionicons name="remove" size={16} color="#374151" />
                          </Pressable>
                          <Text className="text-sm font-sans-bold text-gray-900 w-5 text-center">
                            {qty}
                          </Text>
                          <Pressable
                            onPress={() => changeCustomQty(item.key, 1)}
                            className="w-8 h-8 rounded-full bg-green-600 items-center justify-center"
                          >
                            <Ionicons name="add" size={16} color="white" />
                          </Pressable>
                        </View>
                      ) : (
                        <Pressable
                          onPress={() => changeCustomQty(item.key, 1)}
                          className="w-8 h-8 rounded-full border border-green-600 items-center justify-center"
                        >
                          <Ionicons name="add" size={16} color="#16A34A" />
                        </Pressable>
                      )}
                    </View>
                  );
                })}
              </View>
            ))}
          </>
        ) : (
          <>
            {/* Fixed items */}
            {combo.items.length > 0 && (
              <View className="bg-white/80 rounded-3xl p-4 mb-3 border border-white/80">
                <Text className="text-sm font-sans-semibold text-gray-900 mb-1">
                  Includes
                </Text>
                {combo.items.map((item) => {
                  const image = itemImage(item.categoryId, item.id);
                  return (
                    <View
                      key={
                        item.variantId ? `${item.id}:${item.variantId}` : item.id
                      }
                      className="flex-row items-center gap-3 py-2"
                    >
                      {image ? (
                        <Image
                          source={image}
                          style={{
                            width: 56,
                            height: 56,
                            borderRadius: 12,
                            backgroundColor: "#F5F5F4",
                          }}
                          resizeMode="contain"
                        />
                      ) : (
                        <View className="w-14 h-14 rounded-xl bg-gray-100 items-center justify-center">
                          <Ionicons name="fast-food" size={22} color="#9CA3AF" />
                        </View>
                      )}
                      <Text className="flex-1 text-sm font-sans-medium text-gray-800">
                        {item.name}
                      </Text>
                      <Text className="text-base font-sans-extrabold text-orange-600">
                        ₹{item.price}
                      </Text>
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color="#16A34A"
                      />
                    </View>
                  );
                })}
              </View>
            )}

            {/* Selection groups */}
            {combo.selectionGroups.map((group) => {
              const selected = selections[group.id] ?? [];
              const single = group.maxSelections === 1;
              return (
                <View
                  key={group.id}
                  className="bg-white/80 rounded-3xl mb-3 border border-white/80 overflow-hidden"
                >
                  <View className="flex-row items-center justify-between px-4 pt-3 pb-1">
                    <Text className="text-sm font-sans-bold text-gray-900">
                      {group.name}
                    </Text>
                    {group.required && (
                      <View className="bg-red-50 rounded px-2 py-0.5">
                        <Text className="text-[10px] font-sans-semibold text-red-500">
                          Required
                        </Text>
                      </View>
                    )}
                  </View>
                  {group.options.map((option, idx) => {
                    const isSelected = selected.includes(option.id);
                    const image = itemImage(
                      option.categoryId,
                      option.itemId ?? option.id
                    );
                    return (
                      <Pressable
                        key={option.id}
                        onPress={() => toggleOption(group, option.id)}
                        className={`flex-row items-center px-4 py-3 ${
                          idx > 0 ? "border-t border-gray-100" : ""
                        } ${isSelected ? "bg-green-50" : ""}`}
                      >
                        <Ionicons
                          name={
                            single
                              ? isSelected
                                ? "radio-button-on"
                                : "radio-button-off"
                              : isSelected
                              ? "checkbox"
                              : "square-outline"
                          }
                          size={22}
                          color={isSelected ? "#16A34A" : "#9CA3AF"}
                        />
                        {image ? (
                          <Image
                            source={image}
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: 12,
                              backgroundColor: "#F5F5F4",
                              marginLeft: 12,
                            }}
                            resizeMode="contain"
                          />
                        ) : (
                          <View className="w-12 h-12 rounded-xl bg-gray-100 ml-3 items-center justify-center">
                            <Ionicons
                              name="fast-food"
                              size={20}
                              color="#9CA3AF"
                            />
                          </View>
                        )}
                        <Text
                          className={`flex-1 ml-3 text-sm ${
                            isSelected
                              ? "text-gray-900 font-sans-semibold"
                              : "text-gray-600"
                          }`}
                        >
                          {option.name}
                        </Text>
                        <Text
                          className={`text-base font-sans-extrabold ${
                            isSelected ? "text-green-600" : "text-orange-600"
                          }`}
                        >
                          ₹{option.price}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              );
            })}
          </>
        )}

        {/* Summary + Add */}
        <View className="bg-white/80 rounded-3xl p-4 border border-white/80">
          {customCombo ? (
            <>
              <View className="flex-row justify-between items-center mb-1">
                <Text className="text-sm text-gray-500">
                  Subtotal ({customSelected.length} items)
                </Text>
                <Text className="text-sm text-gray-700">₹{customSubtotal}</Text>
              </View>
              {customDiscount > 0 && (
                <View className="flex-row justify-between items-center mb-1">
                  <Text className="text-sm text-green-600">Combo Discount</Text>
                  <Text className="text-sm text-green-600">
                    −₹{customDiscount}
                  </Text>
                </View>
              )}
              <View className="flex-row justify-between items-center pt-1 border-t border-gray-100">
                <Text className="text-base font-sans-bold text-gray-900">Total</Text>
                <Text className="text-2xl font-sans-extrabold text-orange-600">
                  ₹{displayTotal}
                </Text>
              </View>
              {customDiscount === 0 && customSubtotal > 0 && (
                <Text className="text-xs text-amber-600 mt-1">
                  Add ₹{CUSTOM_MIN - customSubtotal} more to get ₹
                  {CUSTOM_DISCOUNT} off
                </Text>
              )}
            </>
          ) : (
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-xs text-gray-500">Combo Price</Text>
                <Text className="text-2xl font-sans-extrabold text-orange-600">
                  ₹{displayTotal}
                </Text>
              </View>
              {inCartQty > 0 && (
                <Text className="text-xs text-green-600 font-sans-medium">
                  {inCartQty} in cart
                </Text>
              )}
            </View>
          )}

          {!canAdd && (
            <Text className="text-xs text-red-500 mt-2">
              Select required options to continue
            </Text>
          )}

          <Pressable
            onPress={handleAdd}
            disabled={!canAdd}
            className={`mt-3 rounded-xl py-3.5 flex-row items-center justify-center gap-1 ${
              canAdd ? "bg-orange-600" : "bg-stone-300"
            }`}
          >
            <Ionicons name="cart" size={18} color="white" />
            <Text className="text-white text-base font-sans-bold">
              Add to Cart
              {customCombo && customSelected.length > 0
                ? ` — ₹${displayTotal}`
                : ""}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </Sheet>
  );
}
