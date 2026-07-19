import { useCallback, useEffect, useState } from "react";
import { FlatList, Linking, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { categories, type Category } from "../data/products";
import CategoryCard from "../components/CategoryCard";
import SubcategorySheet from "../components/SubcategorySheet";
import CartSheet from "../components/CartSheet";
import OrderBottomSheet, { PHONE_NUMBER } from "../components/OrderBottomSheet";
import BannerCarousel from "../components/BannerCarousel";
import FloatingCartBar from "../components/FloatingCartBar";
import { useCart } from "../context/CartContext";

function Footer() {
  return (
    <View className="bg-gray-900 mt-4 px-5 pt-8 pb-10">
      <View className="mb-6">
        <Text className="text-white text-xl font-bold mb-1">DIY Shop</Text>
        <Text className="text-gray-400 text-sm">Delicious food, delivered to you</Text>
      </View>

      {/* Available on */}
      <View className="mb-6">
        <Text className="text-gray-300 text-xs font-semibold uppercase tracking-wider mb-3">
          Order on
        </Text>
        <View className="flex-row gap-3">
          <View className="flex-row items-center gap-2 bg-white/10 rounded-xl px-4 py-3 flex-1">
            <MaterialCommunityIcons name="food" size={20} color="#FC8019" />
            <View>
              <Text className="text-white text-sm font-semibold">Zomato</Text>
              <Text className="text-gray-400 text-[10px]">Available now</Text>
            </View>
          </View>
          <View className="flex-row items-center gap-2 bg-white/10 rounded-xl px-4 py-3 flex-1">
            <MaterialCommunityIcons name="bowl-mix" size={20} color="#FC8019" />
            <View>
              <Text className="text-white text-sm font-semibold">Swiggy</Text>
              <Text className="text-gray-400 text-[10px]">Available now</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Get the app */}
      <View className="mb-6">
        <Text className="text-gray-300 text-xs font-semibold uppercase tracking-wider mb-3">
          Get our app
        </Text>
        <View className="flex-row gap-3">
          <Pressable
            onPress={() => Linking.openURL("https://play.google.com/store")}
            className="flex-row items-center gap-2 bg-white/10 rounded-xl px-4 py-3 flex-1"
          >
            <MaterialCommunityIcons name="google-play" size={20} color="#FFFFFF" />
            <View>
              <Text className="text-white text-sm font-semibold">Play Store</Text>
              <Text className="text-gray-400 text-[10px]">Android</Text>
            </View>
          </Pressable>
          <Pressable
            onPress={() => Linking.openURL("https://apps.apple.com")}
            className="flex-row items-center gap-2 bg-white/10 rounded-xl px-4 py-3 flex-1"
          >
            <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
            <View>
              <Text className="text-white text-sm font-semibold">App Store</Text>
              <Text className="text-gray-400 text-[10px]">iOS</Text>
            </View>
          </Pressable>
        </View>
      </View>

      {/* Address */}
      <View className="border-t border-gray-700 pt-5">
        <View className="flex-row items-start gap-2">
          <Ionicons name="location-outline" size={18} color="#9CA3AF" />
          <View className="flex-1">
            <Text className="text-gray-300 text-sm font-medium">Visit us</Text>
            <Text className="text-gray-400 text-xs mt-1 leading-5">
              Lane Number 9A, Post Office Road,{"\n"}Graphic Era, Near Gate Number 2
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

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
          <View className="flex-row items-center gap-3">
            <View className="bg-green-600 rounded-xl w-10 h-10 items-center justify-center">
              <Ionicons name="restaurant" size={20} color="white" />
            </View>
            <View>
              <Text className="text-xl font-bold text-gray-900">DIY Shop</Text>
              <Text className="text-xs text-gray-500">Fresh & Fast Food</Text>
            </View>
          </View>

          <View className="flex-row items-center gap-1">
            <Pressable onPress={handleCall} className="p-2 bg-green-50 rounded-full">
              <Ionicons name="call" size={20} color="#16A34A" />
            </Pressable>
            <Pressable onPress={handleWhatsApp} className="p-2 bg-green-50 rounded-full">
              <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
            </Pressable>
            <Pressable
              onPress={() => setCartVisible(true)}
              className="relative p-2 bg-blue-50 rounded-full"
            >
              <Ionicons name="cart-outline" size={22} color="#2563EB" />
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

      {/* Scrollable content: banner + categories + footer */}
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View>
            <BannerCarousel />
            <View className="px-4 mt-5 mb-2">
              <Text className="text-lg font-bold text-gray-900">Our Menu</Text>
              <Text className="text-sm text-gray-500">Tap to add items to cart</Text>
            </View>
          </View>
        }
        ListFooterComponent={<Footer />}
        renderItem={({ item }) => (
          <CategoryCard category={item} onPress={handleCategoryPress} />
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />

      {/* Floating cart bar */}
      <FloatingCartBar onPress={() => setCartVisible(true)} />

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
