import { useCallback, useState } from "react";
import { FlatList, Linking, Pressable, ScrollView, Text, View } from "react-native";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { categories, combos, type Category, type Combo } from "../data/products";
import CategoryCard from "../components/CategoryCard";
import SubcategorySheet from "../components/SubcategorySheet";
import ComboCard from "../components/ComboCard";
import ComboSheet from "../components/ComboSheet";
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

// Search fallbacks — open the platform's results for "DIY Drinks Dehradun".
const ZOMATO_URL = "https://www.zomato.com/dehradun/restaurants?q=DIY%20Drinks";
const SWIGGY_URL = "https://www.swiggy.com/search?query=DIY%20Drinks";

const COMING_SOON = [
  {
    id: "brownie",
    name: "Brownie",
    emoji: "🍫",
    tagline: "Fudgy, loaded, worth the wait",
  },
  {
    id: "tehra-meesu",
    name: "Tehra Meesu",
    emoji: "🍮",
    tagline: "A sweet surprise coming up",
  },
  {
    id: "kunafa-pista",
    name: "Kunafa Pista",
    emoji: "🥥",
    tagline: "Crispy kunafa · pista cream",
  },
] as const;

function QuickPill({
  icon,
  label,
  color,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 flex-row items-center justify-center gap-1.5 bg-white/70 border border-white/80 rounded-2xl py-2.5 active:opacity-80"
      style={{
        shadowColor: "#78716C",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 1,
      }}
    >
      {icon}
      <Text className="text-[12px] font-sans-semibold" style={{ color }}>
        {label}
      </Text>
    </Pressable>
  );
}

