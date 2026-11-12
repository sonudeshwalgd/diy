import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  getItemPrice,
  type Category,
  type Subcategory,
  type Variant,
} from "../data/products";
import { useCart } from "../context/CartContext";
import Sheet from "./Sheet";

interface Props {
  visible: boolean;
  category: Category | null;
  onClose: () => void;
}

export default function SubcategorySheet({ visible, category, onClose }: Props) {
  if (!category) return null;

  return (
    <SubcategorySheetContent
      key={category.id}
      visible={visible}
      category={category}
      onClose={onClose}
    />
  );
}

function SubcategorySheetContent({
  visible,
  category,
  onClose,
}: {
  visible: boolean;
  category: Category;
  onClose: () => void;
}) {
  const { addItem, decrement, getItemQuantity } = useCart();

  const addDirectItem = (sub: Subcategory, variant?: Variant) => {
    if (!variant) {
      addItem(sub, category, 1);
      return;
    }

    addItem(
      {
        ...sub,
        id: `${sub.id}:${variant.id}`,
        name: `${sub.name} · ${variant.name}`,
        price: variant.price,
      },
      category,
      1
    );
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      sheetClassName=""
      sheetStyle={{ maxHeight: "85%" }}
    >
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
              Tap + to add items directly to the cart
            </Text>
          </View>
        </View>
        <Pressable onPress={onClose} className="p-1">
          <Ionicons name="close" size={24} color="#6B7280" />
        </Pressable>
      </View>

      <ScrollView
        style={{ flexShrink: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
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
                      {sub.variantLabel ?? "Choose a size"}
                    </Text>
                  </View>
                </View>

                {variants.map((v, idx) => {
                  const cartId = `${sub.id}:${v.id}`;
                  const quantity = getItemQuantity(cartId);

                  return (
                    <View
                      key={v.id}
                      className={`flex-row items-center px-4 py-3 ${
                        idx > 0 ? "border-t border-gray-100" : ""
                      } ${quantity > 0 ? "bg-green-50" : ""}`}
                    >
                      <View className="flex-1">
                        <Text
                          className={`text-sm ${
                            quantity > 0
                              ? "text-gray-900 font-sans-semibold"
                              : "text-gray-600"
                          }`}
                        >
                          {v.name}
                        </Text>
                      </View>
                      <Text className="text-base font-sans-extrabold text-orange-600 mr-3">
                        ₹{v.price}
                      </Text>
                      <QuantityControl
                        quantity={quantity}
                        onDecrease={() => decrement(cartId)}
                        onIncrease={() => addDirectItem(sub, v)}
                      />
                    </View>
                  );
                })}
              </View>
            );
          }

          const quantity = getItemQuantity(sub.id);

          return (
            <View
              key={sub.id}
              className={`flex-row items-center p-3 rounded-3xl mb-3 border ${
                quantity > 0
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
                {quantity > 0 && (
                  <View className="absolute -top-1 -right-1 bg-green-500 rounded-full min-w-6 h-6 px-1 items-center justify-center border-2 border-white">
                    <Text className="text-white text-[10px] font-sans-bold">
                      {quantity}
                    </Text>
                  </View>
                )}
              </View>

              <View className="flex-1 ml-3">
                <Text
                  className={`text-base ${
                    quantity > 0
                      ? "text-gray-900 font-sans-bold"
                      : "text-gray-800 font-sans-semibold"
                  }`}
                  numberOfLines={2}
                >
                  {sub.name}
                </Text>
              </View>

              <View className="items-end ml-2">
                <Text className="text-lg font-sans-extrabold text-orange-600 mb-1.5">
                  ₹{getItemPrice(sub)}
                </Text>
                <QuantityControl
                  quantity={quantity}
                  onDecrease={() => decrement(sub.id)}
                  onIncrease={() => addDirectItem(sub)}
                />
              </View>
            </View>
          );
        })}
      </ScrollView>
    </Sheet>
  );
}

function QuantityControl({
  quantity,
  onDecrease,
  onIncrease,
}: {
  quantity: number;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  if (quantity === 0) {
    return (
      <Pressable
        onPress={onIncrease}
        className="w-9 h-9 rounded-full border border-orange-500 items-center justify-center"
      >
        <Ionicons name="add" size={18} color="#EA580C" />
      </Pressable>
    );
  }

  return (
    <View className="flex-row items-center gap-2">
      <Pressable
        onPress={onDecrease}
        className="w-8 h-8 rounded-full bg-gray-200 items-center justify-center"
      >
        <Ionicons name="remove" size={16} color="#374151" />
      </Pressable>
      <Text className="text-sm font-sans-bold text-gray-900 w-5 text-center">
        {quantity}
      </Text>
      <Pressable
        onPress={onIncrease}
        className="w-8 h-8 rounded-full bg-orange-600 items-center justify-center"
      >
        <Ionicons name="add" size={16} color="white" />
      </Pressable>
    </View>
  );
}
