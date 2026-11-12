import { Image, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import Animated, { FadeInDown } from "react-native-reanimated";
import {
  buildComboCartItem,
  combosCategory,
  getComboDiscountAmount,
  getComboItemCount,
  getComboOriginalPrice,
  getComboStartingPrice,
  getDefaultComboSelections,
  isCustomCombo,
  type Combo,
} from "../data/products";
import { useCart } from "../context/CartContext";
import { useDisabledItems } from "../context/DisabledItemsContext";
import { useResponsiveLayout } from "../utils/responsive";

interface Props {
  combo: Combo;
  onPress: (combo: Combo) => void;
  index?: number;
}

export default function ComboCard({ combo, onPress, index = 0 }: Props) {
  const { getComboQuantity, addItem, decrement, getItemQuantity } = useCart();
  const { getComboAvailability } = useDisabledItems();
  const { cardWidth } = useResponsiveLayout();
  const itemCount = getComboItemCount(combo);
  const price = getComboStartingPrice(combo);
  const originalPrice = getComboOriginalPrice(combo);
  const discount = getComboDiscountAmount(combo);
  const availability = getComboAvailability(combo);
  const outOfStock = availability.outOfStock;

  const customCombo = isCustomCombo(combo);
  const defaultItem = customCombo
    ? null
    : buildComboCartItem(
        combo,
        getDefaultComboSelections(combo, availability.unavailableOptionIds)
      );
  const count = defaultItem
    ? getItemQuantity(defaultItem.id)
    : getComboQuantity(combo.id);

  return (
    <Animated.View
      entering={FadeInDown.duration(450).delay(80 + index * 80)}
      style={{ width: cardWidth, marginBottom: 12 }}
    >
      <View
        className="bg-white/90 rounded-3xl border border-white/80 overflow-hidden"
        style={{
          shadowColor: "#78716C",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        <Pressable
          onPress={() => onPress(combo)}
          className="active:opacity-90"
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
              source={combo.image}
              style={{ width: "100%", height: "100%" }}
              resizeMode="contain"
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
            {outOfStock && (
              <View className="absolute bottom-2 left-2 bg-red-600 rounded-full px-3 py-1">
                <Text className="text-white text-[10px] font-sans-bold tracking-wide">
                  OUT OF STOCK
                </Text>
              </View>
            )}
          </View>

          <View className="p-3 pb-2">
            <Text className="text-[15px] font-sans-bold text-stone-900" numberOfLines={1}>
              {combo.name}
            </Text>
            <Text
              className="text-[12px] text-stone-500 mt-0.5 font-sans-medium"
              numberOfLines={1}
            >
              {combo.description}
            </Text>

            <View className="flex-row items-end justify-between mt-2">
              <View className="flex-row items-center gap-1">
                <Ionicons name="fast-food-outline" size={13} color="#A8A29E" />
                <Text className="text-[11px] text-stone-400 font-sans-medium">
                  {itemCount > 0 ? `${itemCount} items` : "Build your own"}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-[9px] text-stone-400 leading-3">from</Text>
                <View className="flex-row items-baseline gap-1">
                  {originalPrice > price && (
                    <Text className="text-[10px] text-stone-400 line-through leading-5">
                      ₹{originalPrice}
                    </Text>
                  )}
                  <Text className="text-lg font-sans-extrabold text-orange-600 leading-5">
                    ₹{price}
                  </Text>
                </View>
                {discount > 0 && (
                  <Text className="text-[9px] text-emerald-600 font-sans-bold leading-3">
                    ₹{discount} OFF
                  </Text>
                )}
              </View>
            </View>
          </View>
        </Pressable>

        <View className="flex-row items-center justify-between px-3 pb-3">
          {outOfStock ? (
            <Text className="text-[10px] text-red-500 font-sans-bold ml-auto">
              Out of stock
            </Text>
          ) : defaultItem ? (
            <>
              <Text className="text-[10px] text-stone-400 font-sans-medium">
                Tap for options
              </Text>
              {count === 0 ? (
                <Pressable
                  onPress={() => addItem(defaultItem, combosCategory, 1)}
                  className="w-7 h-7 rounded-full border border-orange-500 items-center justify-center"
                >
                  <Ionicons name="add" size={14} color="#EA580C" />
                </Pressable>
              ) : (
                <View className="flex-row items-center gap-1.5">
                  <Pressable
                    onPress={() => decrement(defaultItem.id)}
                    className="w-7 h-7 rounded-full bg-gray-200 items-center justify-center"
                  >
                    <Ionicons name="remove" size={14} color="#374151" />
                  </Pressable>
                  <Text className="text-xs font-sans-bold text-stone-900 w-4 text-center">
                    {count}
                  </Text>
                  <Pressable
                    onPress={() => addItem(defaultItem, combosCategory, 1)}
                    className="w-7 h-7 rounded-full bg-orange-600 items-center justify-center"
                  >
                    <Ionicons name="add" size={14} color="white" />
                  </Pressable>
                </View>
              )}
            </>
          ) : (
            <Text className="text-[10px] text-orange-600 font-sans-bold ml-auto">
              Customize →
            </Text>
          )}
        </View>
      </View>
    </Animated.View>
  );
}