function CODStrip() {
  return (
    <Animated.View
      entering={FadeInDown.duration(450).delay(220)}
      className="mx-4 mt-4 rounded-3xl overflow-hidden border border-emerald-200/60"
    >
      <LinearGradient
        colors={["#ECFDF5", "#D1FAE5"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View className="px-4 py-3.5 flex-row items-center gap-3">
          <View className="w-11 h-11 rounded-2xl bg-emerald-600 items-center justify-center">
            <Ionicons name="cash" size={22} color="white" />
          </View>
          <View className="flex-1">
            <Text className="text-[14px] font-sans-bold text-emerald-900">
              Cash on Delivery available everywhere
            </Text>
            <Text className="text-[11px] text-emerald-700 mt-0.5 font-sans-medium">
              Pay in cash when your order reaches you
            </Text>
          </View>
          <Ionicons name="checkmark-circle" size={22} color="#059669" />
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

function ComingSoonSection() {
  return (
    <Animated.View entering={FadeInDown.duration(450).delay(180)} className="mt-6">
      <View className="px-4 mb-3 flex-row items-center gap-2">
        <View className="w-6 h-6 rounded-full bg-orange-100 items-center justify-center">
          <Ionicons name="sparkles" size={13} color="#EA580C" />
        </View>
        <Text className="text-lg font-sans-extrabold text-stone-900 tracking-tight">
          Coming Soon
        </Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
      >
        {COMING_SOON.map((item, index) => (
          <Animated.View
            key={item.id}
            entering={FadeInDown.duration(400).delay(220 + index * 80)}
            className="w-44 rounded-3xl overflow-hidden border border-white/80"
            style={{
              shadowColor: "#78716C",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <BlurView
              intensity={70}
              tint="light"
              experimentalBlurMethod="dimezisBlurView"
            >
              <View className="bg-white/70 p-4">
                <LinearGradient
                  colors={["#FFF7ED", "#FFEDD5"]}
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 12,
                  }}
                >
                  <Text style={{ fontSize: 28 }}>{item.emoji}</Text>
                </LinearGradient>
                <Text className="text-[15px] font-sans-bold text-stone-900">
                  {item.name}
                </Text>
                <Text className="text-[11px] text-stone-500 mt-0.5 font-sans-medium leading-4">
                  {item.tagline}
                </Text>
                <View className="mt-3 self-start bg-amber-100/90 rounded-full px-2.5 py-1">
                  <Text className="text-[10px] font-sans-bold text-amber-700">
                    Coming Soon
                  </Text>
                </View>
              </View>
            </BlurView>
          </Animated.View>
        ))}
      </ScrollView>
    </Animated.View>
  );
}

function Footer() {
  return (
    <View className="mt-8 px-4 pb-10">
      <BlurView
        intensity={40}
        tint="light"
        experimentalBlurMethod="dimezisBlurView"
        className="rounded-3xl overflow-hidden"
      >
        <View className="bg-stone-900/90 rounded-3xl px-5 pt-7 pb-8">
          <View className="mb-6">
            <Text className="text-white text-2xl font-sans-extrabold tracking-tight">
              DIY Drinks
            </Text>
            <Text className="text-stone-400 text-sm font-sans-medium mt-0.5">
              Delicious food, delivered to you
            </Text>
          </View>

          {/* Order on */}
          <View className="mb-6">
            <Text className="text-stone-400 text-[11px] font-sans-bold uppercase tracking-widest mb-3">
              Order on
            </Text>
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => Linking.openURL(ZOMATO_URL)}
                className="flex-1 flex-row items-center gap-2.5 bg-white/10 rounded-2xl px-4 py-3.5 border border-white/10 active:opacity-80"
              >
                <MaterialCommunityIcons name="food" size={22} color="#E23744" />
                <View className="flex-1">
                  <Text className="text-white text-sm font-sans-bold">Zomato</Text>
                  <Text className="text-stone-400 text-[10px] font-sans-medium">
                    Tap to order
                  </Text>
                </View>
                <Ionicons name="open-outline" size={14} color="#78716C" />
              </Pressable>
              <Pressable
                onPress={() => Linking.openURL(SWIGGY_URL)}
                className="flex-1 flex-row items-center gap-2.5 bg-white/10 rounded-2xl px-4 py-3.5 border border-white/10 active:opacity-80"
              >
                <MaterialCommunityIcons name="bowl-mix" size={22} color="#FC8019" />
                <View className="flex-1">
                  <Text className="text-white text-sm font-sans-bold">Swiggy</Text>
                  <Text className="text-stone-400 text-[10px] font-sans-medium">
                    Tap to order
                  </Text>
                </View>
                <Ionicons name="open-outline" size={14} color="#78716C" />
              </Pressable>
            </View>
          </View>

          {/* Get the app */}
          <View className="mb-6">
            <Text className="text-stone-400 text-[11px] font-sans-bold uppercase tracking-widest mb-3">
              Get our app
            </Text>
            <View className="flex-row gap-3">
              <View className="flex-1 flex-row items-center gap-2.5 bg-white/5 rounded-2xl px-4 py-3.5 border border-dashed border-white/20">
                <MaterialCommunityIcons name="google-play" size={20} color="#A8A29E" />
                <View className="flex-1">
                  <Text className="text-stone-300 text-sm font-sans-semibold">
                    Play Store
                  </Text>
                  <Text className="text-stone-500 text-[10px] font-sans-medium">
                    Coming soon
                  </Text>
                </View>
                <View className="bg-amber-500/20 rounded-full px-2 py-0.5">
                  <Text className="text-amber-400 text-[9px] font-sans-bold">
                    SOON
                  </Text>
                </View>
              </View>
              <View className="flex-1 flex-row items-center gap-2.5 bg-white/5 rounded-2xl px-4 py-3.5 border border-dashed border-white/20">
                <Ionicons name="logo-apple" size={20} color="#A8A29E" />
                <View className="flex-1">
                  <Text className="text-stone-300 text-sm font-sans-semibold">
                    App Store
                  </Text>
                  <Text className="text-stone-500 text-[10px] font-sans-medium">
                    Coming soon
                  </Text>
                </View>
                <View className="bg-amber-500/20 rounded-full px-2 py-0.5">
                  <Text className="text-amber-400 text-[9px] font-sans-bold">
                    SOON
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* COD note */}
          <View className="flex-row items-center gap-2 bg-emerald-500/10 border border-emerald-400/20 rounded-2xl px-4 py-3 mb-6">
            <Ionicons name="cash-outline" size={18} color="#34D399" />
            <Text className="text-emerald-300 text-xs font-sans-semibold flex-1">
              Cash on Delivery available everywhere
            </Text>
          </View>

          {/* Address */}
          <View className="border-t border-white/10 pt-5">
            <Pressable
              onPress={() => Linking.openURL(OUTLET_MAPS_URL)}
              className="flex-row items-start gap-2"
            >
              <Ionicons name="location-outline" size={18} color="#A8A29E" />
              <View className="flex-1">
                <Text className="text-stone-200 text-sm font-sans-semibold">
                  Visit us
                </Text>
                <Text className="text-stone-400 text-xs mt-1 leading-5 font-sans-medium">
                  Lane Number 9A, Post Office Road,{"\n"}Graphic Era, Near Gate
                  Number 2
                </Text>
              </View>
            </Pressable>
            <Pressable onPress={() => Linking.openURL(OUTLET_MAPS_URL)}>
              <Text className="text-orange-400 text-xs mt-2 underline font-sans-semibold">
                Open in Google Maps
              </Text>
            </Pressable>
            <Link href="/privacy" asChild>
              <Text className="text-stone-500 text-xs mt-4 underline font-sans-medium">
                Privacy Policy
              </Text>
            </Link>
          </View>
        </View>
      </BlurView>
    </View>
  );
}

export default function HomeScreen() {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [subcatVisible, setSubcatVisible] = useState(false);
  const [selectedCombo, setSelectedCombo] = useState<Combo | null>(null);
  const [comboVisible, setComboVisible] = useState(false);
  const [cartVisible, setCartVisible] = useState(false);
  const [orderVisible, setOrderVisible] = useState(true);
  const [wifiVisible, setWifiVisible] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const { itemCount } = useCart();

  const handleCategoryPress = useCallback((category: Category) => {
    setSelectedCategory(category);
    setSubcatVisible(true);
  }, []);

  const handleComboPress = useCallback((combo: Combo) => {
    setSelectedCombo(combo);
    setComboVisible(true);
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
    <View className="flex-1 bg-stone-100">
      {/* Glass header */}
      <BlurView
        intensity={100}
        tint="light"
        experimentalBlurMethod="dimezisBlurView"
        className="absolute top-0 left-0 right-0 z-10 border-b border-white/60"
      >
        <SafeAreaView edges={["top"]} className="bg-white/50">
          <View className="px-4 py-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <View className="bg-orange-600 rounded-2xl w-10 h-10 items-center justify-center">
                  <Ionicons name="restaurant" size={18} color="white" />
                </View>
                <View>
                  <Text className="text-lg font-sans-extrabold text-stone-900 tracking-tight">
                    DIY Drinks
                  </Text>
                  <Text className="text-[11px] text-stone-500 font-sans-medium">
                    Fresh & Fast Food
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center gap-1.5">
                <Pressable
                  onPress={handleCall}
                  className="p-2.5 bg-white/70 border border-white/80 rounded-full active:opacity-80"
                >
                  <Ionicons name="call" size={18} color="#EA580C" />
                </Pressable>
                <Pressable
                  onPress={handleWhatsApp}
                  className="p-2.5 bg-white/70 border border-white/80 rounded-full active:opacity-80"
                >
                  <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
                </Pressable>
                <Pressable
                  onPress={() => setCartVisible(true)}
                  className="relative p-2.5 bg-orange-600 rounded-full active:opacity-80"
                >
                  <Ionicons name="cart-outline" size={20} color="white" />
                  {itemCount > 0 && (
                    <View className="absolute -top-0.5 -right-0.5 bg-stone-900 rounded-full w-5 h-5 items-center justify-center border-2 border-white">
                      <Text className="text-white text-[10px] font-sans-bold">
                        {itemCount}
                      </Text>
                    </View>
                  )}
                </Pressable>
              </View>
            </View>

            <View className="flex-row items-center gap-2 mt-3">
              <QuickPill
                icon={<Ionicons name="receipt-outline" size={15} color="#7C3AED" />}
                label="Order History"
                color="#7C3AED"
                onPress={() => setHistoryVisible(true)}
              />
              <QuickPill
                icon={<Ionicons name="star" size={15} color="#D97706" />}
                label="Rate us"
                color="#D97706"
                onPress={() => Linking.openURL(OUTLET_MAPS_URL)}
              />
            </View>
            <View className="flex-row items-center gap-2 mt-2">
              <QuickPill
                icon={<Ionicons name="wifi" size={15} color="#2563EB" />}
                label="Wi-Fi"
                color="#2563EB"
                onPress={() => setWifiVisible(true)}
              />
              <QuickPill
                icon={
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={15}
                    color="#4F46E5"
                  />
                }
                label="Feedback"
                color="#4F46E5"
                onPress={() => setFeedbackVisible(true)}
              />
            </View>
          </View>
        </SafeAreaView>
      </BlurView>

      {/* Spacer matching header height so content scrolls underneath */}
      <View className="h-[190]" />

      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{
          paddingHorizontal: 16,
          justifyContent: "space-between",
        }}
        ListHeaderComponent={
          <View>
            {/* Combos first — top of everything */}
            <Animated.View entering={FadeInDown.duration(450).delay(60)}>
              <View className="px-4 pt-4 mb-2 flex-row items-end justify-between">
                <View className="flex-row items-center gap-2.5">
                  <LinearGradient
                    colors={["#FB923C", "#EA580C"]}
                    style={{ width: 6, height: 26, borderRadius: 3 }}
                  />
                  <View>
                    <Text className="text-lg font-sans-extrabold text-stone-900 tracking-tight">
                      Combos & Meals
                    </Text>
                    <Text className="text-xs text-stone-500 font-sans-medium">
                      Save more with our combos
                    </Text>
                  </View>
                </View>
                <View className="bg-orange-100/80 rounded-full px-2.5 py-1">
                  <Text className="text-[10px] font-sans-bold text-orange-700">
                    BEST VALUE
                  </Text>
                </View>
              </View>
              <View className="flex-row flex-wrap justify-between px-3">
                {combos.map((combo, index) => (
                  <ComboCard
                    key={combo.id}
                    combo={combo}
                    index={index}
                    onPress={handleComboPress}
                  />
                ))}
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(450).delay(140)}>
              <BannerCarousel onComboPress={handleComboPress} />
            </Animated.View>

            <ComingSoonSection />

            <CODStrip />

            <View className="px-4 mt-6 mb-2 flex-row items-center gap-2.5">
              <LinearGradient
                colors={["#FB923C", "#EA580C"]}
                style={{ width: 6, height: 26, borderRadius: 3 }}
              />
              <View>
                <Text className="text-lg font-sans-extrabold text-stone-900 tracking-tight">
                  Our Menu
                </Text>
                <Text className="text-xs text-stone-500 font-sans-medium">
                  Tap to add items to cart
                </Text>
              </View>
            </View>
          </View>
        }
        ListFooterComponent={<Footer />}
        renderItem={({ item, index }) => (
          <CategoryCard
            category={item}
            index={index}
            onPress={handleCategoryPress}
          />
        )}
        contentContainerStyle={{ paddingBottom: 120 }}
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
    </View>
  );
}
