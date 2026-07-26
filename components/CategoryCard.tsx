import { Image, Pressable, Text, View } from "react-native";
import type { Category } from "../data/products";
import { useCart } from "../context/CartContext";

interface Props {
  category: Category;
  onPress: (category: Category) => void;
}

export default function CategoryCard({ category, onPress }: Props) {
  const { getCategoryCount } = useCart();
  const count = getCategoryCount(category.id);

  return (
    <Pressable
      onPress={() => onPress(category)}
      className="bg-white rounded-xl p-3 mb-3 border border-gray-100 active:bg-gray-50 flex-1 mx-1"
    >
      <View className="relative">
        <Image
          source={{ uri: category.image }}
          className="w-full h-28 rounded-lg"
          resizeMode="cover"
        />
        {count > 0 && (
          <View className="absolute top-1.5 right-1.5 bg-green-500 rounded-full w-5 h-5 items-center justify-center">
            <Text className="text-white text-[10px] font-bold">{count}</Text>
          </View>
        )}
      </View>
      <Text className="text-sm font-semibold text-gray-900 mt-2" numberOfLines={1}>
        {category.name}
      </Text>
      <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>
        {category.description}
      </Text>
      <Text className="text-xs text-gray-400 mt-1">
        {category.subcategories.length} items • From ₹
        {Math.min(...category.subcategories.map((s) => s.price))}
      </Text>
    </Pressable>
  );
}
