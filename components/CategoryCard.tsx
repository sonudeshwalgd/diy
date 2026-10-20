import { Image, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import type { Category } from "../data/products";
import { getItemPrice } from "../data/products";
import { useCart } from "../context/CartContext";

interface Props {
  category: Category;
  onPress: (category: Category) => void;
  index?: number;
}

export default function CategoryCard({ category, onPress, index = 0 }: Props) {
  const { getCategoryCount } = useCart();
  const count = getCategoryCount(category.id);

  return (
    <Animated.View
      entering={FadeInDown.duration(450).delay(80 + (index % 4) * 70)}
      className="flex-1 mx-1"
    >
      <Pressable
        onPress={() => onPress(category)}
        className="bg-white/90 rounded-3xl mb-3 border border-white/80 active:opacity-90 overflow-hidden"
        style={{
          shadowColor: "#78716C",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
      <View className="relative">
        <Image
          source={category.image}
          className="w-full h-28 bg-stone-100"
          resizeMode="cover"
        />
        {count > 0 && (
          <View className="absolute top-2 right-2 bg-emerald-500 rounded-full w-6 h-6 items-center justify-center border-2 border-white">
            <Text className="text-white text-xs font-sans-bold">{count}</Text>
          </View>
        )}
      </View>

      <View className="p-3">
        <Text className="text-[15px] font-sans-bold text-stone-900" numberOfLines={1}>
          {category.name}
        </Text>
        <Text className="text-[11px] text-stone-500 mt-0.5" numberOfLines={2}>
          {category.description}
        </Text>

        <View className="flex-row items-end justify-between mt-2">
          <View className="flex-row items-center gap-1">
            <Ionicons name="fast-food-outline" size={12} color="#A8A29E" />
            <Text className="text-[10px] text-stone-400">
              {category.subcategories.length} items
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-[9px] text-stone-400 leading-3">from</Text>
            <Text className="text-lg font-sans-extrabold text-orange-600 leading-5">
              ₹{Math.min(...category.subcategories.map((s) => getItemPrice(s)))}
            </Text>
          </View>
        </View>
      </View>
      </Pressable>
    </Animated.View>
  );
}
