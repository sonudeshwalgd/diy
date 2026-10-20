import { Image, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  getComboItemCount,
  getComboStartingPrice,
  type Combo,
} from "../data/products";
import { useCart } from "../context/CartContext";

interface Props {
  combo: Combo;
  onPress: (combo: Combo) => void;
  index?: number;
}

export default function ComboCard({ combo, onPress, index = 0 }: Props) {
  const { getComboQuantity } = useCart();
  const count = getComboQuantity(combo.id);
  const itemCount = getComboItemCount(combo);

  return (
    <Animated.View
      entering={FadeInDown.duration(450).delay(80 + index * 80)}
      style={{ width: "48%", marginBottom: 12 }}
    >
      <Pressable
        onPress={() => onPress(combo)}
        className="bg-white/90 rounded-3xl border border-white/80 active:opacity-90 overflow-hidden"
        style={{
          shadowColor: "#78716C",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <View style={{ position: "relative", overflow: "hidden" }}>
          <Image
            source={combo.image}
            style={{ width: "100%", height: 112 }}
            resizeMode="cover"
          />
          <BlurView
            intensity={60}
            tint="light"
            experimentalBlurMethod="dimezisBlurView"
            style={{
              position: "absolute",
              top: 8,
              left: 8,
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            <Text
              className="text-white text-[10px] font-sans-bold px-2.5 py-1"
              style={{ backgroundColor: "rgba(234,88,12,0.75)" }}
            >
              COMBO
            </Text>
          </BlurView>
          {count > 0 && (
            <View className="absolute top-2 right-2 bg-emerald-500 rounded-full w-6 h-6 items-center justify-center border-2 border-white">
              <Text className="text-white text-xs font-sans-bold">{count}</Text>
            </View>
          )}
        </View>

        <View className="p-3">
          <Text className="text-[15px] font-sans-bold text-stone-900" numberOfLines={1}>
            {combo.name}
          </Text>
          <Text className="text-[11px] text-stone-500 mt-0.5" numberOfLines={1}>
            {combo.description}
          </Text>

          <View className="flex-row items-end justify-between mt-2">
            <View className="flex-row items-center gap-1">
              <Ionicons name="fast-food-outline" size={12} color="#A8A29E" />
              <Text className="text-[10px] text-stone-400">
                {itemCount > 0 ? `${itemCount} items` : "Build your own"}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-[9px] text-stone-400 leading-3">from</Text>
              <Text className="text-lg font-sans-extrabold text-orange-600 leading-5">
                ₹{getComboStartingPrice(combo)}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}
