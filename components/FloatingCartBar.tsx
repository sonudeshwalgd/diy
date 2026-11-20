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
      style={{ width: "100%", maxWidth: 640, alignSelf: "center" }}
    >
      <BlurView
        intensity={60}
        tint="light"
        experimentalBlurMethod="dimezisBlurView"
        className="rounded-[30px] overflow-hidden border border-white/70"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.16,
          shadowRadius: 18,
          elevation: 12,
        }}
      >
        <View className="bg-white/85 rounded-[30px]">
          <Pressable
            onPress={onPress}
            className="rounded-[30px] px-4 py-3 flex-row items-center gap-3"
            accessibilityLabel="Place order"
          >
            <View className="flex-row">
              {uniqueCategories.map((cat, i) => (
                <Image
                  key={cat.id}
                  source={cat.image}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 19,
                    borderWidth: 2,
                    borderColor: "white",
                    backgroundColor: "#F5F5F4",
                    marginLeft: i > 0 ? -9 : 0,
                    zIndex: uniqueCategories.length - i,
                  }}
                  resizeMode="cover"
                />
              ))}
            </View>

            <View className="flex-1 ml-1">
              <Text className="text-stone-500 text-xs font-sans-medium">
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </Text>
              <Text className="text-stone-900 text-lg font-sans-extrabold">
                ₹{total}
              </Text>
            </View>

            <LinearGradient
              colors={["#FB923C", "#EA580C"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 20,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 16,
                paddingVertical: 11,
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
