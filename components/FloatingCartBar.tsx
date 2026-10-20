import { Image, Pressable, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
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
    <Animated.View
      entering={FadeInDown.duration(350)}
      className="absolute bottom-0 left-0 right-0 px-4 pb-5 pt-6"
    >
      <BlurView
        intensity={60}
        tint="light"
        experimentalBlurMethod="dimezisBlurView"
        className="rounded-3xl overflow-hidden"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.15,
          shadowRadius: 16,
          elevation: 10,
        }}
      >
        <View className="bg-white/85">
          <Pressable
            onPress={onPress}
            className="rounded-3xl px-4 py-3 flex-row items-center gap-3"
          >
            {/* Category icons */}
            <View className="flex-row">
              {uniqueCategories.map((cat, i) => (
                <Image
                  key={cat.id}
                  source={cat.image}
                  className="w-9 h-9 rounded-full border-2 border-white bg-stone-100"
                  resizeMode="cover"
                  style={{
                    marginLeft: i > 0 ? -8 : 0,
                    zIndex: uniqueCategories.length - i,
                  }}
                />
              ))}
            </View>

            {/* Item count + total */}
            <View className="flex-1 ml-1">
              <Text className="text-stone-500 text-xs font-sans-medium">
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </Text>
              <Text className="text-stone-900 text-lg font-sans-extrabold">
                ₹{total}
              </Text>
            </View>

            {/* Place Order button */}
            <LinearGradient
              colors={["#FB923C", "#EA580C"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 16,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 16,
                paddingVertical: 10,
              }}
            >
              <Ionicons name="cart-outline" size={16} color="white" />
              <Text className="text-white text-sm font-sans-bold">Place Order</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </BlurView>
    </Animated.View>
  );
}
