import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Pressable,
  ScrollView,
  Text,
  View,
  type AppStateStatus,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  ApiError,
  getOrderById,
  getOrderPayment,
  type AdminOrder,
  type OrderPaymentDetails,
} from "../services/api";
import { useActiveOrders } from "../context/ActiveOrdersContext";
import {
  formatOrderDate,
  getOrderDisplayId,
} from "../utils/orderDisplay";
import { removeStoredOrderIds } from "../utils/orderId";
import { isPaymentComplete, startEntireBillPayment } from "../utils/upi";
import { trackImpression } from "../services/activityTracker";
import Sheet from "./Sheet";

interface Props {
  visible: boolean;
  orderId: string | null;
  onClose: () => void;
}

export default function ActiveOrderDetailsSheet({
  visible,
  orderId,
  onClose,
}: Props) {
  const { activeOrders, syncOrders } = useActiveOrders();
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [payment, setPayment] = useState<OrderPaymentDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const requestRef = useRef(0);

  const loadOrder = useCallback(
    async (targetId: string, showSpinner = false) => {
      const requestId = requestRef.current + 1;
      requestRef.current = requestId;
      if (showSpinner) setLoading(true);
      setError(null);
      try {
        const data = await getOrderById(targetId, { silentNotFound: true });
        let nextPayment: OrderPaymentDetails | null = null;
        try {
          nextPayment = await getOrderPayment(targetId);
        } catch {
          nextPayment = null;
        }
        if (requestId !== requestRef.current) return;
        setOrder(data.order);
        setPayment(nextPayment);
      } catch (err: unknown) {
        if (requestId !== requestRef.current) return;
        trackImpression({
          type: "order_status_failed",
          name: "Order status check failed",
          metadata: { orderId: targetId },
        });
        setError(
          err instanceof Error ? err.message : "Could not load order details"
        );
        if (err instanceof ApiError && err.status === 404) {
          void removeStoredOrderIds([targetId]).then(() => syncOrders(true));
        }
      } finally {
        if (requestId === requestRef.current && showSpinner) setLoading(false);
      }
    },
    [syncOrders]
  );

  useEffect(() => {
    if (!visible || !orderId) return;
    trackImpression({
      type: "order_status_check",
      name: "Checked order status",
      metadata: { orderId },
    });
    void Promise.resolve().then(() => {
      setOrder(null);
      setPayment(null);
      setPayError(null);
      void loadOrder(orderId, true);
    });
    return () => {
      requestRef.current += 1;
    };
  }, [visible, orderId, loadOrder]);

  useEffect(() => {
    if (!visible || !orderId) return;
    const handleAppState = (state: AppStateStatus) => {
      if (state === "active") void loadOrder(orderId);
    };
    const subscription = AppState.addEventListener("change", handleAppState);
    const handleFocus = () => void loadOrder(orderId);
    const interval = setInterval(() => void loadOrder(orderId), 10000);
    if (typeof window !== "undefined") {
      window.addEventListener("focus", handleFocus);
    }
    return () => {
      subscription.remove();
      clearInterval(interval);
      if (typeof window !== "undefined") {
        window.removeEventListener("focus", handleFocus);
      }
    };
  }, [visible, orderId, loadOrder]);

  const handlePayNow = async () => {
    if (!orderId) return;
    setPayLoading(true);
    setPayError(null);
    try {
      const orderIds = activeOrders.map((item) => item.orderId || item._id);
      const result = await startEntireBillPayment(orderIds);
      trackImpression({
        type: "order_status_viewed",
        name: "Viewed order status",
        metadata: { orderId, status: order?.orderStatus ?? null },
      });
      if (result.total <= 0) void syncOrders(true);
      void loadOrder(orderId);
    } catch (err: unknown) {
      setPayError(
        err instanceof Error ? err.message : "Could not open UPI app"
      );
    } finally {
      setPayLoading(false);
    }
  };

  const complete = isPaymentComplete(payment, order);
  const cancelled = order?.orderStatus?.toUpperCase() === "CANCELLED";
  const canPay = !!order && !complete && !cancelled;

  return (
    <Sheet visible={visible} onClose={onClose} sheetStyle={{ maxHeight: "88%" }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center justify-between pb-3">
          <View className="flex-1 pr-3">
            <Text className="text-lg font-sans-extrabold text-stone-900">
              {order ? getOrderDisplayId(order) : "Order Details"}
            </Text>
            {order && (
              <Text className="text-[11px] text-stone-400 font-sans-medium mt-0.5">
                {formatOrderDate(order.createdAt)}
              </Text>
            )}
          </View>
          <Pressable
            onPress={onClose}
            className="p-2 rounded-full bg-stone-100"
            accessibilityLabel="Close order details"
          >
            <Ionicons name="close" size={18} color="#57534E" />
          </Pressable>
        </View>

        {loading ? (
          <View className="items-center py-16">
            <ActivityIndicator size="large" color="#EA580C" />
            <Text className="text-stone-400 text-sm mt-3">Loading order...</Text>
          </View>
        ) : error || !order ? (
          <View className="items-center py-16 px-6">
            <Ionicons name="alert-circle-outline" size={44} color="#EF4444" />
            <Text className="text-stone-500 text-sm mt-3 text-center">
              {error || "Order details are not available."}
            </Text>
          </View>
        ) : (
          <>
            <View className="flex-row items-center gap-2 flex-wrap pb-4">
              <View className="bg-emerald-50 rounded-full px-2.5 py-1">
                <Text className="text-[10px] font-sans-bold text-emerald-700 capitalize">
                  {order.orderStatus}
                </Text>
              </View>
              <View className="bg-orange-50 rounded-full px-2.5 py-1">
                <Text className="text-[10px] font-sans-bold text-orange-700">
                  {order.items.length} {order.items.length === 1 ? "item" : "items"}
                </Text>
              </View>
              {complete ? (
                <View className="bg-emerald-50 rounded-full px-2.5 py-1">
                  <Text className="text-[10px] font-sans-bold text-emerald-700">
                    Paid
                  </Text>
                </View>
              ) : payment?.paymentStatus === "failed" ? (
                <View className="bg-red-50 rounded-full px-2.5 py-1">
                  <Text className="text-[10px] font-sans-bold text-red-700">
                    Payment failed
                  </Text>
                </View>
              ) : canPay ? (
                <View className="bg-amber-50 rounded-full px-2.5 py-1">
                  <Text className="text-[10px] font-sans-bold text-amber-700">
                    {payment?.verificationStatus === "submitted"
                      ? "Verification pending"
                      : "Payment pending"}
                  </Text>
                </View>
              ) : null}
            </View>

            <Text className="text-[11px] text-stone-400 font-sans-bold uppercase tracking-wide mb-1">
              Items
            </Text>
            <View className="border-t border-stone-200">
              {order.items.map((item, index) => (
                <View
                  key={`${item.name}-${index}`}
                  className="flex-row justify-between py-2 border-b border-stone-100"
                >
                  <Text className="text-sm text-stone-700 font-sans-medium flex-1 mr-3">
                    {item.name} × {item.quantity}
                  </Text>
                  <Text className="text-sm text-stone-800 font-sans-semibold">
                    ₹{item.price * item.quantity}
                  </Text>
                </View>
              ))}
            </View>

            <View className="mt-4 bg-white rounded-[22px] border border-stone-100 px-3 py-2">
              <View className="flex-row items-center justify-between py-1.5">
                <Text className="text-xs text-stone-500">Subtotal</Text>
                <Text className="text-xs text-stone-700 font-sans-semibold">
                  ₹{order.totalAmount}
                </Text>
              </View>
              {order.coinsUsed > 0 && (
                <View className="flex-row items-center justify-between py-1.5">
                  <Text className="text-xs text-emerald-600">Coins used</Text>
                  <Text className="text-xs text-emerald-600 font-sans-semibold">
                    −₹{order.coinsUsed}
                  </Text>
                </View>
              )}
              <View className="flex-row items-center justify-between py-1.5">
                <Text className="text-xs text-stone-500">Delivery</Text>
                <Text className="text-xs text-stone-700 font-sans-semibold">
                  ₹{order.deliveryFee ?? 0}
                </Text>
              </View>
              <View className="flex-row items-center justify-between py-2 border-t border-stone-100 mt-1">
                <Text className="text-sm font-sans-bold text-stone-900">
                  Total amount
                </Text>
                <Text className="text-base font-sans-extrabold text-orange-600">
                  ₹{order.finalAmount}
                </Text>
              </View>
            </View>

            {canPay ? (
              <View className="mt-4">
                {payError ? (
                  <Text className="text-[11px] text-red-600 font-sans-medium mb-2">
                    {payError}
                  </Text>
                ) : null}
                <Pressable
                  onPress={() => void handlePayNow()}
                  disabled={payLoading}
                  className="w-full flex-row items-center justify-center gap-2 bg-emerald-600 rounded-2xl py-3.5 active:opacity-80"
                >
                  {payLoading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Ionicons name="card-outline" size={18} color="white" />
                  )}
                  <Text className="text-white text-sm font-sans-extrabold">
                    {payLoading ? "Opening UPI app..." : "Pay Bill"}
                  </Text>
                </Pressable>
                <Text className="text-[10px] text-stone-400 font-sans-medium text-center mt-2">
                  Includes all unpaid active orders · amount fetched from server
                </Text>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </Sheet>
  );
}
