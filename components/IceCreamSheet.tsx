import { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { iceCreamCategory, type IceCreamItem } from "../data/products";
import { useCart } from "../context/CartContext";
import Sheet from "./Sheet";

interface Props {
  visible: boolean;
  iceCream: IceCreamItem | null;
  onClose: () => void;
}

export default function IceCreamSheet({ visible, iceCream, onClose }: Props) {
  const { addItem } = useCart();
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (!visible) setSelected([]);
  }, [visible]);

  if (!iceCream) return null;

  const limit = iceCream.scoopLimit;

  const toggleFlavour = (flavourId: string) => {
    setSelected((prev) => {
      if (prev.includes(flavourId)) {
        return prev.filter((id) => id !== flavourId);
      }
      if (prev.length >= limit) {
        return [...prev.slice(1), flavourId];
      }
      return [...prev, flavourId];
    });
  };

  const handleAdd = () => {
    if (selected.length === 0) return;
    const ids = selected.slice().sort();
    const names = iceCream.flavours
      .filter((f) => selected.includes(f.id))
      .map((f) => f.name);
    addItem(
      {
        id: `${iceCream.id}-${ids.join("-")}`,
        name: `${iceCream.name} · ${names.join(", ")}`,
        price: iceCream.price,
        image: iceCream.image,
      },
      iceCreamCategory,
      1
    );
    setSelected([]);
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      sheetClassName="bg-gray-50 rounded-t-3xl"
      sheetStyle={{ maxHeight: "85%" }}
    >
      {/* Header */}
          <View className="px-5 pt-5 pb-3 flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <Image
                source={{ uri: iceCream.image }}
                className="w-10 h-10 rounded-lg"
                resizeMode="cover"
              />
              <View className="flex-1">
                <Text className="text-lg font-bold text-gray-900">
                  {iceCream.name}
                </Text>
                <Text className="text-xs text-gray-500">
                  {iceCream.description} · ₹{iceCream.price}
                </Text>
              </View>
            </View>
            <Pressable onPress={onClose} className="p-1">
              <Ionicons name="close" size={24} color="#6B7280" />
            </Pressable>
          </View>

          {/* Selection hint */}
          <View className="px-5 pb-3">
            <Text className="text-sm text-gray-600">
              Select up to <Text className="font-bold">{limit}</Text>{" "}
              {limit === 1 ? "flavour" : "flavours"} ({selected.length}/{limit})
            </Text>
            {limit > 1 && (
              <Text className="text-xs text-gray-400 mt-0.5">
                Selecting more than {limit} replaces the first selected flavour.
              </Text>
            )}
          </View>

          {/* Flavour list */}
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
            showsVerticalScrollIndicator={false}
          >
            {iceCream.flavours.map((flavour) => {
              const isSelected = selected.includes(flavour.id);
              return (
                <Pressable
                  key={flavour.id}
                  onPress={() => toggleFlavour(flavour.id)}
                  className={`flex-row items-center gap-3 p-3 rounded-xl mb-2 border ${
                    isSelected
                      ? "bg-green-50 border-green-400"
                      : "bg-white border-gray-100"
                  }`}
                >
                  <Image
                    source={{ uri: flavour.image }}
                    className="w-10 h-10 rounded-lg"
                    resizeMode="cover"
                  />
                  <Text className="flex-1 text-base font-semibold text-gray-900">
                    {flavour.name}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={24} color="#16A34A" />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Add to cart */}
          <View className="bg-white rounded-t-2xl px-5 pt-4 pb-8 border-t border-gray-200">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-xs text-gray-500">
                  {selected.length} flavour
                  {selected.length === 1 ? "" : "s"} selected
                </Text>
                <Text className="text-lg font-bold text-blue-600">
                  ₹{iceCream.price}
                </Text>
              </View>
              <Pressable
                onPress={handleAdd}
                disabled={selected.length === 0}
                className={`rounded-xl px-6 py-3 flex-row items-center gap-2 ${
                  selected.length === 0
                    ? "bg-gray-300"
                    : "bg-green-600 active:bg-green-700"
                }`}
              >
                <Ionicons name="add" size={18} color="white" />
                <Text className="text-white text-base font-semibold">
                  Add to Cart
                </Text>
              </Pressable>
            </View>
          </View>
    </Sheet>
  );
}
