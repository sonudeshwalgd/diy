import { Image, Pressable, Text, View } from "react-native";
import type { IceCreamItem } from "../data/products";
import { useCart } from "../context/CartContext";

interface Props {
  iceCream: IceCreamItem;
  onPress: (iceCream: IceCreamItem) => void;
}

export default function IceCreamCard({ iceCream, onPress }: Props) {
  const { items } = useCart();
  const count = items
    .filter((i) => i.subcategory.id.startsWith(`${iceCream.id}-`))
    .reduce((sum, i) => sum + i.quantity, 0);

  return (
    <Pressable
      onPress={() => onPress(iceCream)}
      className="bg-white rounded-xl p-3 mb-3 border border-gray-100 active:bg-gray-50 w-[48%]"
    >
      <View className="relative">
        <Image
          source={{ uri: iceCream.image }}
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
        {iceCream.name}
      </Text>
      <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>
        {iceCream.description}
      </Text>
      <Text className="text-xs text-gray-400 mt-1">₹{iceCream.price}</Text>
    </Pressable>
  );
}
