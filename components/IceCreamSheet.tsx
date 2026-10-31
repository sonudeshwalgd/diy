import { useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  getItemPrice,
  type Category,
  type Subcategory,
} from "../data/products";
import { useCart } from "../context/CartContext";
import Sheet from "./Sheet";

const FLAVOURS = [
  { id: "vanilla", name: "Vanilla" },
  { id: "chocolate", name: "Chocolate" },
];

const SCOOPS: Record<string, number> = {
  "ice-cream-cone": 1,
  "ice-cream-double-delight": 2,
  "ice-cream-dry-fruit": 2,
};

interface Selection {
  flavours: string[];
  quantity: number;
}

interface Props {
  visible: boolean;
  category: Category | null;
  onClose: () => void;
}

const defaultFlavours = (id: string) => {
  const count = SCOOPS[id] ?? 1;
  return Array.from({ length: count }, (_, index) =>
    index === 0 ? "vanilla" : "chocolate"
  );
};

export default function IceCreamSheet({ visible, category, onClose }: Props) {
  const { addItem, getItemQuantity } = useCart();
  const [selections, setSelections] = useState<Record<string, Selection>>({});

  if (!category) return null;

  const getSelection = (id: string): Selection =>
    selections[id] ?? {
      flavours: defaultFlavours(id),
      quantity: 1,
    };

  const updateSelection = (id: string, patch: Partial<Selection>) => {
    setSelections((prev) => ({
      ...prev,
      [id]: { ...getSelection(id), ...patch },
    }));
  };

  const handleAdd = (sub: Subcategory) => {
    const selection = getSelection(sub.id);
    const key = [...selection.flavours].sort().join("-");
    const unique = [...new Set(selection.flavours)];
    const label = unique
      .map((id) => FLAVOURS.find((f) => f.id === id)?.name ?? id)
      .join(" + ");

    addItem(
      {
        ...sub,
        id: `${sub.id}:${key}`,
        name: `${sub.name} · ${label}`,
      },
      category,
      selection.quantity
    );

    updateSelection(sub.id, { quantity: 1 });
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      sheetClassName=""
      sheetStyle={{ maxHeight: "88%" }}
    >
      <View className="px-5 pt-2 pb-3 flex-row items-center justify-between">
        <View>
          <Text className="text-xl font-sans-bold text-gray-900">
            DIY Ice Cream
          </Text>
          <Text className="text-sm text-gray-500 mt-0.5">
            Choose flavour & quantity for each item
          </Text>
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
          const scoopCount = SCOOPS[sub.id] ?? 1;
          const selection = getSelection(sub.id);
          const price = getItemPrice(sub);
          const cartKeys =
            scoopCount >= 2
              ? ["vanilla", "chocolate", "chocolate-vanilla"]
              : ["vanilla", "chocolate"];
          const inCart = cartKeys.reduce(
            (sum, key) => sum + getItemQuantity(`${sub.id}:${key}`),
            0
          );

          return (
            <View
              key={sub.id}
              className="bg-white/85 rounded-3xl mb-3 border border-amber-200 overflow-hidden"
            >
              <View className="flex-row p-3">
                <Image
                  source={sub.image ?? category.image}
                  style={{
                    width: 88,
                    height: 88,
                    borderRadius: 16,
                    backgroundColor: "#FEF3C7",
                  }}
                  resizeMode="contain"
                />

                <View className="flex-1 ml-3">
                  <Text className="text-base font-sans-bold text-gray-900">
                    {sub.name}
                  </Text>
                  <Text className="text-sm text-orange-600 font-sans-extrabold mt-0.5">
                    ₹{price}
                  </Text>
                  <Text className="text-[11px] text-gray-500 mt-1">
                    {scoopCount > 1
                      ? `Choose ${scoopCount} scoops — both same or separate`
                      : "Choose flavour"}
                  </Text>

                  {Array.from({ length: scoopCount }).map((_, slotIndex) => (
                    <View key={slotIndex} className="mt-1.5">
                      {scoopCount > 1 && (
                        <Text className="text-[10px] text-gray-400 mb-1">
                          Scoop {slotIndex + 1}
                        </Text>
                      )}
                      <View className="flex-row gap-2">
                        {FLAVOURS.map((flavour) => {
                          const active =
                            selection.flavours[slotIndex] === flavour.id;
                          return (
                            <Pressable
                              key={flavour.id}
                              onPress={() => {
                                const flavours = [...selection.flavours];
                                flavours[slotIndex] = flavour.id;
                                updateSelection(sub.id, { flavours });
                              }}
                              className={`rounded-full px-3 py-1 border ${
                                active
                                  ? "bg-amber-500 border-amber-500"
                                  : "bg-white border-amber-300"
                              }`}
                            >
                              <Text
                                className={`text-xs ${
                                  active
                                    ? "text-white font-sans-semibold"
                                    : "text-amber-700 font-sans-medium"
                                }`}
                              >
                                {flavour.name}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              <View className="flex-row items-center justify-between px-3 pb-3">
                <View className="flex-row items-center gap-2">
                  <Pressable
                    onPress={() =>
                      updateSelection(sub.id, {
                        quantity: Math.max(1, selection.quantity - 1),
                      })
                    }
                    className="w-8 h-8 rounded-full bg-gray-200 items-center justify-center"
                  >
                    <Ionicons name="remove" size={16} color="#374151" />
                  </Pressable>
                  <Text className="text-sm font-sans-bold text-gray-900 w-6 text-center">
                    {selection.quantity}
                  </Text>
                  <Pressable
                    onPress={() =>
                      updateSelection(sub.id, {
                        quantity: selection.quantity + 1,
                      })
                    }
                    className="w-8 h-8 rounded-full bg-orange-600 items-center justify-center"
                  >
                    <Ionicons name="add" size={16} color="white" />
                  </Pressable>

                  {inCart > 0 && (
                    <Text className="text-[11px] text-green-600 font-sans-medium ml-1">
                      {inCart} in cart
                    </Text>
                  )}
                </View>

                <Pressable
                  onPress={() => handleAdd(sub)}
                  className="bg-[#25D366] active:bg-[#1ebe57] rounded-xl px-4 py-2.5 flex-row items-center gap-1.5"
                >
                  <Ionicons name="cart-outline" size={16} color="white" />
                  <Text className="text-white text-sm font-sans-bold">
                    Add ₹{price * selection.quantity}
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </Sheet>
  );
}
