import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useActiveOrders } from "../context/ActiveOrdersContext";
import type { AdminOrder } from "../services/api";
import {
  formatOrderDate,
  formatOrderItems,
  getOrderDisplayId,
} from "../utils/orderDisplay";
import Sheet from "./Sheet";

interface Props {
  compact?: boolean;
  onOpenOrder: (orderId: string) => void;
}

function orderFetchId(order: AdminOrder): string {
  return order.orderId || order._id;
}

export default function ActiveOrdersWidget({ compact = false, onOpenOrder }: Props) {
  const { activeOrders, isSyncing, syncOrders } = useActiveOrders();
  const [listVisible, setListVisible] = useState(false);

  if (activeOrders.length === 0) return null;

  const visibleOrders = activeOrders.slice(0, 3);
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
          className="rounded-[30px] overflow-hidden border border-white/70"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.14,
            shadowRadius: 18,
            elevation: 12,
          }}
        >
          <View className="bg-white/85 rounded-[30px] px-3.5 py-2.5">
            <View className="flex-row items-center gap-2">
              <Pressable
                onPress={() => setListVisible(true)}
                className="flex-row items-center gap-2 flex-1"
                accessibilityLabel="View active orders"
              >
                <View className="bg-emerald-100 rounded-[12px] w-8 h-8 items-center justify-center">
                  <Ionicons name="bag-handle" size={16} color="#047857" />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center gap-1.5">
                    <Text className="text-[13px] font-sans-extrabold text-stone-800">
                      Active orders
                    </Text>
                    <View className="bg-emerald-600 rounded-full min-w-5 px-1.5 py-0.5 items-center">
                      <Text className="text-[10px] font-sans-bold text-white">
                        {activeOrders.length}
                      </Text>
                    </View>
                  </View>
                  {compact && (
                    <Text className="text-[10px] text-stone-500 font-sans-medium" numberOfLines={1}>
                      {getOrderDisplayId(latest)} · {formatOrderItems(latest.items)}
                    </Text>
                  )}
                </View>
              </Pressable>

              <Pressable
                onPress={() => void syncOrders(true)}
                disabled={isSyncing}
                className="w-8 h-8 rounded-full bg-stone-100 items-center justify-center active:opacity-70"
                accessibilityLabel="Refresh active orders"
              >
                {isSyncing ? (
                  <ActivityIndicator size={14} color="#EA580C" />
                ) : (
                  <Ionicons name="refresh" size={14} color="#EA580C" />
                )}
              </Pressable>
              <Pressable
                onPress={() => setListVisible(true)}
                className="w-8 h-8 rounded-full bg-stone-100 items-center justify-center active:opacity-70"
                accessibilityLabel="Open active orders list"
              >
                <Ionicons name="chevron-forward" size={16} color="#57534E" />
              </Pressable>
            </View>

            {compact ? (
              <Pressable
                onPress={() => openOrder(latest)}
                className="mt-2 rounded-[20px] bg-white px-3 py-2 flex-row items-center gap-2 active:opacity-80"
              >
                <View className="rounded-full bg-emerald-50 px-2 py-0.5">
                  <Text className="text-[9px] font-sans-bold text-emerald-700 capitalize">
                    {latest.orderStatus}
                  </Text>
                </View>
                <Text className="text-xs font-sans-extrabold text-orange-600">
                  ₹{latest.finalAmount}
                </Text>
                <Text className="text-[9px] text-stone-400 font-sans-medium ml-auto">
                  {formatOrderDate(latest.createdAt)}
                </Text>
              </Pressable>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, marginTop: 8 }}
              >
                {visibleOrders.map((order) => (
                  <Pressable
                    key={orderFetchId(order)}
                    onPress={() => openOrder(order)}
                    className="bg-white border border-stone-100 rounded-[20px] px-3 py-2 active:opacity-80"
                    style={{ width: 230 }}
                  >
                    <View className="flex-row items-center justify-between gap-1">
                      <Text
                        className="text-[11px] font-sans-extrabold text-stone-800 flex-1"
                        numberOfLines={1}
                      >
                        {getOrderDisplayId(order)}
                      </Text>
                      <View className="bg-emerald-50 rounded-full px-1.5 py-0.5">
                        <Text className="text-[9px] font-sans-bold text-emerald-700 capitalize">
                          {order.orderStatus}
                        </Text>
                      </View>
                    </View>
                    <Text
                      className="text-[10px] text-stone-500 font-sans-medium mt-1"
                      numberOfLines={2}
                    >
                      {formatOrderItems(order.items)}
                    </Text>
                    <View className="flex-row items-center justify-between mt-1">
                      <Text className="text-sm font-sans-extrabold text-orange-600">
                        ₹{order.finalAmount}
                      </Text>
                      <Text className="text-[9px] text-stone-400 font-sans-medium">
                        {formatOrderDate(order.createdAt)}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </ScrollView>
            )}

            {activeOrders.length > 3 && (
              <Pressable
                onPress={() => setListVisible(true)}
                className="mt-2 items-center"
              >
                <Text className="text-[11px] font-sans-bold text-orange-600">
                  View all {activeOrders.length} orders
                </Text>
              </Pressable>
            )}
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
