import { useMemo, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Category } from "../data/products";
import { useCart } from "../context/CartContext";

interface Props {
  visible: boolean;
  category: Category | null;
  onClose: () => void;
}

interface Selections {
  [subId: string]: number;
}

export default function SubcategorySheet({ visible, category, onClose }: Props) {
  const { addMultiple, getCategoryCount } = useCart();
  const [selections, setSelections] = useState<Selections>({});

  const setQty = (subId: string, qty: number) => {
    setSelections((prev) => {
      const next = { ...prev };
      if (qty <= 0) {
        delete next[subId];
      } else {
        next[subId] = qty;
      }
      return next;
    });
  };

  const totalSelected = Object.values(selections).reduce((a, b) => a + b, 0);

  const totalPreview = useMemo(() => {
    if (!category) return 0;
    return Object.entries(selections).reduce((sum, [id, qty]) => {
      const sub = category.subcategories.find((s) => s.id === id);
      return sum + (sub ? sub.price * qty : 0);
    }, 0);
  }, [selections, category]);

  const handleAdd = () => {
    if (!category || totalSelected === 0) return;
    const itemsToAdd = category.subcategories
      .filter((s) => selections[s.id])
      .map((s) => ({ subcategory: s, quantity: selections[s.id] }));
    addMultiple(itemsToAdd, category);
    Alert.alert(
      "Added to Cart",
      `${totalSelected} item${totalSelected > 1 ? "s" : ""} added successfully!`
    );
    setSelections({});
    onClose();
  };

  const handleClose = () => {
    setSelections({});
    onClose();
  };

  if (!category) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-gray-50 rounded-t-3xl" style={{ maxHeight: "80%" }}>
          {/* Header */}
          <View className="px-5 pt-5 pb-3 flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <Image
                source={{ uri: category.image }}
                className="w-10 h-10 rounded-lg"
                resizeMode="cover"
              />
              <View>
                <Text className="text-lg font-bold text-gray-900">
                  {category.name}
                </Text>
                <Text className="text-xs text-gray-500">
                  Select multiple items
                </Text>
              </View>
            </View>
            <Pressable onPress={handleClose} className="p-1">
              <Ionicons name="close" size={24} color="#6B7280" />
            </Pressable>
          </View>

          {/* Subcategory list with inline qty controls */}
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12 }}
            showsVerticalScrollIndicator={false}
          >
            {category.subcategories.map((sub) => {
              const inCart = getCategoryCount(sub.id);
              const qty = selections[sub.id] || 0;
              const isSelected = qty > 0;

              return (
                <View
                  key={sub.id}
                  className={`flex-row items-center justify-between p-4 rounded-xl mb-2 border ${
                    isSelected
                      ? "bg-blue-50 border-blue-400"
                      : "bg-white border-gray-100"
                  }`}
                >
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-base font-semibold text-gray-900">
                        {sub.name}
                      </Text>
                      {inCart > 0 && (
                        <View className="bg-green-100 rounded-full px-2 py-0.5">
                          <Text className="text-green-700 text-[10px] font-bold">
                            {inCart} in cart
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-sm font-bold text-blue-600 mt-0.5">
                      ₹{sub.price}
                    </Text>
                  </View>

                  {isSelected ? (
                    <View className="flex-row items-center gap-3">
                      <Pressable
                        onPress={() => setQty(sub.id, qty - 1)}
                        className="w-8 h-8 rounded-full bg-gray-200 items-center justify-center"
                      >
                        <Ionicons name="remove" size={16} color="#374151" />
                      </Pressable>
                      <Text className="text-base font-bold text-gray-900 w-6 text-center">
                        {qty}
                      </Text>
                      <Pressable
                        onPress={() => setQty(sub.id, qty + 1)}
                        className="w-8 h-8 rounded-full bg-blue-600 items-center justify-center"
                      >
                        <Ionicons name="add" size={16} color="white" />
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable
                      onPress={() => setQty(sub.id, 1)}
                      className="bg-blue-600 rounded-lg px-4 py-2 flex-row items-center gap-1"
                    >
                      <Ionicons name="add" size={14} color="white" />
                      <Text className="text-white text-sm font-semibold">Add</Text>
                    </Pressable>
                  )}
                </View>
              );
            })}
          </ScrollView>

          {/* Bottom bar */}
          {totalSelected > 0 && (
            <View className="bg-white px-5 py-4 border-t border-gray-200 rounded-t-2xl">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-sm text-gray-500">
                  {totalSelected} item{totalSelected > 1 ? "s" : ""} selected
                </Text>
                <Text className="text-base font-bold text-gray-900">
                  ₹{totalPreview}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}
