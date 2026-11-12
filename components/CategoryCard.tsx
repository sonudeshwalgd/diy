import { Image, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import type { Category } from "../data/products";
import { getItemPrice } from "../data/products";
import { useCart } from "../context/CartContext";
import { useDisabledItems } from "../context/DisabledItemsContext";
import { useResponsiveLayout } from "../utils/responsive";

interface Props {
  category: Category;
  onPress: (category: Category) => void;
  index?: number;
}

export default function CategoryCard({ category, onPress, index = 0 }: Props) {
  const { getCategoryCount } = useCart();
  const { isItemDisabled } = useDisabledItems();
  const { cardWidth } = useResponsiveLayout();
  const count = getCategoryCount(category.id);
  const availableItems = category.subcategories.filter(
    (sub) => !isItemDisabled(sub.id)
  );
  const allOutOfStock =
    category.subcategories.length > 0 && availableItems.length === 0;
  const lowestPrice = availableItems.length
    ? Math.min(...availableItems.map((s) => getItemPrice(s)))
    : Math.min(...category.subcategories.map((s) => getItemPrice(s)));

  return (
    <Animated.View
      entering={FadeInDown.duration(450).delay(80 + (index % 4) * 70)}
      style={{ width: cardWidth }}
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
        <View
          style={{
            position: "relative",
            overflow: "hidden",
            height: 132,
            backgroundColor: "#F5F5F4",
          }}
        >
          <Image
            source={category.image}
            style={{ width: "100%", height: "100%" }}
            resizeMode="contain"
          />
        {count > 0 && (
          <View className="absolute top-2 right-2 bg-emerald-500 rounded-full w-6 h-6 items-center justify-center border-2 border-white">
            <Text className="text-white text-xs font-sans-bold">{count}</Text>
          </View>
        )}
        {allOutOfStock && (
          <View className="absolute bottom-2 left-2 bg-red-600 rounded-full px-3 py-1">
            <Text className="text-white text-[10px] font-sans-bold tracking-wide">
              OUT OF STOCK
            </Text>
          </View>
        )}
      </View>

      <View className="p-3">
        <Text className="text-[15px] font-sans-bold text-stone-900" numberOfLines={1}>
          {category.name}
        </Text>
        <Text
          className="text-[12px] text-stone-500 mt-0.5 font-sans-medium"
          numberOfLines={2}
        >
          {category.description}
        </Text>

        <View className="flex-row items-end justify-between mt-2">
          <View className="flex-row items-center gap-1">
            <Ionicons
              name={allOutOfStock ? "close-circle-outline" : "fast-food-outline"}
              size={13}
              color={allOutOfStock ? "#DC2626" : "#A8A29E"}
            />
            <Text
              className={`text-[11px] font-sans-medium ${
                allOutOfStock ? "text-red-500" : "text-stone-400"
              }`}
            >
              {allOutOfStock ? "Out of stock" : `${availableItems.length} items`}
            </Text>
          </View>
          <View className="items-end">
            <Text className="text-[9px] text-stone-400 leading-3">
              {allOutOfStock ? "unavailable" : "from"}
            </Text>
            <Text
              className={`text-lg font-sans-extrabold leading-5 ${
                allOutOfStock ? "text-stone-400" : "text-orange-600"
              }`}
            >
              ₹{lowestPrice}
            </Text>
          </View>
        </View>
      </View>
      </Pressable>
    </Animated.View>
  );
}
