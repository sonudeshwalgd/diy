import { Image, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCart } from "../context/CartContext";

interface Props {
  onPress: () => void;
}

export default function FloatingCartBar({ onPress }: Props) {
  const { items, total, itemCount } = useCart();

  if (items.length === 0) return null;

  const uniqueCategories = Array.from(
    new Map(items.map((item) => [item.category.id, item.category])).values()
  ).slice(0, 5);

  return (
    <View className="absolute bottom-0 left-0 right-0 px-4 pb-5">
      <Pressable
        onPress={onPress}
        className="bg-gray-900 rounded-2xl px-4 py-3 flex-row items-center gap-3"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 10,
        }}
      >
        {/* Category icons */}
        <View className="flex-row">
          {uniqueCategories.map((cat, i) => (
            <Image
              key={cat.id}
              source={{ uri: cat.image }}
              className="w-9 h-9 rounded-full border-2 border-gray-900"
              resizeMode="cover"
              style={{ marginLeft: i > 0 ? -8 : 0, zIndex: uniqueCategories.length - i }}
            />
          ))}
        </View>

        {/* Item count + total */}
        <View className="flex-1 ml-1">
          <Text className="text-white text-sm font-bold">
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </Text>
          <Text className="text-gray-400 text-xs">₹{total}</Text>
        </View>

        {/* Place Order button */}
        <View className="bg-green-600 rounded-xl px-4 py-2.5 flex-row items-center gap-1.5">
          <Ionicons name="cart-outline" size={16} color="white" />
          <Text className="text-white text-sm font-bold">Place Order</Text>
        </View>
      </Pressable>
    </View>
  );
}
