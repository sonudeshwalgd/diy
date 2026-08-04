import {
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { combosCategory, type Combo } from "../data/products";
import { useCart } from "../context/CartContext";
import Sheet from "./Sheet";

interface Props {
  visible: boolean;
  combo: Combo | null;
  onClose: () => void;
}

export default function ComboSheet({ visible, combo, onClose }: Props) {
  const { addItem, increment, decrement, getItemQuantity } = useCart();

  if (!combo) return null;

  const category = combosCategory;
  const subcategory = category.subcategories.find((s) => s.id === combo.id)!;
  const qty = getItemQuantity(combo.id);

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      sheetClassName="bg-gray-50 rounded-t-3xl"
      sheetStyle={{ maxHeight: "80%" }}
    >
      {/* Header */}
          <View className="px-5 pt-5 pb-3 flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <Image
                source={{ uri: combo.image }}
                className="w-10 h-10 rounded-lg"
                resizeMode="cover"
              />
              <View className="flex-1">
                <Text className="text-lg font-bold text-gray-900">
                  {combo.name}
                </Text>
                <Text className="text-xs text-gray-500">
                  {combo.description}
                </Text>
              </View>
            </View>
            <Pressable onPress={onClose} className="p-1">
              <Ionicons name="close" size={24} color="#6B7280" />
            </Pressable>
          </View>

          {/* Combo contents + add to cart */}
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
          >
            <View className="bg-white rounded-xl p-4 mb-3 border border-gray-100">
              <Text className="text-sm font-semibold text-gray-900 mb-1">
                Includes
              </Text>
              {combo.subItems.map((item) => (
                <View
                  key={item.id}
                  className="flex-row items-center gap-3 py-1.5"
                >
                  {item.image ? (
                    <Image
                      source={{ uri: item.image }}
                      className="w-9 h-9 rounded-lg"
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="w-9 h-9 rounded-lg bg-gray-100 items-center justify-center">
                      <Ionicons name="fast-food" size={18} color="#9CA3AF" />
                    </View>
                  )}
                  <Text className="flex-1 text-sm text-gray-800">
                    {item.name}
                  </Text>
                  <Ionicons name="checkmark-circle" size={18} color="#16A34A" />
                </View>
              ))}
            </View>

            <View className="flex-row items-center justify-between bg-white rounded-xl p-4 border border-gray-100">
              <View>
                <Text className="text-xs text-gray-500">Combo Price</Text>
                <Text className="text-lg font-bold text-blue-600">
                  ₹{combo.totalPrice}
                </Text>
              </View>

              {qty > 0 ? (
                <View className="flex-row items-center gap-3">
                  <Pressable
                    onPress={() => decrement(combo.id)}
                    className="w-8 h-8 rounded-full bg-gray-200 items-center justify-center"
                  >
                    <Ionicons name="remove" size={16} color="#374151" />
                  </Pressable>
                  <Text className="text-base font-bold text-gray-900 w-6 text-center">
                    {qty}
                  </Text>
                  <Pressable
                    onPress={() => increment(combo.id)}
                    className="w-8 h-8 rounded-full bg-green-600 items-center justify-center"
                  >
                    <Ionicons name="add" size={16} color="white" />
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={() => addItem(subcategory, category, 1)}
                  className="bg-green-600 rounded-lg px-5 py-2.5 flex-row items-center gap-1"
                >
                  <Ionicons name="add" size={14} color="white" />
                  <Text className="text-white text-sm font-semibold">Add</Text>
                </Pressable>
              )}
            </View>
          </ScrollView>
    </Sheet>
  );
}
