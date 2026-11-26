import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ViewToken,
} from "react-native";
import { Link, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import type {
  Category,
  Combo,
  Subcategory,
} from "../data/products";
import { useMenu } from "../context/MenuContext";
import CategoryCard from "../components/CategoryCard";
import ProductCard from "../components/ProductCard";
import SubcategorySheet from "../components/SubcategorySheet";
import ComboCard from "../components/ComboCard";
import ComboSheet from "../components/ComboSheet";
import FeedbackSheet from "../components/FeedbackSheet";
import CartSheet from "../components/CartSheet";
import IceCreamSheet from "../components/IceCreamSheet";
import OrderBottomSheet, { PHONE_NUMBER } from "../components/OrderBottomSheet";
import BannerCarousel from "../components/BannerCarousel";
import FloatingCartBar from "../components/FloatingCartBar";
import ActiveOrdersWidget from "../components/ActiveOrdersWidget";
import ActiveOrderDetailsSheet from "../components/ActiveOrderDetailsSheet";
import WifiBottomSheet from "../components/WifiBottomSheet";
import OrderHistoryModal from "../components/OrderHistoryModal";
import Sidebar from "../components/Sidebar";
import MenuSortSheet from "../components/MenuSortSheet";
import { useCart } from "../context/CartContext";
import { useDisabledItems } from "../context/DisabledItemsContext";
import { useActiveOrders } from "../context/ActiveOrdersContext";
import {
  getComingSoonVotes,
  getCustomer,
  getPopularItems,
  saveComingSoonVote,
  type ComingSoonVoteValue,
} from "../services/api";
import {
  GRID_GAP,
  MAX_CONTENT_WIDTH,
  PAGE_PADDING,
  useResponsiveLayout,
} from "../utils/responsive";
import { parseOrderSource } from "../utils/delivery";
import { resolveCustomerMobile } from "../utils/orderId";
import {
  endTimedActivity,
  startTimedActivity,
  trackImpression,
} from "../services/activityTracker";
import {
  MENU_SORT_OPTIONS,
  buildPopularityMap,
  categoryMatchesTag,
  getAvailableLowestPrice,
  isCategoryAvailable,
  isMenuTagSort,
  type MenuSortId,
} from "../utils/menuSort";
import { isFeatureEnabled } from "../config/featureFlags";

const OUTLET_MAPS_URL =
  "https://www.google.com/maps/place/DIY+Drinks/data=!4m2!3m1!1s0x0:0xb1c683b845157dec?sa=X&ved=1t:2428&ictx=111";

const RATE_US_URL = "https://share.google/F9VSd84NFGWRilIeX";

// Zomato outlet page; Swiggy opens search results for "DIY Drinks".
const ZOMATO_URL = "https://www.zomato.com/dehradun/diy-drinks-subhash-nagar";
const SWIGGY_URL =
  "https://www.swiggy.com/city/dehradun/diy-drinks-deh-patel-nagar-rest1456621";

type MenuItem =
  | { kind: "category"; key: string; category: Category }
  | {
      kind: "product";
      key: string;
      product: Subcategory;
      category: Category;
    };

const PRODUCT_MENU_CATEGORY_IDS = new Set(["tiramisu"]);

const buildMenuItems = (categories: Category[]): MenuItem[] =>
  categories.flatMap<MenuItem>((category) =>
    PRODUCT_MENU_CATEGORY_IDS.has(category.id)
      ? category.subcategories.map((product) => ({
          kind: "product" as const,
          key: `product:${product.id}`,
          product,
          category,
        }))
      : [
          {
            kind: "category" as const,
            key: `category:${category.id}`,
            category,
          },
        ]
  );

type ComingSoonVote = ComingSoonVoteValue;

interface ComingSoonItem {
  id: string;
  name: string;
  tagline: string;
  emoji?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

const COMING_SOON: ComingSoonItem[] = [
  {
    id: "brownie",
    name: "Brownie",
    emoji: "🍫",
    tagline: "Fudgy, loaded, worth the wait",
  },
  {
    id: "kunafa-pista",
    name: "Kunafa Pista",
    emoji: "🥥",
    tagline: "Crispy kunafa · pista cream",
  },
  {
    id: "pizza",
    name: "Pizza",
    emoji: "🍕",
    tagline: "Cheesy, fresh from the oven",
  },
  {
    id: "long-fries",
    name: "Long Fries",
    emoji: "🍟",
    tagline: "Crispy, extra-long & loaded",
  },
  {
    id: "vada-pao",
    name: "Vada Pao",
    emoji: "🥪",
    tagline: "Mumbai style · spicy & soft",
  },
  {
    id: "real-strawberry-sandwich",
    name: "Real Strawberry Sandwich",
    emoji: "🍓",
    tagline: "Fresh strawberries · soft bread",
  },
  {
    id: "real-strawberry-honey-pancake",
    name: "Real Strawberry Honey Pancake",
    emoji: "🍓",
    tagline: "Real strawberries · sweet honey drizzle",
  },
  {
    id: "momos",
    name: "Momos",
    icon: "restaurant-outline",
    tagline: "Steamed pockets · spicy chutney",
  },
  {
    id: "spring-rolls",
    name: "Spring Rolls",
    icon: "fast-food-outline",
    tagline: "Crispy rolls · spicy dip",
  },
  {
    id: "maggi",
    name: "Maggi",
    icon: "cafe-outline",
    tagline: "Comfort noodles · loaded flavour",
  },
  {
    id: "rajma-chawal",
    name: "Rajma Chawal",
    icon: "restaurant-outline",
    tagline: "Rajma curry · steamed rice",
  },
  {
    id: "kadhi-chawal",
    name: "Kadhi Chawal",
    icon: "restaurant-outline",
    tagline: "Yogurt curry · steamed rice",
  },
  {
    id: "pasta",
    name: "Pasta",
    icon: "fast-food-outline",
    tagline: "Creamy, cheesy & classic",
  },
  {
    id: "parathas",
    name: "Parathas",
    icon: "restaurant-outline",
    tagline: "Flaky, stuffed & served hot",
  },
  {
    id: "noodles",
    name: "Noodles",
    icon: "fast-food-outline",
    tagline: "Wok tossed · spicy & savoury",
  },
  {
    id: "fried-rice",
    name: "Fried Rice",
    icon: "restaurant-outline",
    tagline: "Wok fried · smoky & hearty",
  },
  {
    id: "laphing",
    name: "Laphing",
    icon: "fast-food-outline",
    tagline: "Spicy cold noodle rolls",
  },
];

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

function CODStrip({
  insideRestaurant,
  sourceLabel,
}: {
  insideRestaurant: boolean;
  sourceLabel?: string;
}) {
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
              {insideRestaurant
                ? `Cash on Delivery · No delivery fee${sourceLabel ? ` · ${sourceLabel}` : ""}`
                : "Cash on Delivery & ₹0 delivery fee above ₹149 in Graphic Era"}
            </Text>
            <Text className="text-[11px] text-emerald-700 mt-0.5 font-sans-medium">
              {insideRestaurant
                ? "Pay in cash when your order is served"
                : "Pay in cash when your order reaches you"}
            </Text>
          </View>
          <Ionicons name="checkmark-circle" size={22} color="#059669" />
        </View>
        <View className="flex-row items-center gap-2 border-t border-emerald-200/70 px-4 py-2.5">
          <Ionicons name="gift" size={16} color="#059669" />
          <Text className="text-[12px] font-sans-bold text-emerald-800 flex-1">
            5% cash back on all orders
          </Text>
          <View className="bg-emerald-600 rounded-full px-2 py-0.5">
            <Text className="text-[9px] font-sans-bold text-white">BONUS</Text>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const COMING_SOON_CARD_STEP = 220;

function ComingSoonSection() {
  const scrollRef = useRef<ScrollView>(null);
  const viewportWidth = useRef(0);
  const contentWidth = useRef(0);
  const scrollX = useRef(0);
  const [canScrollBack, setCanScrollBack] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [votes, setVotes] = useState<Record<string, ComingSoonVote>>({});

  const applyVoteSummary = useCallback(
    (
      summary: Record<
        string,
        { up: number; down: number; mine?: ComingSoonVote }
      >
    ) => {
      const mine: Record<string, ComingSoonVote> = {};
      for (const [id, entry] of Object.entries(summary)) {
        if (entry.mine) mine[id] = entry.mine;
      }
      setVotes(mine);
      AsyncStorage.setItem("diy_coming_soon_votes_v1", JSON.stringify(mine)).catch(
        () => {}
      );
    },
    []
  );

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem("diy_coming_soon_votes_v1")
      .then((raw) => {
        if (!raw || !active) return;
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          setVotes(parsed as Record<string, ComingSoonVote>);
        }
      })
      .catch(() => {});

    getComingSoonVotes()
      .then((data) => {
        if (active) applyVoteSummary(data.votes);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [applyVoteSummary]);

  const handleVote = (id: string, value: ComingSoonVote) => {
    const nextValue = votes[id] === value ? null : value;
    const nextVotes = { ...votes };
    if (nextValue) {
      nextVotes[id] = nextValue;
    } else {
      delete nextVotes[id];
    }
    setVotes(nextVotes);
    AsyncStorage.setItem("diy_coming_soon_votes_v1", JSON.stringify(nextVotes)).catch(
      () => {}
    );

    saveComingSoonVote(id, nextValue)
      .then((data) => applyVoteSummary(data.votes))
      .catch(() => {});
  };

  const updateArrows = (
    offsetX: number,
    totalWidth: number,
    layoutWidth: number
  ) => {
    scrollX.current = offsetX;
    setCanScrollBack(offsetX > 8);
    setHasMore(offsetX + layoutWidth < totalWidth - 8);
  };

  const scrollByCards = (direction: -1 | 1) => {
    const maxOffset = Math.max(0, contentWidth.current - viewportWidth.current);
    const nextOffset = Math.min(
      maxOffset,
      Math.max(0, scrollX.current + direction * COMING_SOON_CARD_STEP)
    );
    scrollRef.current?.scrollTo({ x: nextOffset, animated: true });
  };

  return (
    <Animated.View entering={FadeInDown.duration(450).delay(180)} className="mt-6">
      <View className="px-4 mb-3 flex-row items-center gap-2">
        <View className="w-6 h-6 rounded-full bg-orange-100 items-center justify-center">
          <Ionicons name="sparkles" size={13} color="#EA580C" />
        </View>
        <Text className="text-lg font-sans-extrabold text-stone-900 tracking-tight">
          Coming Soon
        </Text>
        <View className="ml-auto flex-row items-center gap-1 bg-orange-50 border border-orange-200 rounded-full px-2.5 py-1">
          <Ionicons name="arrow-back" size={11} color="#C2410C" />
          <Text className="text-[10px] font-sans-bold text-orange-700">Swipe</Text>
          <Ionicons name="arrow-forward" size={11} color="#C2410C" />
        </View>
      </View>
      <View className="relative">
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onLayout={(event) => {
            viewportWidth.current = event.nativeEvent.layout.width;
            updateArrows(scrollX.current, contentWidth.current, viewportWidth.current);
          }}
          onContentSizeChange={(width) => {
            contentWidth.current = width;
            updateArrows(scrollX.current, width, viewportWidth.current);
          }}
          onScroll={(event) => {
            const { contentOffset, contentSize, layoutMeasurement } =
              event.nativeEvent;
            updateArrows(
              contentOffset.x,
              contentSize.width,
              layoutMeasurement.width
            );
          }}
          contentContainerStyle={{ paddingLeft: 16, paddingRight: 56, gap: 12 }}
        >
          {COMING_SOON.map((item, index) => (
            <Animated.View
              key={item.id}
              entering={FadeInDown.duration(400).delay(220 + index * 80)}
              className="w-52 rounded-3xl overflow-hidden border border-white/80"
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
                    {item.emoji ? (
                      <Text style={{ fontSize: 28 }}>{item.emoji}</Text>
                    ) : (
                      <Ionicons
                        name={item.icon ?? "restaurant-outline"}
                        size={28}
                        color="#EA580C"
                      />
                    )}
                  </LinearGradient>
                  <Text className="text-[15px] font-sans-bold text-stone-900">
                    {item.name}
                  </Text>
                  <Text className="text-[11px] text-stone-500 mt-0.5 font-sans-medium leading-4">
                    {item.tagline}
                  </Text>
                  <View className="mt-3 pt-3 border-t border-stone-100 flex-row items-center">
                    <Text className="text-[10px] font-sans-extrabold uppercase tracking-wider text-stone-700">
                      Vote
                    </Text>
                    <View className="ml-1">
                      <Ionicons name="arrow-forward" size={12} color="#EA580C" />
                    </View>
                    <View className="ml-auto flex-row items-center gap-2">
                      <View className="flex-row items-center gap-1">
                        <Pressable
                          onPress={() => handleVote(item.id, "up")}
                          className="p-1.5 rounded-full bg-emerald-50 active:opacity-70"
                          accessibilityLabel={`Vote up for ${item.name}`}
                        >
                          <Ionicons
                            name={
                              votes[item.id] === "up"
                                ? "thumbs-up"
                                : "thumbs-up-outline"
                            }
                            size={17}
                            color={
                              votes[item.id] === "up" ? "#059669" : "#78716C"
                            }
                          />
                        </Pressable>
                        {votes[item.id] === "up" ? (
                          <Text className="text-[10px] font-sans-bold text-emerald-700">
                            1
                          </Text>
                        ) : null}
                      </View>
                      <View className="flex-row items-center gap-1">
                        <Pressable
                          onPress={() => handleVote(item.id, "down")}
                          className="p-1.5 rounded-full bg-red-50 active:opacity-70"
                          accessibilityLabel={`Vote down for ${item.name}`}
                        >
                          <Ionicons
                            name={
                              votes[item.id] === "down"
                                ? "thumbs-down"
                                : "thumbs-down-outline"
                            }
                            size={17}
                            color={
                              votes[item.id] === "down" ? "#DC2626" : "#78716C"
                            }
                          />
                        </Pressable>
                        {votes[item.id] === "down" ? (
                          <Text className="text-[10px] font-sans-bold text-red-600">
                            1
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  </View>
                </View>
              </BlurView>
            </Animated.View>
          ))}
        </ScrollView>
        {canScrollBack && (
          <LinearGradient
            pointerEvents="box-none"
            colors={["rgba(245,245,244,0.98)", "rgba(245,245,244,0)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: 56,
            }}
          >
            <View className="flex-1 items-center justify-end pb-4">
              <Pressable
                onPress={() => scrollByCards(-1)}
                accessibilityLabel="Scroll Coming Soon left"
                hitSlop={8}
                className="w-8 h-8 rounded-full bg-white border border-orange-200 items-center justify-center"
                style={{
                  shadowColor: "#EA580C",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.15,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <Ionicons name="chevron-back" size={17} color="#EA580C" />
              </Pressable>
            </View>
          </LinearGradient>
        )}
        {hasMore && (
          <LinearGradient
            pointerEvents="box-none"
            colors={["rgba(245,245,244,0)", "rgba(245,245,244,0.98)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              bottom: 0,
              width: 56,
            }}
          >
            <View className="flex-1 items-center justify-end pb-4">
              <Pressable
                onPress={() => scrollByCards(1)}
                accessibilityLabel="Scroll Coming Soon right"
                hitSlop={8}
                className="w-8 h-8 rounded-full bg-white border border-orange-200 items-center justify-center"
                style={{
                  shadowColor: "#EA580C",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.15,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <Ionicons name="chevron-forward" size={17} color="#EA580C" />
              </Pressable>
            </View>
          </LinearGradient>
        )}
      </View>
    </Animated.View>
  );
}

function Footer({
  insideRestaurant,
  sourceLabel,
}: {
  insideRestaurant: boolean;
  sourceLabel?: string;
}) {
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
            <View className="flex-col sm:flex-row gap-3">
              <View className="flex-row items-center gap-2.5 bg-white/5 rounded-2xl px-4 py-3.5 border border-dashed border-white/20 sm:flex-1">
                <MaterialCommunityIcons name="google-play" size={20} color="#A8A29E" />
                <View className="flex-1 min-w-0">
                  <Text className="text-stone-300 text-sm font-sans-semibold">
                    Play Store
                  </Text>
                  <Text className="text-stone-500 text-[10px] font-sans-medium">
                    Coming soon
                  </Text>
                </View>
                <View className="bg-amber-500/20 rounded-full px-2 py-0.5 shrink-0">
                  <Text className="text-amber-400 text-[9px] font-sans-bold">
                    SOON
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center gap-2.5 bg-white/5 rounded-2xl px-4 py-3.5 border border-dashed border-white/20 sm:flex-1">
                <Ionicons name="logo-apple" size={20} color="#A8A29E" />
                <View className="flex-1 min-w-0">
                  <Text className="text-stone-300 text-sm font-sans-semibold">
                    App Store
                  </Text>
                  <Text className="text-stone-500 text-[10px] font-sans-medium">
                    Coming soon
                  </Text>
                </View>
                <View className="bg-amber-500/20 rounded-full px-2 py-0.5 shrink-0">
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
              {insideRestaurant
                ? `Cash on Delivery · No delivery fee${sourceLabel ? ` · ${sourceLabel}` : ""}`
                : "Cash on Delivery & ₹0 delivery fee above ₹149 in Graphic Era"}
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
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [menuSort, setMenuSort] = useState<MenuSortId>("all");
  const [sortVisible, setSortVisible] = useState(false);
  const [popularity, setPopularity] = useState<Record<string, number>>({});
  const [coins, setCoins] = useState<number | null>(null);
  const params = useLocalSearchParams();
  const t = params.t;
  const tableParam = useMemo(() => {
    const raw = Array.isArray(t) ? t[0] : t;
    return raw?.trim();
  }, [t]);
  const queryParams = useMemo(() => {
    const extra: Record<string, string> = {};
    for (const [key, value] of Object.entries(params)) {
      if (key === "t") continue;
      const raw = Array.isArray(value) ? value[0] : value;
      if (raw !== undefined && raw !== "") extra[key] = raw;
    }
    return extra;
  }, [params]);
  const orderSource = useMemo(
    () => parseOrderSource(queryParams.utm_source, tableParam),
    [queryParams, tableParam]
  );
  const insideRestaurant = orderSource.insideRestaurant;
  const sourceLabel = orderSource.sourceLabel;
  const { itemCount } = useCart();
  const { activeOrders } = useActiveOrders();
  const { categories, combos } = useMenu();
  const menuItems = useMemo(() => buildMenuItems(categories), [categories]);
  const { isItemDisabled, isItemHidden, isComboHidden } =
    useDisabledItems("");
  const isCategoryHidden = useCallback(
    (category: Category) =>
      isItemHidden(category.id) ||
      (category.subcategories.length > 0 &&
        category.subcategories.every((sub) => isItemHidden(sub.id))),
    [isItemHidden]
  );
  const { columns } = useResponsiveLayout();

  useEffect(() => {
    let active = true;
    getPopularItems()
      .then((data) => {
        if (active) {
          setPopularity(buildPopularityMap(data.items, categories));
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [categories]);

  useEffect(() => {
    let active = true;
    resolveCustomerMobile()
      .then(async (mobile) => {
        if (!mobile || !active) {
          if (active) setCoins(null);
          return;
        }
        try {
          const customer = await getCustomer(mobile);
          if (active) setCoins(customer.totalCoins);
        } catch {
          if (active) setCoins(null);
        }
      })
      .catch(() => {
        if (active) setCoins(null);
      });
    return () => {
      active = false;
    };
  }, [cartVisible, historyVisible]);

  const orderedMenuItems = useMemo(() => {
    let items = menuItems.filter((item) =>
      item.kind === "product"
        ? !isItemHidden(item.product.id)
        : !isCategoryHidden(item.category)
    );

    if (menuSort === "available") {
      const isAvailable = (item: MenuItem) =>
        item.kind === "product"
          ? !isItemDisabled(item.product.id)
          : isCategoryAvailable(item.category, isItemDisabled);
      items = [
        ...items.filter(isAvailable),
        ...items.filter((item) => !isAvailable(item)),
      ];
    } else if (isMenuTagSort(menuSort)) {
      const matches = (item: MenuItem) =>
        categoryMatchesTag(item.category, menuSort);
      items = [
        ...items.filter(matches),
        ...items.filter((item) => !matches(item)),
      ];
    }

    if (menuSort === "cheap") {
      items.sort(
        (a, b) =>
          getAvailableLowestPrice(a.category, isItemDisabled) -
          getAvailableLowestPrice(b.category, isItemDisabled)
      );
    } else if (menuSort === "popular") {
      items.sort(
        (a, b) =>
          (popularity[b.category.id] ?? 0) - (popularity[a.category.id] ?? 0)
      );
    }

    return items;
  }, [
    isCategoryHidden,
    isItemDisabled,
    isItemHidden,
    menuItems,
    menuSort,
    popularity,
  ]);

  const visibleCombos = useMemo(
    () => combos.filter((combo) => !isComboHidden(combo.id)),
    [combos, isComboHidden]
  );

  const activeSort =
    MENU_SORT_OPTIONS.find((option) => option.id === menuSort) ??
    MENU_SORT_OPTIONS[0];

  const viewabilityConfig = useMemo(
    () => ({
      itemVisiblePercentThreshold: 60,
      minimumViewTime: 800,
    }),
    []
  );
  const lastScrollBucketRef = useRef(0);

  const onViewableItemsChanged = useMemo(
    () => ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      for (const viewable of viewableItems) {
        const item = viewable.item as MenuItem | undefined;
        if (!item) continue;
        if (item.kind === "category") {
          trackImpression({
            type: "category_impression",
            name: item.category.name,
            categoryId: item.category.id,
            categoryName: item.category.name,
            position: viewable.index ?? undefined,
            dedupeKey: `category_impression:${item.category.id}`,
          });
        } else {
          trackImpression({
            type: "product_impression",
            name: item.product.name,
            categoryId: item.category.id,
            categoryName: item.category.name,
            productId: item.product.id,
            productName: item.product.name,
            price: item.product.price ?? item.product.variants?.[0]?.price,
            position: viewable.index ?? undefined,
            dedupeKey: `product_impression:${item.product.id}`,
          });
        }
      }
    },
    []
  );

  const handleMenuScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      const scrollable = contentSize.height - layoutMeasurement.height;
      if (scrollable <= 0) return;
      const depth = Math.max(0, Math.min(100, Math.round((contentOffset.y / scrollable) * 100)));
      const bucket = depth >= 100 ? 100 : depth >= 75 ? 75 : depth >= 50 ? 50 : depth >= 25 ? 25 : 0;
      if (bucket <= lastScrollBucketRef.current) return;
      lastScrollBucketRef.current = bucket;
      trackImpression({
        type: "scroll_depth",
        name: `Scrolled ${bucket}%`,
        scrollDepth: bucket,
        dedupeKey: `scroll_depth:${bucket}`,
      });
    },
    []
  );

  const handleCategoryPress = useCallback((category: Category) => {
    startTimedActivity(`category:${category.id}`, "category_open", {
      name: category.name,
      categoryId: category.id,
      categoryName: category.name,
    });
    setSelectedCategory(category);
    setSubcatVisible(true);
  }, []);

  const handleProductPress = useCallback((category: Category, product: Subcategory) => {
    startTimedActivity(`product:${product.id}`, "product_view", {
      name: product.name,
      categoryId: category.id,
      categoryName: category.name,
      productId: product.id,
      productName: product.name,
      price: product.price ?? product.variants?.[0]?.price,
    });
    trackImpression({
      type: "product_impression",
      name: product.name,
      categoryId: category.id,
      categoryName: category.name,
      productId: product.id,
      productName: product.name,
      price: product.price ?? product.variants?.[0]?.price,
      dedupeKey: `product_impression:${product.id}`,
    });
    setSelectedCategory(category);
    setSubcatVisible(true);
  }, []);

  const closeCategorySheet = useCallback(() => {
    if (selectedCategory) {
      endTimedActivity(`category:${selectedCategory.id}`, "category_close", {
        name: selectedCategory.name,
        categoryId: selectedCategory.id,
        categoryName: selectedCategory.name,
      });
    }
    setSubcatVisible(false);
    setSelectedCategory(null);
  }, [selectedCategory]);

  const handleComboPress = useCallback((combo: Combo) => {
    startTimedActivity(`combo:${combo.id}`, "combo_open", {
      name: combo.name,
      productId: `combo:${combo.id}`,
      productName: combo.name,
    });
    setSelectedCombo(combo);
    setComboVisible(true);
  }, []);

  const closeComboSheet = useCallback(() => {
    if (selectedCombo) {
      endTimedActivity(`combo:${selectedCombo.id}`, "combo_close", {
        name: selectedCombo.name,
        productId: `combo:${selectedCombo.id}`,
        productName: selectedCombo.name,
      });
    }
    setComboVisible(false);
    setSelectedCombo(null);
  }, [selectedCombo]);

  const handleWhatsApp = () => {
    const sourceLine = orderSource.tableNumber
      ? `🍽️ *Table No:* ${orderSource.tableNumber}`
      : orderSource.counterNumber
        ? `🔢 *Counter No:* ${orderSource.counterNumber}`
        : null;
    const message = sourceLine
      ? `Hi, I'd like to place an order.\n\n${sourceLine}`
      : "Hi, I'd like to place an order.";
    Linking.openURL(
      `https://wa.me/${PHONE_NUMBER}?text=${encodeURIComponent(message)}`
    );
  };

  return (
    <View className="flex-1 bg-stone-100">
      {/* Glass header */}
      <BlurView
        intensity={100}
        tint="light"
        experimentalBlurMethod="dimezisBlurView"
        className="border-b border-white/60"
      >
        <SafeAreaView edges={["top"]} className="bg-white/50">
          <View
            className="px-4 pt-3 pb-2"
            style={{
              width: "100%",
              maxWidth: MAX_CONTENT_WIDTH,
              alignSelf: "center",
            }}
          >
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
                {coins !== null && (
                  <Pressable
                    onPress={() => setHistoryVisible(true)}
                    className="px-2.5 py-2 bg-amber-50 border border-amber-200 rounded-full active:opacity-80"
                    accessibilityLabel={`Your coins: ${coins}`}
                  >
                    <Text className="text-amber-700 text-[13px] font-sans-extrabold">
                      ₹{coins}
                    </Text>
                  </Pressable>
                )}
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
                <Pressable
                  onPress={() => setSidebarVisible(true)}
                  className="p-2.5 bg-white/70 border border-white/80 rounded-full active:opacity-80"
                  accessibilityLabel="Open orders"
                >
                  <Ionicons name="menu" size={20} color="#EA580C" />
                </Pressable>
              </View>
            </View>

          </View>
        </SafeAreaView>
      </BlurView>

      <FlatList
        key={`menu-${columns}`}
        data={orderedMenuItems}
        keyExtractor={(item) => item.key}
        numColumns={columns}
        columnWrapperStyle={{
          paddingHorizontal: PAGE_PADDING,
          gap: GRID_GAP,
          alignItems: "stretch",
        }}
        style={{
          width: "100%",
          maxWidth: MAX_CONTENT_WIDTH,
          alignSelf: "center",
        }}
        ListHeaderComponent={
          <View>
            <View className="px-4 pt-2">
              {(isFeatureEnabled("menu.showOrderHistory") ||
                isFeatureEnabled("menu.showRateUs")) && (
                <View className="flex-row items-center gap-2">
                  {isFeatureEnabled("menu.showOrderHistory") && (
                    <QuickPill
                      icon={
                        <Ionicons name="receipt-outline" size={15} color="#7C3AED" />
                      }
                      label="Order History"
                      color="#7C3AED"
                      onPress={() => setHistoryVisible(true)}
                    />
                  )}
                  {isFeatureEnabled("menu.showRateUs") && (
                    <QuickPill
                      icon={<Ionicons name="star" size={15} color="#D97706" />}
                      label="Rate us"
                      color="#D97706"
                      onPress={() => Linking.openURL(RATE_US_URL)}
                    />
                  )}
                </View>
              )}
              {(isFeatureEnabled("menu.showWifi") ||
                isFeatureEnabled("menu.showFeedback")) && (
                <View className="flex-row items-center gap-2 mt-2">
                  {isFeatureEnabled("menu.showWifi") && (
                    <QuickPill
                      icon={<Ionicons name="wifi" size={15} color="#2563EB" />}
                      label="Wi-Fi"
                      color="#2563EB"
                      onPress={() => setWifiVisible(true)}
                    />
                  )}
                  {isFeatureEnabled("menu.showFeedback") && (
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
                  )}
                </View>
              )}
            </View>

            <Animated.View
              entering={FadeInDown.duration(450).delay(140)}
              style={{ marginTop: 12 }}
            >
              <BannerCarousel onComboPress={handleComboPress} />
            </Animated.View>

            <CODStrip insideRestaurant={insideRestaurant} sourceLabel={sourceLabel} />

            <View className="px-4 mt-6 mb-2 flex-row items-center justify-between gap-3">
              <View className="flex-row items-center gap-2.5 flex-1">
                <LinearGradient
                  colors={["#FB923C", "#EA580C"]}
                  style={{ width: 6, height: 26, borderRadius: 3 }}
                />
                <View>
                  <Text className="text-lg font-sans-extrabold text-stone-900 tracking-tight">
                    Our Menu
                  </Text>
                  <Text className="text-[13px] text-stone-500 font-sans-medium">
                    {menuSort === "all"
                      ? "Tap to add items to cart"
                      : activeSort.label}
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={() => setSortVisible(true)}
                className="flex-row items-center gap-1.5 bg-white/90 border border-white/80 rounded-full px-3 py-2 active:opacity-80"
              >
                <Ionicons name="options-outline" size={14} color="#EA580C" />
                <Text
                  className="text-[11px] font-sans-bold text-stone-700 max-w-[110px]"
                  numberOfLines={1}
                >
                  {activeSort.label}
                </Text>
                <Ionicons name="chevron-down" size={12} color="#A8A29E" />
              </Pressable>
            </View>
          </View>
        }
        ListFooterComponent={
          <View>
            <ComingSoonSection />
            {visibleCombos.length > 0 && (
              <Animated.View entering={FadeInDown.duration(450).delay(60)}>
                <View className="px-4 mt-6 mb-2 flex-row items-end justify-between">
                <View className="flex-row items-center gap-2.5">
                  <LinearGradient
                    colors={["#FB923C", "#EA580C"]}
                    style={{ width: 6, height: 26, borderRadius: 3 }}
                  />
                  <View>
                    <Text className="text-lg font-sans-extrabold text-stone-900 tracking-tight">
                      Combos & Meals
                    </Text>
                    <Text className="text-[13px] text-stone-500 font-sans-medium">
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
              <View
                className="flex-row flex-wrap items-stretch px-4"
                style={{ gap: GRID_GAP }}
              >
                  {visibleCombos.map((combo, index) => (
                    <ComboCard
                      key={combo.id}
                      combo={combo}
                      index={index}
                      onPress={handleComboPress}
                    />
                  ))}
                </View>
              </Animated.View>
            )}
            <Footer insideRestaurant={insideRestaurant} sourceLabel={sourceLabel} />
          </View>
        }
        renderItem={({ item, index }) =>
          item.kind === "category" ? (
            <CategoryCard
              category={item.category}
              index={index}
              onPress={handleCategoryPress}
            />
          ) : (
            <ProductCard
              product={item.product}
              category={item.category}
              index={index}
              onPress={handleProductPress}
            />
          )
        }
        contentContainerStyle={{
          paddingBottom:
            activeOrders.length > 0 ? (itemCount > 0 ? 160 : 100) : itemCount > 0 ? 110 : 120,
        }}
        showsVerticalScrollIndicator={false}
        onScroll={handleMenuScroll}
        scrollEventThrottle={200}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />

      {/* Floating bars: active orders above, cart with Place Order always visible */}
      <View
        className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-3"
        style={{ gap: 8 }}
        pointerEvents="box-none"
      >
        <ActiveOrdersWidget onOpenOrder={setSelectedOrderId} />
        <FloatingCartBar onPress={() => setCartVisible(true)} />
      </View>

      {/* Bottom sheets */}
      {selectedCategory?.id === "ice-cream" ? (
        <IceCreamSheet
          visible={subcatVisible}
          category={selectedCategory}
          onClose={closeCategorySheet}
        />
      ) : (
        <SubcategorySheet
          visible={subcatVisible}
          category={selectedCategory}
          onClose={closeCategorySheet}
        />
      )}

      <ComboSheet
        visible={comboVisible}
        combo={selectedCombo}
        onClose={closeComboSheet}
      />

      <CartSheet
        visible={cartVisible}
        onClose={() => setCartVisible(false)}
        tableNumber={orderSource.tableNumber}
        counterNumber={orderSource.counterNumber}
        sourceLabel={sourceLabel}
        queryParams={queryParams}
        insideRestaurant={insideRestaurant}
        onViewOrder={(orderId) => {
          setCartVisible(false);
          setSelectedOrderId(orderId);
        }}
      />

      <OrderBottomSheet
        visible={orderVisible}
        onClose={() => setOrderVisible(false)}
        tableNumber={orderSource.tableNumber}
        counterNumber={orderSource.counterNumber}
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

      <MenuSortSheet
        visible={sortVisible}
        value={menuSort}
        onChange={setMenuSort}
        onClose={() => setSortVisible(false)}
      />

      <ActiveOrderDetailsSheet
        visible={!!selectedOrderId}
        orderId={selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
      />

      <Sidebar
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        onOpenOrder={setSelectedOrderId}
        onOpenOrderHistory={() => setHistoryVisible(true)}
        onOpenWifi={() => setWifiVisible(true)}
        onOpenFeedback={() => setFeedbackVisible(true)}
        onRateUs={() => void Linking.openURL(RATE_US_URL)}
      />
    </View>
  );
}
