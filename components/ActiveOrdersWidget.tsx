import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  cancelAnimation,
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useActiveOrders } from "../context/ActiveOrdersContext";
import type { AdminOrder } from "../services/api";
import {
  formatOrderDate,
  formatOrderItems,
  getOrderDisplayId,
} from "../utils/orderDisplay";
import Sheet from "./Sheet";

interface Props {
  onOpenOrder: (orderId: string) => void;
}

const PROGRESS_DURATION_MS = 10 * 60 * 1000;

function orderFetchId(order: AdminOrder): string {
  return order.orderId || order._id;
}

export default function ActiveOrdersWidget({ onOpenOrder }: Props) {
  const { activeOrders, isSyncing, syncOrders } = useActiveOrders();
  const [listVisible, setListVisible] = useState(false);
  const progress = useSharedValue(0);
  const shimmer = useSharedValue(0);
  const latestCreatedAt = activeOrders[0]?.createdAt ?? null;

  useEffect(() => {
    if (!latestCreatedAt) return;
    const createdAt = Date.parse(latestCreatedAt);
    const elapsed = Number.isFinite(createdAt)
      ? Math.max(0, Date.now() - createdAt)
      : 0;
    const initial = Math.min(1, elapsed / PROGRESS_DURATION_MS);
    const remaining = Math.max(0, PROGRESS_DURATION_MS - elapsed);

    cancelAnimation(progress);
    progress.value = initial;
    if (remaining > 0) {
      progress.value = withTiming(1, {
        duration: remaining,
        easing: Easing.linear,
      });
    }
  }, [latestCreatedAt, progress]);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1600, easing: Easing.linear }),
      -1,
      false,
    );
    return () => cancelAnimation(shimmer);
  }, [shimmer]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${Math.min(1, Math.max(0, progress.value)) * 100}%`,
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    left: `${shimmer.value * 100}%`,
  }));

  if (activeOrders.length === 0) return null;

  const latest = activeOrders[0];

  const openOrder = (order: AdminOrder) => {
    setListVisible(false);
    onOpenOrder(orderFetchId(order));
  };

  return (
    <>
      <Animated.View
        entering={FadeInDown.duration(350)}
        style={{ width: "100%", maxWidth: 640, alignSelf: "center" }}
      >
        <BlurView
          intensity={60}
          tint="light"
          experimentalBlurMethod="dimezisBlurView"
          className="rounded-[26px] overflow-hidden border border-white/70"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.14,
            shadowRadius: 16,
            elevation: 11,
          }}
        >
          <View className="bg-white/85 rounded-[26px] overflow-hidden px-3 py-2 pb-3.5 flex-row items-center gap-2">
            <Pressable
              onPress={() => setListVisible(true)}
              className="flex-row items-center gap-2 flex-1"
              accessibilityLabel="View active order details"
            >
              <View className="w-8 h-8 rounded-[12px] bg-emerald-100 items-center justify-center">
                <Ionicons name="bag-handle" size={16} color="#047857" />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-1.5">
                  <Text className="text-[12px] font-sans-extrabold text-stone-800">
                    {activeOrders.length === 1 ? "Active order" : "Active orders"}
                  </Text>
                  <View className="bg-emerald-600 rounded-full min-w-[18px] px-1 py-[1px] items-center">
                    <Text className="text-[9px] font-sans-bold text-white">
                      {activeOrders.length}
                    </Text>
                  </View>
                  <View className="bg-emerald-50 rounded-full px-1.5 py-[1px]">
                    <Text className="text-[9px] font-sans-bold text-emerald-700 capitalize">
                      {latest.orderStatus}
                    </Text>
                  </View>
                </View>
                <Text
                  className="text-[10px] text-stone-500 font-sans-medium mt-0.5"
                  numberOfLines={1}
                >
                  {getOrderDisplayId(latest)} · {formatOrderItems(latest.items)} · ₹{latest.finalAmount}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={15} color="#A8A29E" />
            </Pressable>

            <Pressable
              onPress={() => void syncOrders(true)}
              disabled={isSyncing}
              className="w-7 h-7 rounded-full bg-stone-100 items-center justify-center active:opacity-70"
              accessibilityLabel="Refresh active orders"
            >
              {isSyncing ? (
                <ActivityIndicator size={13} color="#EA580C" />
              ) : (
                <Ionicons name="refresh" size={13} color="#EA580C" />
              )}
            </Pressable>

            <View
              className="absolute bottom-1 left-3 right-3 bg-emerald-100/70 rounded-full overflow-hidden"
              style={{ height: 3 }}
              pointerEvents="none"
            >
              <Animated.View
                style={[
                  {
                    height: 3,
                    borderRadius: 999,
                    backgroundColor: "#10B981",
                  },
                  progressStyle,
                ]}
              />
              <Animated.View
                style={[
                  {
                    position: "absolute",
                    top: 0,
                    height: 3,
                    width: "35%",
                    borderRadius: 999,
                    backgroundColor: "rgba(255,255,255,0.7)",
                  },
                  shimmerStyle,
                ]}
              />
            </View>
          </View>
        </BlurView>
      </Animated.View>

      <Sheet
        visible={listVisible}
        onClose={() => setListVisible(false)}
        sheetStyle={{ maxHeight: "85%" }}
      >
        <View className="px-5 pt-2 pb-3 flex-row items-center justify-between">
          <View>
            <Text className="text-xl font-sans-extrabold text-stone-900">
              Active Orders
            </Text>
            <Text className="text-xs text-stone-500 font-sans-medium mt-0.5">
              Tap an order to view full details
            </Text>
          </View>
          <Pressable
            onPress={() => setListVisible(false)}
            className="p-1"
            accessibilityLabel="Close active orders"
          >
            <Ionicons name="close" size={24} color="#6B7280" />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {activeOrders.map((order) => (
            <Pressable
              key={orderFetchId(order)}
              onPress={() => openOrder(order)}
              className="bg-white rounded-[22px] border border-stone-100 p-3 mb-2 active:opacity-80"
            >
              <View className="flex-row items-center justify-between gap-2">
                <Text
                  className="text-sm font-sans-extrabold text-stone-800 flex-1"
                  numberOfLines={1}
                >
                  {getOrderDisplayId(order)}
                </Text>
                <View className="bg-emerald-50 rounded-full px-2 py-0.5">
                  <Text className="text-[10px] font-sans-bold text-emerald-700 capitalize">
                    {order.orderStatus}
                  </Text>
                </View>
              </View>
              <Text className="text-xs text-stone-500 font-sans-medium mt-1">
                {formatOrderItems(order.items)}
              </Text>
              <View className="flex-row items-center justify-between mt-2">
                <Text className="text-sm font-sans-extrabold text-orange-600">
                  ₹{order.finalAmount}
                </Text>
                <Text className="text-[10px] text-stone-400 font-sans-medium">
                  {formatOrderDate(order.createdAt)}
                </Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </Sheet>
    </>
  );
}
