import { Image, Pressable, Text, View } from "react-native";
import type { Combo } from "../data/products";
import { useCart } from "../context/CartContext";

interface Props {
  combo: Combo;
  onPress: (combo: Combo) => void;
}

export default function ComboCard({ combo, onPress }: Props) {
  const { getItemQuantity } = useCart();
  const count = getItemQuantity(combo.id);

  return (
    <Pressable
      onPress={() => onPress(combo)}
      className="bg-white rounded-xl p-3 mb-3 border border-gray-100 active:bg-gray-50 w-[48%]"
    >
      <View className="relative">
        <Image
          source={{ uri: combo.image }}
          className="w-full h-24 rounded-lg"
          resizeMode="cover"
        />
        {count > 0 && (
          <View className="absolute top-1.5 right-1.5 bg-green-500 rounded-full w-5 h-5 items-center justify-center">
            <Text className="text-white text-[10px] font-bold">{count}</Text>
          </View>
        )}
      </View>
      <Text className="text-sm font-semibold text-gray-900 mt-2" numberOfLines={1}>
        {combo.name}
      </Text>
      <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>
        {combo.description}
      </Text>
      <Text className="text-xs text-gray-400 mt-1">
        {combo.subItems.length} items • ₹{combo.totalPrice}
      </Text>
    </Pressable>
  );
}
