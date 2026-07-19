import {
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

export default function SubcategorySheet({ visible, category, onClose }: Props) {
  const { addItem, increment, decrement, getItemQuantity } = useCart();

  if (!category) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
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
                  Tap + to add items to cart
                </Text>
              </View>
            </View>
            <Pressable onPress={onClose} className="p-1">
              <Ionicons name="close" size={24} color="#6B7280" />
            </Pressable>
          </View>

          {/* Subcategory list with direct cart controls */}
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
          >
            {category.subcategories.map((sub) => {
              const qty = getItemQuantity(sub.id);

              return (
                <View
                  key={sub.id}
                  className={`flex-row items-center justify-between p-4 rounded-xl mb-2 border ${
                    qty > 0
                      ? "bg-green-50 border-green-400"
                      : "bg-white border-gray-100"
                  }`}
                >
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-gray-900">
                      {sub.name}
                    </Text>
                    <Text className="text-sm font-bold text-blue-600 mt-0.5">
                      ₹{sub.price}
                    </Text>
                  </View>

                  {qty > 0 ? (
                    <View className="flex-row items-center gap-3">
                      <Pressable
                        onPress={() => decrement(sub.id)}
                        className="w-8 h-8 rounded-full bg-gray-200 items-center justify-center"
                      >
                        <Ionicons name="remove" size={16} color="#374151" />
                      </Pressable>
                      <Text className="text-base font-bold text-gray-900 w-6 text-center">
                        {qty}
                      </Text>
                      <Pressable
                        onPress={() => increment(sub.id)}
                        className="w-8 h-8 rounded-full bg-green-600 items-center justify-center"
                      >
                        <Ionicons name="add" size={16} color="white" />
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable
                      onPress={() => addItem(sub, category, 1)}
                      className="bg-green-600 rounded-lg px-4 py-2 flex-row items-center gap-1"
                    >
                      <Ionicons name="add" size={14} color="white" />
                      <Text className="text-white text-sm font-semibold">Add</Text>
                    </Pressable>
                  )}
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
