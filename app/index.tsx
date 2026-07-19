import { useCallback, useEffect, useState } from "react";
import { FlatList, Linking, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { categories, type Category } from "../data/products";
import CategoryCard from "../components/CategoryCard";
import SubcategorySheet from "../components/SubcategorySheet";
import CartSheet from "../components/CartSheet";
import OrderBottomSheet, { PHONE_NUMBER } from "../components/OrderBottomSheet";
import BannerCarousel from "../components/BannerCarousel";
import { useCart } from "../context/CartContext";

export default function HomeScreen() {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [subcatVisible, setSubcatVisible] = useState(false);
  const [cartVisible, setCartVisible] = useState(false);
  const [orderVisible, setOrderVisible] = useState(true);
  const { itemCount } = useCart();

  useEffect(() => {
    const timer = setTimeout(() => setOrderVisible(true), 600);
    return () => clearTimeout(timer);
  }, []);

  const handleCategoryPress = useCallback((category: Category) => {
    setSelectedCategory(category);
    setSubcatVisible(true);
  }, []);

  const handleCall = () => {
    Linking.openURL(`tel:${PHONE_NUMBER}`);
  };

  const handleWhatsApp = () => {
    Linking.openURL(
      `https://wa.me/${PHONE_NUMBER}?text=${encodeURIComponent("Hi, I'd like to place an order.")}`
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-3 border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-bold text-gray-900">DIY Shop</Text>
            <Text className="text-sm text-gray-500 mt-0.5">Order fresh food</Text>
          </View>

          <View className="flex-row items-center gap-1">
            <Pressable onPress={handleCall} className="p-2">
              <Ionicons name="call" size={22} color="#16A34A" />
            </Pressable>
            <Pressable onPress={handleWhatsApp} className="p-2">
              <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
            </Pressable>
            <Pressable
              onPress={() => setCartVisible(true)}
              className="relative p-2"
            >
              <Ionicons name="cart-outline" size={24} color="#2563EB" />
              {itemCount > 0 && (
                <View className="absolute -top-0.5 -right-0.5 bg-red-500 rounded-full w-5 h-5 items-center justify-center">
                  <Text className="text-white text-[10px] font-bold">
                    {itemCount}
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>
      </View>

      {/* Scrollable content: banner + categories */}
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View>
            <BannerCarousel />
            <View className="px-4 mt-5 mb-2">
              <Text className="text-lg font-bold text-gray-900">Our Menu</Text>
              <Text className="text-sm text-gray-500">Tap to view items</Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <CategoryCard category={item} onPress={handleCategoryPress} />
        )}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      />

      {/* Bottom sheets */}
      <SubcategorySheet
        visible={subcatVisible}
        category={selectedCategory}
        onClose={() => {
          setSubcatVisible(false);
          setSelectedCategory(null);
        }}
      />

      <CartSheet visible={cartVisible} onClose={() => setCartVisible(false)} />

      <OrderBottomSheet
        visible={orderVisible}
        onClose={() => setOrderVisible(false)}
      />
    </SafeAreaView>
  );
}
