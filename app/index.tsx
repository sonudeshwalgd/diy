import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Linking,
  Pressable,
  Text,
  View,
} from "react-native";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { categories, combos, iceCreams, type Category, type Combo, type IceCreamItem } from "../data/products";
import CategoryCard from "../components/CategoryCard";
import SubcategorySheet from "../components/SubcategorySheet";
import ComboCard from "../components/ComboCard";
import ComboSheet from "../components/ComboSheet";
import IceCreamCard from "../components/IceCreamCard";
import IceCreamSheet from "../components/IceCreamSheet";
import FeedbackSheet from "../components/FeedbackSheet";
import CartSheet from "../components/CartSheet";
import OrderBottomSheet, { PHONE_NUMBER } from "../components/OrderBottomSheet";
import BannerCarousel from "../components/BannerCarousel";
import FloatingCartBar from "../components/FloatingCartBar";
import WifiBottomSheet from "../components/WifiBottomSheet";
import OrderHistoryModal from "../components/OrderHistoryModal";
import { useCart } from "../context/CartContext";

const OUTLET_MAPS_URL =
  "https://www.google.com/maps/place/DIY+Drinks/data=!4m2!3m1!1s0x0:0xb1c683b845157dec?sa=X&ved=1t:2428&ictx=111";

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
        <Pressable
          onPress={() => Linking.openURL(OUTLET_MAPS_URL)}
          className="flex-row items-start gap-2"
        >
          <Ionicons name="location-outline" size={18} color="#9CA3AF" />
          <View className="flex-1">
            <Text className="text-gray-300 text-sm font-medium">Visit us</Text>
            <Text className="text-gray-400 text-xs mt-1 leading-5">
              Lane Number 9A, Post Office Road,{"\n"}Graphic Era, Near Gate Number 2
            </Text>
          </View>
        </Pressable>
        <Pressable
          onPress={() => Linking.openURL(OUTLET_MAPS_URL)}
        >
          <Text className="text-blue-400 text-xs mt-2 underline">
            Open in Google Maps
          </Text>
        </Pressable>
        <Link href="/privacy" asChild>
          <Text className="text-gray-400 text-xs mt-4 underline">
            Privacy Policy
          </Text>
        </Link>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [subcatVisible, setSubcatVisible] = useState(false);
  const [selectedCombo, setSelectedCombo] = useState<Combo | null>(null);
  const [comboVisible, setComboVisible] = useState(false);
  const [selectedIceCream, setSelectedIceCream] = useState<IceCreamItem | null>(null);
  const [iceCreamVisible, setIceCreamVisible] = useState(false);
  const [cartVisible, setCartVisible] = useState(false);
  const [orderVisible, setOrderVisible] = useState(true);
  const [wifiVisible, setWifiVisible] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const { itemCount } = useCart();

  useEffect(() => {
    const timer = setTimeout(() => setOrderVisible(true), 600);
    return () => clearTimeout(timer);
  }, []);

  const handleCategoryPress = useCallback((category: Category) => {
    setSelectedCategory(category);
    setSubcatVisible(true);
  }, []);

  const handleComboPress = useCallback((combo: Combo) => {
    setSelectedCombo(combo);
    setComboVisible(true);
  }, []);

  const handleIceCreamPress = useCallback((iceCream: IceCreamItem) => {
    setSelectedIceCream(iceCream);
    setIceCreamVisible(true);
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

        <View className="flex-row items-center gap-2 mt-3">
          <Pressable
            onPress={() => setHistoryVisible(true)}
            className="flex-1 flex-row items-center justify-center gap-2 bg-purple-50 border border-purple-200 rounded-xl py-2.5"
          >
            <Ionicons name="receipt-outline" size={18} color="#7C3AED" />
            <Text className="text-purple-700 text-sm font-semibold">Order History</Text>
          </Pressable>
          <Pressable
            onPress={() => Linking.openURL(OUTLET_MAPS_URL)}
            className="flex-1 flex-row items-center justify-center gap-2 bg-amber-50 border border-amber-200 rounded-xl py-2.5"
          >
            <Ionicons name="star" size={18} color="#F59E0B" />
            <Text className="text-amber-700 text-sm font-semibold">Rate us on Google</Text>
          </Pressable>
        </View>
        <View className="flex-row items-center gap-2 mt-2">
          <Pressable
            onPress={() => setWifiVisible(true)}
            className="flex-1 flex-row items-center justify-center gap-2 bg-blue-50 border border-blue-200 rounded-xl py-2.5"
          >
            <Ionicons name="wifi" size={18} color="#2563EB" />
            <Text className="text-blue-700 text-sm font-semibold">Wi-Fi Password</Text>
          </Pressable>
          <Pressable
            onPress={() => setFeedbackVisible(true)}
            className="flex-1 flex-row items-center justify-center gap-2 bg-indigo-50 border border-indigo-200 rounded-xl py-2.5"
          >
            <Ionicons name="chatbubble-ellipses-outline" size={18} color="#4F46E5" />
            <Text className="text-indigo-700 text-sm font-semibold">Feedback</Text>
          </Pressable>
        </View>
      </View>

      {/* Scrollable content: banner + categories + footer */}
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ paddingHorizontal: 4 }}
        ListHeaderComponent={
          <View>
            <BannerCarousel onComboPress={handleComboPress} />
            {iceCreams.length > 0 && (
              <View className="mt-5">
                <View className="px-4 mb-2">
                  <Text className="text-lg font-bold text-gray-900">
                    Ice Cream
                  </Text>
                  <Text className="text-sm text-gray-500">
                    Choose your favourite flavours
                  </Text>
                </View>
                <View className="flex-row flex-wrap justify-between px-3">
                  {iceCreams.map((iceCream) => (
                    <IceCreamCard
                      key={iceCream.id}
                      iceCream={iceCream}
                      onPress={handleIceCreamPress}
                    />
                  ))}
                </View>
              </View>
            )}
            <View className="px-4 mt-5 mb-2">
              <Text className="text-lg font-bold text-gray-900">Our Menu</Text>
              <Text className="text-sm text-gray-500">Tap to add items to cart</Text>
            </View>
          </View>
        }
        ListFooterComponent={
          <View>
            {combos.length > 0 && (
              <View className="mt-5">
                <View className="px-4 mb-2">
                  <Text className="text-lg font-bold text-gray-900">
                    Combos & Meals
                  </Text>
                  <Text className="text-sm text-gray-500">
                    Save more with our combos
                  </Text>
                </View>
                <View className="flex-row flex-wrap justify-between px-3">
                  {combos.map((combo) => (
                    <ComboCard
                      key={combo.id}
                      combo={combo}
                      onPress={handleComboPress}
                    />
                  ))}
                </View>
              </View>
            )}
            <Footer />
          </View>
        }
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

      <ComboSheet
        visible={comboVisible}
        combo={selectedCombo}
        onClose={() => {
          setComboVisible(false);
          setSelectedCombo(null);
        }}
      />

      <IceCreamSheet
        visible={iceCreamVisible}
        iceCream={selectedIceCream}
        onClose={() => {
          setIceCreamVisible(false);
          setSelectedIceCream(null);
        }}
      />

      <CartSheet visible={cartVisible} onClose={() => setCartVisible(false)} />

      <OrderBottomSheet
        visible={orderVisible}
        onClose={() => setOrderVisible(false)}
      />

      <WifiBottomSheet
        visible={wifiVisible}
        onClose={() => setWifiVisible(false)}
      />

      <FeedbackSheet
        visible={feedbackVisible}
        onClose={() => setFeedbackVisible(false)}
      />

      <OrderHistoryModal
        visible={historyVisible}
        onClose={() => setHistoryVisible(false)}
      />
    </SafeAreaView>
  );
}
