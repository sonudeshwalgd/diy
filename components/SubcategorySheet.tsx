import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getItemPrice, type Category, type Subcategory } from "../data/products";
import { useCart } from "../context/CartContext";
import Sheet from "./Sheet";

interface Props {
  visible: boolean;
  category: Category | null;
  onClose: () => void;
}

export default function SubcategorySheet({ visible, category, onClose }: Props) {
  const { addItem, removeItem, getItemQuantity } = useCart();

  if (!category) return null;

  const toggle = (
    sub: Subcategory,
    variant?: { id: string; name: string; price: number }
  ) => {
    const cartId = variant ? `${sub.id}:${variant.id}` : sub.id;
    if (getItemQuantity(cartId) > 0) {
      removeItem(cartId);
    } else {
      addItem(
        variant
          ? {
              ...sub,
              id: cartId,
              name: `${sub.name} · ${variant.name}`,
              price: variant.price,
            }
          : sub,
        category,
        1
      );
    }
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      sheetClassName=""
      sheetStyle={{ maxHeight: "85%" }}
    >
      {/* Header */}
      <View className="px-5 pt-2 pb-3 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <Image
            source={category.image}
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              backgroundColor: "#F5F5F4",
            }}
            resizeMode="contain"
          />
          <View className="flex-1">
            <Text className="text-xl font-sans-bold text-gray-900">
              {category.name}
            </Text>
            <Text className="text-xs text-gray-500">
              Tap the items you want to add
            </Text>
          </View>
        </View>
        <Pressable onPress={onClose} className="p-1">
          <Ionicons name="close" size={24} color="#6B7280" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {category.subcategories.map((sub) => {
          const variants = sub.variants?.length ? sub.variants : undefined;

          if (variants) {
            return (
              <View
                key={sub.id}
                className="bg-white/80 rounded-3xl mb-3 border border-white/80 overflow-hidden"
              >
                <View className="flex-row items-center gap-3 p-3">
                  <Image
                    source={sub.image}
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 16,
                      backgroundColor: "#F5F5F4",
                    }}
                    resizeMode="contain"
                  />
                  <View className="flex-1">
                    <Text className="text-base font-sans-bold text-gray-900">
                      {sub.name}
                    </Text>
                    <Text className="text-xs text-gray-500 mt-0.5">
                      Choose a size
                    </Text>
                  </View>
                </View>

                {variants.map((v, idx) => {
                  const cartId = `${sub.id}:${v.id}`;
                  const inCart = getItemQuantity(cartId) > 0;

                  return (
                    <Pressable
                      key={v.id}
                      onPress={() => toggle(sub, v)}
                      className={`flex-row items-center justify-between px-4 py-3 ${
                        idx > 0 ? "border-t border-gray-100" : ""
                      } ${inCart ? "bg-green-50" : ""}`}
                    >
                      <View className="flex-row items-center gap-3 flex-1">
                        <Ionicons
                          name={inCart ? "checkbox" : "square-outline"}
                          size={24}
                          color={inCart ? "#16A34A" : "#9CA3AF"}
                        />
                        <Text
                          className={`text-sm ${
                            inCart
                              ? "text-gray-900 font-sans-semibold"
                              : "text-gray-600"
                          }`}
                        >
                          {v.name}
                        </Text>
                      </View>
                      <Text
                        className={`text-lg font-sans-extrabold ${
                          inCart ? "text-green-600" : "text-orange-600"
                        }`}
                      >
                        ₹{v.price}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            );
          }

          const inCart = getItemQuantity(sub.id) > 0;
          return (
            <Pressable
              key={sub.id}
              onPress={() => toggle(sub)}
              className={`flex-row items-center p-3 rounded-3xl mb-3 border ${
                inCart
                  ? "bg-emerald-50 border-emerald-400"
                  : "bg-white/80 border-white/80"
              }`}
            >
              <View className="relative">
                <Image
                  source={sub.image}
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 16,
                    backgroundColor: "#F5F5F4",
                  }}
                  resizeMode="contain"
                />
                {inCart && (
                  <View className="absolute -top-1 -right-1 bg-green-500 rounded-full w-6 h-6 items-center justify-center border-2 border-white">
                    <Ionicons name="checkmark" size={14} color="white" />
                  </View>
                )}
              </View>

              <View className="flex-1 ml-3">
                <Text
                  className={`text-base ${
                    inCart ? "text-gray-900 font-sans-bold" : "text-gray-800 font-sans-semibold"
                  }`}
                  numberOfLines={2}
                >
                  {sub.name}
                </Text>
                {inCart && (
                  <Text className="text-xs text-green-600 mt-1 font-sans-medium">
                    Added
                  </Text>
                )}
              </View>

              <View className="items-end ml-2">
                <Text
                  className={`text-xl font-sans-extrabold ${
                    inCart ? "text-green-600" : "text-orange-600"
                  }`}
                >
                  ₹{getItemPrice(sub)}
                </Text>
                <Ionicons
                  name={inCart ? "checkmark-circle" : "add-circle-outline"}
                  size={22}
                  color={inCart ? "#16A34A" : "#2563EB"}
                />
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </Sheet>
  );
}
