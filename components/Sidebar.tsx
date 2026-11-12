import { Image, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { SlideInRight } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import type { Category } from "../data/products";
import { PHONE_NUMBER } from "./OrderBottomSheet";

const CONTACT_NUMBER = `+${PHONE_NUMBER.slice(0, 2)} ${PHONE_NUMBER.slice(
  2,
  7
)} ${PHONE_NUMBER.slice(7)}`;

const SIDEBAR_ITEMS = [
  { id: "strawberry-glass", label: "Strawberry Chocolate Glass" },
  { id: "strawberry-crusher", label: "Strawberry Chocolate Crusher" },
  { id: "waffles", label: "Waffles" },
  { id: "pancakes", label: "Pancakes" },
  { id: "tiramisu", label: "Tiramisu" },
  { id: "churros", label: "Churros" },
  { id: "ice-cream", label: "Ice Cream" },
  { id: "mojitos", label: "Mojitos" },
  { id: "hot-chocolate", label: "Hot Chocolate" },
  { id: "cold-coffee", label: "Cold Coffee" },
  { id: "corn", label: "Corn" },
  { id: "french-fries", label: "French Fries" },
  { id: "sandwiches", label: "Sandwiches" },
  { id: "burgers", label: "Burgers" },
];

interface Props {
  visible: boolean;
  categories: Category[];
  onClose: () => void;
  onSelectCategory: (category: Category) => void;
}

export default function Sidebar({
  visible,
  categories,
  onClose,
  onSelectCategory,
}: Props) {
  const router = useRouter();
  const items = SIDEBAR_ITEMS.map((item) => ({
    ...item,
    category: categories.find((category) => category.id === item.id),
  })).filter(
    (item): item is typeof item & { category: Category } =>
      Boolean(item.category)
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 flex-row justify-end">
        <Pressable
          onPress={onClose}
          className="absolute inset-0 bg-black/30"
          accessibilityLabel="Close menu"
        />
        <Animated.View
          entering={SlideInRight.duration(240)}
          className="h-full bg-stone-50"
          style={{
            width: 340,
            maxWidth: "86%",
            backgroundColor: "#FAFAF9",
            shadowColor: "#000",
            shadowOffset: { width: -6, height: 0 },
            shadowOpacity: 0.16,
            shadowRadius: 18,
            elevation: 12,
          }}
        >
          <SafeAreaView
            edges={["top", "bottom"]}
            className="flex-1 bg-stone-50"
            style={{ flex: 1, backgroundColor: "#FAFAF9" }}
          >
            <View
              className="px-5 pt-2 pb-4 flex-row items-center justify-between border-b border-stone-100"
              style={{ flexShrink: 0 }}
            >
              <View>
                <Text className="text-xl font-sans-extrabold text-stone-900 tracking-tight">
                  Categories
                </Text>
                <Text className="text-xs text-stone-500 font-sans-medium mt-0.5">
                  Jump to a menu section
                </Text>
              </View>
              <Pressable
                onPress={onClose}
                className="p-2 rounded-full bg-stone-100 active:opacity-80"
                accessibilityLabel="Close sidebar"
              >
                <Ionicons name="close" size={20} color="#57534E" />
              </Pressable>
            </View>

            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
              showsVerticalScrollIndicator
            >
              {items.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => onSelectCategory(item.category)}
                  className="flex-row items-center gap-3 px-3 py-2.5 mb-2 rounded-2xl bg-stone-50 border border-stone-100 active:opacity-80"
                >
                  <View className="w-10 h-10 rounded-xl overflow-hidden bg-stone-100 items-center justify-center">
                    {item.category.image ? (
                      <Image
                        source={item.category.image}
                        style={{ width: "100%", height: "100%" }}
                        resizeMode="contain"
                      />
                    ) : (
                      <Ionicons
                        name="restaurant-outline"
                        size={18}
                        color="#A8A29E"
                      />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-[15px] font-sans-semibold text-stone-800">
                      {item.label}
                    </Text>
                    <Text className="text-[11px] text-stone-500 font-sans-medium mt-0.5">
                      {item.category.subcategories.length} items
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#A8A29E" />
                </Pressable>
              ))}
            </ScrollView>

            <View
              className="border-t border-stone-100 px-5 pt-4 pb-2"
              style={{ flexShrink: 0 }}
            >
              <Text className="text-base font-sans-extrabold text-stone-900">
                DIY Drinks
              </Text>
              <View className="flex-row items-center gap-2 mt-2">
                <Ionicons name="call-outline" size={14} color="#EA580C" />
                <Text className="text-xs text-stone-600 font-sans-medium">
                  {CONTACT_NUMBER}
                </Text>
              </View>
              <View className="flex-row items-start gap-2 mt-2">
                <Ionicons name="location-outline" size={14} color="#EA580C" />
                <Text className="text-xs text-stone-600 font-sans-medium leading-5 flex-1">
                  Lane Number 9A, Post Office Road, Graphic Era, Near Gate
                  Number 2
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  onClose();
                  setTimeout(() => {
                    router.push("/items/disabled" as Href);
                  }, 220);
                }}
                className="flex-row items-center gap-2 mt-4 py-2.5 px-3 rounded-xl bg-orange-50 border border-orange-100 active:opacity-80"
                accessibilityLabel="Manage item availability"
              >
                <Ionicons name="lock-closed-outline" size={14} color="#EA580C" />
                <Text className="text-xs text-orange-700 font-sans-semibold flex-1">
                  Staff · Item availability
                </Text>
                <Ionicons name="chevron-forward" size={14} color="#EA580C" />
              </Pressable>
            </View>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}
