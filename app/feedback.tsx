import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  getAllFeedback,
  getOrderById,
  type FeedbackRecord,
  type OrderHistoryOrder,
} from "../services/api";
import Sheet from "../components/Sheet";

export default function FeedbackScreen() {
  const [data, setData] = useState<FeedbackRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<OrderHistoryOrder | null>(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAllFeedback();
      setData(result.feedback);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load feedback";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchFeedback();
    }, [fetchFeedback])
  );

  const handleViewOrder = async (orderId: string) => {
    setOrderLoading(true);
    setOrderError(null);
    setOrderData(null);
    try {
      const result = await getOrderById(orderId);
      setOrderData(result.order);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load order";
      setOrderError(msg);
    } finally {
      setOrderLoading(false);
    }
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

  const renderStars = (rating: number) => (
    <View className="flex-row gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Ionicons
          key={n}
          name={n <= rating ? "star" : "star-outline"}
          size={14}
          color={n <= rating ? "#F59E0B" : "#D1D5DB"}
        />
      ))}
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <View className="px-5 pt-5 pb-3 flex-row items-center justify-between">
        <View>
          <Text className="text-xl font-bold text-gray-900">Feedback</Text>
          <Text className="text-sm text-gray-500 mt-0.5">
            All customer reviews
          </Text>
        </View>
        <Pressable onPress={fetchFeedback} className="p-2 bg-indigo-50 rounded-full">
          <Ionicons name="refresh" size={20} color="#4F46E5" />
        </Pressable>
      </View>

      {error && (
        <View className="px-5 mb-3">
          <Text className="text-red-500 text-sm">{error}</Text>
        </View>
      )}

      {loading && data.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text className="text-gray-400 text-sm mt-3">Loading...</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item._id}
          ListHeaderComponent={
            data.length > 0 ? (
              <View className="px-5 mb-2">
                <Text className="text-sm font-semibold text-gray-700">
                  {data.length} review{data.length !== 1 ? "s" : ""}
                </Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View className="items-center py-20">
              <Ionicons name="chatbubble-ellipses-outline" size={48} color="#D1D5DB" />
              <Text className="text-gray-400 text-sm mt-3">No feedback yet</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View className="mx-5 bg-white rounded-xl p-4 mb-3 border border-gray-100">
              <View className="flex-row justify-between items-start mb-1.5">
                <Text className="text-xs text-gray-400">
                  {formatDate(item.createdAt)}
                </Text>
                {item.orderId && (
                  <Text className="text-xs text-gray-400">
                    #{item.orderId.slice(-8).toUpperCase()}
                  </Text>
                )}
              </View>

              <View className="flex-row items-center justify-between mb-2">
                {renderStars(item.rating)}
                {item.anonymous ? (
                  <View className="flex-row items-center gap-1 bg-gray-100 rounded-full px-2 py-0.5">
                    <Ionicons name="eye-off-outline" size={11} color="#6B7280" />
                    <Text className="text-gray-500 text-[10px] font-medium">
                      Anonymous
                    </Text>
                  </View>
                ) : item.customerMobile ? (
                  <Text className="text-xs text-gray-500">
                    {item.customerMobile}
                  </Text>
                ) : null}
              </View>

              {item.message ? (
                <Text className="text-sm text-gray-700 leading-5">
                  {item.message}
                </Text>
              ) : (
                <Text className="text-xs text-gray-400 italic">
                  No message
                </Text>
              )}

              {item.orderId && (
                <Pressable
                  onPress={() => handleViewOrder(item.orderId!)}
                  className="mt-3 flex-row items-center gap-1.5"
                >
                  <Ionicons name="receipt-outline" size={15} color="#4F46E5" />
                  <Text className="text-indigo-600 text-sm font-semibold">
                    View Order
                  </Text>
                </Pressable>
              )}
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={fetchFeedback} />
          }
        />
      )}

      <Sheet
        visible={!!orderData || orderLoading}
        onClose={() => setOrderData(null)}
        sheetClassName="bg-gray-50 rounded-t-3xl"
        sheetStyle={{ maxHeight: "85%" }}
      >
        <View className="px-5 pt-5 pb-3 flex-row items-center justify-between">
          <View>
            <Text className="text-xl font-bold text-gray-900">Order Details</Text>
            {orderData && (
              <Text className="text-sm text-gray-500 mt-0.5">
                #{orderData._id.slice(-8).toUpperCase()}
              </Text>
            )}
          </View>
          <Pressable onPress={() => setOrderData(null)} className="p-1">
            <Ionicons name="close" size={24} color="#6B7280" />
          </Pressable>
        </View>

        {orderLoading ? (
          <View className="items-center py-14">
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text className="text-gray-400 text-sm mt-3">Loading order...</Text>
          </View>
        ) : orderError ? (
          <View className="items-center py-14 px-6">
            <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
            <Text className="text-red-500 text-sm mt-3 text-center">
              {orderError}
            </Text>
          </View>
        ) : orderData ? (
          <View className="mx-5 bg-white rounded-xl p-4 mb-8 border border-gray-100">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-xs text-gray-400">
                {formatDate(orderData.createdAt)}
              </Text>
              <View className="bg-green-100 rounded-full px-2.5 py-0.5">
                <Text className="text-green-700 text-[10px] font-medium capitalize">
                  {orderData.orderStatus}
                </Text>
              </View>
            </View>

            <View className="mb-3">
              {orderData.items.map((itm, i) => (
                <Text key={i} className="text-sm text-gray-700 mb-0.5">
                  {itm.name} × {itm.quantity} = ₹{itm.price * itm.quantity}
                </Text>
              ))}
            </View>

            <View className="border-t border-gray-100 pt-3">
              <View className="flex-row justify-between mb-1">
                <Text className="text-xs text-gray-500">Original</Text>
                <Text className="text-xs text-gray-500">₹{orderData.totalAmount}</Text>
              </View>
              {orderData.coinsUsed > 0 && (
                <View className="flex-row justify-between mb-1">
                  <Text className="text-xs text-green-600">Coins Used</Text>
                  <Text className="text-xs text-green-600">
                    −₹{orderData.coinsUsed}
                  </Text>
                </View>
              )}
              <View className="flex-row justify-between mb-1">
                <Text className="text-xs text-green-600">Coins Earned</Text>
                <Text className="text-xs text-green-600">
                  +{orderData.coinsEarned} 🪙
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm font-bold text-gray-900">Final</Text>
                <Text className="text-sm font-bold text-blue-600">
                  ₹{orderData.finalAmount}
                </Text>
              </View>
            </View>
          </View>
        ) : null}
      </Sheet>
    </View>
  );
}
