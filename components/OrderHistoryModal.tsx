import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getOrderHistory,
  type OrderHistoryOrder,
  type OrderHistoryResponse,
} from "../services/api";
import Sheet from "./Sheet";
import FeedbackSheet from "./FeedbackSheet";

interface Props {
  visible: boolean;
  onClose: () => void;
}

const MOBILE_KEY = "diy_customer_mobile";

export default function OrderHistoryModal({ visible, onClose }: Props) {
  const [mobile, setMobile] = useState("");
  const [savedMobile, setSavedMobile] = useState<string | null>(null);
  const [data, setData] = useState<OrderHistoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedbackOrder, setFeedbackOrder] = useState<OrderHistoryOrder | null>(null);

  useEffect(() => {
    if (visible) {
      AsyncStorage.getItem(MOBILE_KEY).then((m) => {
        if (m) {
          setSavedMobile(m);
          setMobile(m);
          fetchHistory(m);
        }
      });
    } else {
      setData(null);
      setError(null);
    }
  }, [visible]);

  const fetchHistory = async (m: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getOrderHistory(m);
      setData(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleMobileSubmit = async () => {
    const cleaned = mobile.trim();
    if (cleaned.length !== 10 || !/^\d{10}$/.test(cleaned)) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    await AsyncStorage.setItem(MOBILE_KEY, cleaned);
    setSavedMobile(cleaned);
    await fetchHistory(cleaned);
  };

  const handleFeedbackSubmitted = () => {
    setData((prev) => {
      if (!prev || !feedbackOrder) return prev;
      return {
        ...prev,
        orders: prev.orders.map((o) =>
          o._id === feedbackOrder._id ? { ...o, feedbackGiven: true } : o
        ),
      };
    });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
    <Sheet
      visible={visible}
      onClose={onClose}
      keyboardAvoiding
      sheetClassName="bg-gray-50 rounded-t-3xl"
      sheetStyle={{ maxHeight: "90%" }}
    >
      <View className="px-5 pt-5 pb-3 flex-row items-center justify-between">
              <View>
                <Text className="text-xl font-bold text-gray-900">Order History</Text>
                <Text className="text-sm text-gray-500 mt-0.5">
                  Your loyalty account
                </Text>
              </View>
              <Pressable onPress={onClose} className="p-1">
                <Ionicons name="close" size={24} color="#6B7280" />
              </Pressable>
            </View>

            {/* Mobile Input */}
            <View className="px-5 mb-4">
              {savedMobile ? (
                <View className="flex-row items-center justify-between bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-200">
                  <Text className="text-gray-900 text-sm font-medium">
                    📱 {savedMobile}
                  </Text>
                  <Pressable
                    onPress={() => {
                      setSavedMobile(null);
                      setData(null);
                      AsyncStorage.removeItem(MOBILE_KEY);
                    }}
                  >
                    <Text className="text-blue-600 text-xs font-medium">Change</Text>
                  </Pressable>
                </View>
              ) : (
                <View className="flex-row items-center gap-2">
                  <TextInput
                    className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
                    placeholder="Enter 10-digit mobile number"
                    keyboardType="numeric"
                    maxLength={10}
                    value={mobile}
                    onChangeText={setMobile}
                  />
                  <Pressable
                    onPress={handleMobileSubmit}
                    className="bg-blue-600 rounded-lg px-4 py-2.5"
                    disabled={loading}
                  >
                    <Text className="text-white text-sm font-semibold">
                      {loading ? "..." : "View"}
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>

            {error && (
              <View className="px-5 mb-3">
                <Text className="text-red-500 text-sm">{error}</Text>
              </View>
            )}

            {loading && (
              <View className="items-center py-10">
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text className="text-gray-400 text-sm mt-3">Loading...</Text>
              </View>
            )}

            {!loading && data && (
              <FlatList
                data={data.orders}
                keyExtractor={(item) => item._id}
                ListHeaderComponent={
                  <>
                    {/* Customer Summary */}
                    <View className="mx-5 bg-white rounded-xl p-4 border border-gray-100 mb-4">
                      <Text className="text-sm font-semibold text-gray-700 mb-3">
                        Loyalty Summary
                      </Text>
                      <View className="flex-row justify-between mb-2">
                        <Text className="text-sm text-gray-500">Total Coins</Text>
                        <Text className="text-sm font-bold text-amber-600">
                          🪙 {data.customer.totalCoins}
                        </Text>
                      </View>
                      <View className="flex-row justify-between mb-2">
                        <Text className="text-sm text-gray-500">Total Orders</Text>
                        <Text className="text-sm font-bold text-gray-900">
                          {data.customer.totalOrders}
                        </Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-sm text-gray-500">Lifetime Spent</Text>
                        <Text className="text-sm font-bold text-green-600">
                          ₹{data.customer.lifetimeSpent}
                        </Text>
                      </View>
                    </View>

                    <View className="px-5 mb-2">
                      <Text className="text-sm font-semibold text-gray-700">
                        Order History ({data.orders.length})
                      </Text>
                    </View>
                  </>
                }
                ListEmptyComponent={
                  <View className="items-center py-10">
                    <Ionicons name="receipt-outline" size={48} color="#D1D5DB" />
                    <Text className="text-gray-400 text-sm mt-3">No orders yet</Text>
                  </View>
                }
                renderItem={({ item }) => (
                  <View className="mx-5 bg-white rounded-xl p-4 mb-3 border border-gray-100">
                    <View className="flex-row justify-between items-start mb-2">
                      <View>
                        <Text className="text-xs text-gray-400">
                          {formatDate(item.createdAt)}
                        </Text>
                        <Text className="text-xs text-gray-400 mt-0.5">
                          #{item._id.slice(-8).toUpperCase()}
                        </Text>
                      </View>
                      <View
                        className="bg-green-100 rounded-full px-2.5 py-0.5"
                      >
                        <Text className="text-green-700 text-[10px] font-medium capitalize">
                          {item.orderStatus}
                        </Text>
                      </View>
                    </View>

                    <View className="mb-2">
                      {item.items.map((itm, i) => (
                        <Text key={i} className="text-sm text-gray-700">
                          {itm.name} × {itm.quantity} = ₹{itm.price * itm.quantity}
                        </Text>
                      ))}
                    </View>

                    <View className="border-t border-gray-100 pt-2">
                      <View className="flex-row justify-between mb-1">
                        <Text className="text-xs text-gray-500">Original</Text>
                        <Text className="text-xs text-gray-500">₹{item.totalAmount}</Text>
                      </View>
                      {item.coinsUsed > 0 && (
                        <View className="flex-row justify-between mb-1">
                          <Text className="text-xs text-green-600">Coins Used</Text>
                          <Text className="text-xs text-green-600">
                            −₹{item.coinsUsed}
                          </Text>
                        </View>
                      )}
                      <View className="flex-row justify-between mb-1">
                        <Text className="text-xs text-green-600">Coins Earned</Text>
                        <Text className="text-xs text-green-600">
                          +{item.coinsEarned} 🪙
                        </Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="text-sm font-bold text-gray-900">Final</Text>
                        <Text className="text-sm font-bold text-blue-600">
                          ₹{item.finalAmount}
                        </Text>
                      </View>
                    </View>

                    <Pressable
                      onPress={() => setFeedbackOrder(item)}
                      disabled={!!item.feedbackGiven}
                      className={`mt-3 rounded-lg py-2.5 items-center flex-row justify-center gap-1.5 ${
                        item.feedbackGiven
                          ? "bg-green-50"
                          : "bg-blue-600 active:bg-blue-700"
                      }`}
                    >
                      <Ionicons
                        name={
                          item.feedbackGiven
                            ? "checkmark"
                            : "chatbubble-ellipses-outline"
                        }
                        size={16}
                        color={item.feedbackGiven ? "#16A34A" : "#FFFFFF"}
                      />
                      <Text
                        className={`text-sm font-semibold ${
                          item.feedbackGiven
                            ? "text-green-700"
                            : "text-white"
                        }`}
                      >
                        {item.feedbackGiven ? "Feedback Given" : "Give Feedback"}
                      </Text>
                    </Pressable>
                  </View>
                )}
                contentContainerStyle={{ paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
              />
            )}
    </Sheet>

      <FeedbackSheet
        visible={!!feedbackOrder}
        order={feedbackOrder}
        mobile={savedMobile || undefined}
        onClose={() => setFeedbackOrder(null)}
        onSubmitted={handleFeedbackSubmitted}
      />
    </>
  );
}
