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
      className="flex-row bg-white rounded-xl p-3 mb-3 mx-4 border border-gray-100 active:bg-gray-50"
    >
      <Image
        source={{ uri: category.image }}
        className="w-20 h-20 rounded-lg"
        resizeMode="cover"
      />
      <View className="flex-1 ml-3 justify-center">
        <View>
          <Text className="text-base font-semibold text-gray-900">
            {category.name}
          </Text>
          <Text className="text-sm text-gray-500 mt-0.5" numberOfLines={1}>
            {category.description}
          </Text>
        </View>

        <View className="flex-row items-center justify-between mt-2">
          <Text className="text-xs text-gray-400">
            {category.subcategories.length} items • From ₹
            {Math.min(...category.subcategories.map((s) => s.price))}
          </Text>
          <Text className="text-xs text-green-600 font-medium">
            Add to Cart →
          </Text>
        </View>
      </View>

      {count > 0 && (
        <View className="absolute top-2 right-2 bg-green-500 rounded-full w-5 h-5 items-center justify-center">
          <Text className="text-white text-[10px] font-bold">{count}</Text>
        </View>
      )}
    </Pressable>
  );
}
