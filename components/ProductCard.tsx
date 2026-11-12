import { Image, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  getItemPrice,
  type Category,
  type Subcategory,
} from "../data/products";
import { useCart } from "../context/CartContext";
import { useDisabledItems } from "../context/DisabledItemsContext";
import { useResponsiveLayout } from "../utils/responsive";

interface Props {
  product: Subcategory;
  category: Category;
  onPress: (category: Category) => void;
  index?: number;
}

export default function ProductCard({
  product,
  category,
  onPress,
  index = 0,
}: Props) {
  const { getItemQuantity } = useCart();
  const { isItemDisabled } = useDisabledItems();
  const { cardWidth } = useResponsiveLayout();
  const quantity = getItemQuantity(product.id);
  const outOfStock = isItemDisabled(product.id);
  const subtitle =
    product.name === category.name ? category.description : category.name;

  return (
    <Animated.View
      entering={FadeInDown.duration(450).delay(80 + (index % 4) * 70)}
      style={{ width: cardWidth }}
    >
      <Pressable
        onPress={() => onPress(category)}
        className="bg-white/90 rounded-3xl mb-3 border border-white/80 active:opacity-90 overflow-hidden flex-1"
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
            source={product.image ?? category.image}
            style={{ width: "100%", height: "100%" }}
            resizeMode="contain"
          />
          {quantity > 0 && (
            <View className="absolute top-2 right-2 bg-emerald-500 rounded-full w-6 h-6 items-center justify-center border-2 border-white">
              <Text className="text-white text-xs font-sans-bold">
                {quantity}
              </Text>
            </View>
          )}
          {outOfStock && (
            <View className="absolute bottom-2 left-2 bg-red-600 rounded-full px-3 py-1">
              <Text className="text-white text-[10px] font-sans-bold tracking-wide">
                OUT OF STOCK
              </Text>
            </View>
          )}
        </View>

        <View className="p-3 flex-1">
          <Text
            className="text-[15px] font-sans-bold text-stone-900"
            numberOfLines={2}
          >
            {product.name}
          </Text>
          <Text
            className="text-[12px] text-stone-500 mt-0.5 font-sans-medium"
            numberOfLines={1}
          >
            {subtitle}
          </Text>

          <View className="flex-row items-end justify-between mt-auto pt-2">
            <View className="flex-row items-center gap-1">
              <Ionicons
                name={outOfStock ? "close-circle-outline" : "add-circle-outline"}
                size={13}
                color={outOfStock ? "#DC2626" : "#A8A29E"}
              />
              <Text
                className={`text-[11px] font-sans-medium ${
                  outOfStock ? "text-red-500" : "text-stone-400"
                }`}
              >
                {outOfStock ? "Out of stock" : "Tap to add"}
              </Text>
            </View>
            <Text
              className={`text-lg font-sans-extrabold leading-5 ${
                outOfStock ? "text-stone-400" : "text-orange-600"
              }`}
            >
              ₹{getItemPrice(product)}
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}
