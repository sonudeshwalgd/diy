import { useEffect, type ReactNode } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { SlideInRight } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useActiveOrders } from "../context/ActiveOrdersContext";
import type { AdminOrder } from "../services/api";
import {
  formatOrderDate,
  formatOrderItems,
  getOrderDisplayId,
} from "../utils/orderDisplay";
import { PHONE_NUMBER } from "./OrderBottomSheet";
import { isFeatureEnabled } from "../config/featureFlags";

const CONTACT_NUMBER = `+${PHONE_NUMBER.slice(0, 2)} ${PHONE_NUMBER.slice(
  2,
  7
)} ${PHONE_NUMBER.slice(7)}`;
const APP_VERSION = Constants.expoConfig?.version ?? "1.2.3";

interface Props {
  visible: boolean;
  onClose: () => void;
  onOpenOrder: (orderId: string) => void;
  onOpenOrderHistory: () => void;
  onOpenWifi: () => void;
  onOpenFeedback: () => void;
  onRateUs: () => void;
}

function SidebarAction({
  icon,
  label,
  color,
  onPress,
}: {
  icon: ReactNode;
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 flex-row items-center gap-2 bg-white rounded-2xl border border-stone-100 px-3 py-3 active:opacity-80"
      style={{
        shadowColor: "#78716C",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 1,
      }}
    >
      <View
        className="w-8 h-8 rounded-xl items-center justify-center"
        style={{ backgroundColor: `${color}1A` }}
      >
        {icon}
      </View>
      <Text
        className="text-[12px] font-sans-bold text-stone-700 flex-1"
        numberOfLines={2}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function Sidebar({
  visible,
  onClose,
  onOpenOrder,
  onOpenOrderHistory,
  onOpenWifi,
  onOpenFeedback,
  onRateUs,
}: Props) {
  const { activeOrders, isSyncing, lastSyncedAt, syncOrders } =
    useActiveOrders();

  useEffect(() => {
    if (visible) void syncOrders(true);
  }, [visible, syncOrders]);

  const showOrderHistory = isFeatureEnabled("menu.showOrderHistory");
  const showRateUs = isFeatureEnabled("menu.showRateUs");
  const showWifi = isFeatureEnabled("menu.showWifi");
  const showFeedback = isFeatureEnabled("menu.showFeedback");

  const runAction = (action: () => void) => {
    onClose();
    action();
  };

  const renderOrder = (order: AdminOrder) => (
    <Pressable
      key={order.orderId || order._id}
      onPress={() => onOpenOrder(order.orderId || order._id)}
      className="bg-white rounded-[22px] px-3 py-2.5 mb-2 border border-stone-100 active:opacity-80"
    >
      <View className="flex-row items-center justify-between gap-2">
        <Text
          className="text-[13px] font-sans-extrabold text-stone-800 flex-1"
          numberOfLines={1}
        >
          {getOrderDisplayId(order)}
        </Text>
        <View className="bg-emerald-50 rounded-full px-2 py-0.5">
          <Text className="text-[9px] font-sans-bold text-emerald-700 capitalize">
            {order.orderStatus}
          </Text>
        </View>
      </View>
      <Text
        className="text-[11px] text-stone-500 font-sans-medium mt-1"
        numberOfLines={2}
      >
        {formatOrderItems(order.items)}
      </Text>
      <View className="flex-row items-center justify-between mt-1.5">
        <Text className="text-sm font-sans-extrabold text-orange-600">
          ₹{order.finalAmount}
        </Text>
        <Text className="text-[10px] text-stone-400 font-sans-medium">
          {formatOrderDate(order.createdAt)}
        </Text>
      </View>
    </Pressable>
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
                  Your Orders
                </Text>
                <Text className="text-xs text-stone-500 font-sans-medium mt-0.5">
                  {isSyncing
                    ? "Syncing with server..."
                    : lastSyncedAt
                      ? "Up to date"
                      : "Track your active orders"}
                </Text>
              </View>
              <View className="flex-row items-center gap-1">
                <Pressable
                  onPress={() => void syncOrders(true)}
                  disabled={isSyncing}
                  className="p-2 rounded-full bg-stone-100 active:opacity-80"
                  accessibilityLabel="Refresh orders"
                >
                  {isSyncing ? (
                    <ActivityIndicator size={16} color="#EA580C" />
                  ) : (
                    <Ionicons name="refresh" size={18} color="#EA580C" />
                  )}
                </Pressable>
                <Pressable
                  onPress={onClose}
                  className="p-2 rounded-full bg-stone-100 active:opacity-80"
                  accessibilityLabel="Close sidebar"
                >
                  <Ionicons name="close" size={20} color="#57534E" />
                </Pressable>
              </View>
            </View>

            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
              showsVerticalScrollIndicator
            >
              {(showOrderHistory || showRateUs || showWifi || showFeedback) && (
                <View className="mb-4">
                  <Text className="text-[11px] font-sans-bold uppercase tracking-widest text-stone-400 mb-2">
                    Quick actions
                  </Text>
                  {(showOrderHistory || showRateUs) && (
                    <View className="flex-row gap-2">
                      {showOrderHistory && (
                        <SidebarAction
                          icon={
                            <Ionicons
                              name="receipt-outline"
                              size={16}
                              color="#7C3AED"
                            />
                          }
                          label="Order History"
                          color="#7C3AED"
                          onPress={() => runAction(onOpenOrderHistory)}
                        />
                      )}
                      {showRateUs && (
                        <SidebarAction
                          icon={<Ionicons name="star" size={16} color="#D97706" />}
                          label="Rate us"
                          color="#D97706"
                          onPress={() => runAction(onRateUs)}
                        />
                      )}
                    </View>
                  )}
                  {(showWifi || showFeedback) && (
                    <View className="flex-row gap-2 mt-2">
                      {showWifi && (
                        <SidebarAction
                          icon={<Ionicons name="wifi" size={16} color="#2563EB" />}
                          label="Wi-Fi"
                          color="#2563EB"
                          onPress={() => runAction(onOpenWifi)}
                        />
                      )}
                      {showFeedback && (
                        <SidebarAction
                          icon={
                            <Ionicons
                              name="chatbubble-ellipses-outline"
                              size={16}
                              color="#4F46E5"
                            />
                          }
                          label="Feedback"
                          color="#4F46E5"
                          onPress={() => runAction(onOpenFeedback)}
                        />
                      )}
                    </View>
                  )}
                </View>
              )}
              {isSyncing && activeOrders.length === 0 ? (
                <View className="items-center py-14">
                  <ActivityIndicator size="large" color="#EA580C" />
                  <Text className="text-stone-400 text-sm mt-3">
                    Loading your orders...
                  </Text>
                </View>
              ) : activeOrders.length === 0 ? (
                <View className="items-center py-14 px-4">
                  <Ionicons name="receipt-outline" size={48} color="#D6D3D1" />
                  <Text className="text-stone-500 text-sm font-sans-semibold mt-3 text-center">
                    No active orders
                  </Text>
                  <Text className="text-stone-400 text-xs font-sans-medium mt-1 text-center">
                    Orders you place will appear here until they are delivered or
                    cancelled.
                  </Text>
                </View>
              ) : (
                activeOrders.map(renderOrder)
              )}
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
              <View className="mt-4 items-center">
                <Text className="text-[10px] text-stone-400 font-sans-medium">
                  Version {APP_VERSION}
                </Text>
              </View>
            </View>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}
