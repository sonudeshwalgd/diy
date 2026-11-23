import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
  type AppStateStatus,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useActiveOrders } from "../context/ActiveOrdersContext";
import {
  getOrderPayment,
  type AdminOrder,
  type OrderPaymentDetails,
} from "../services/api";
import {
  formatOrderDate,
  formatOrderItems,
  getOrderDisplayId,
} from "../utils/orderDisplay";
import {
  buildBillReference,
  buildUpiUri,
  fetchOutstandingBill,
  isPaymentComplete,
  startEntireBillPayment,
} from "../utils/upi";
import QRCodeGenerator from "../utils/QRCodeGenerator";
import Sheet from "./Sheet";

interface Props {
  visible: boolean;
  onClose: () => void;
}

function orderFetchId(order: AdminOrder): string {
  return order.orderId || order._id;
}

export default function PayNowOrdersSheet({ visible, onClose }: Props) {
  const { activeOrders, syncOrders } = useActiveOrders();
  const [payments, setPayments] = useState<
    Record<string, OrderPaymentDetails>
  >({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrVisible, setQrVisible] = useState(false);
  const [qrValue, setQrValue] = useState<string | null>(null);
  const orderIdsKey = activeOrders.map(orderFetchId).join(",");

  const refresh = useCallback(async () => {
    const ids = orderIdsKey ? orderIdsKey.split(",") : [];
    const entries = await Promise.all(
      ids.map(async (id) => {
        try {
          return [id, await getOrderPayment(id)] as const;
        } catch {
          return null;
        }
      })
    );
    const next: Record<string, OrderPaymentDetails> = {};
    entries.forEach((entry) => {
      if (entry) next[entry[0]] = entry[1];
    });
    setPayments(next);
  }, [orderIdsKey]);

  const closeSheet = () => {
    setError(null);
    setQrVisible(false);
    onClose();
  };

  useEffect(() => {
    if (!visible) return;
    void Promise.resolve().then(() => {
      void refresh();
      void syncOrders(true);
    });
  }, [visible, refresh, syncOrders]);

  useEffect(() => {
    if (!visible) return;
    const handleAppState = (state: AppStateStatus) => {
      if (state === "active") void refresh();
    };
    const subscription = AppState.addEventListener("change", handleAppState);
    const handleFocus = () => void refresh();
    if (typeof window !== "undefined") {
      window.addEventListener("focus", handleFocus);
    }
    return () => {
      subscription.remove();
      if (typeof window !== "undefined") {
        window.removeEventListener("focus", handleFocus);
      }
    };
  }, [visible, refresh]);

  const payableOrders = activeOrders.filter((order) => {
    if (order.orderStatus?.toUpperCase() === "CANCELLED") return false;
    const id = orderFetchId(order);
    return !isPaymentComplete(payments[id] ?? null, order);
  });
  const payableIds = payableOrders.map(orderFetchId);
  const total = Math.round(
    payableOrders.reduce((sum, order) => {
      const payment = payments[orderFetchId(order)];
      const amount =
        payment?.payableAmount ??
        order.remainingAmount ??
        order.finalAmount ??
        0;
      return sum + amount;
    }, 0) * 100
  ) / 100;

  const handlePay = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await startEntireBillPayment(payableIds);
      if (result.total <= 0) void syncOrders(true);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Could not start UPI payment"
      );
    } finally {
      setBusy(false);
    }
  };

  const handleShowQr = async () => {
    setError(null);
    try {
      const bill = await fetchOutstandingBill(payableIds);
      if (!bill.vpa || bill.total <= 0) {
        void syncOrders(true);
        return;
      }
      setQrValue(
        buildUpiUri(bill.vpa, bill.total, buildBillReference(bill.payments))
      );
      setQrVisible(true);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Could not create payment QR"
      );
    }
  };

  return (
    <>
    <Sheet visible={visible} onClose={closeSheet} sheetStyle={{ maxHeight: "85%" }}>
      <View className="px-5 pt-2 pb-3 flex-row items-center justify-between">
        <View>
          <Text className="text-xl font-sans-extrabold text-stone-900">
            Pay Now
          </Text>
          <Text className="text-xs text-stone-500 font-sans-medium mt-0.5">
            One payment for all unpaid active orders
          </Text>
        </View>
        <Pressable
          onPress={closeSheet}
          className="p-1"
          accessibilityLabel="Close pay now"
        >
          <Ionicons name="close" size={24} color="#6B7280" />
        </Pressable>
      </View>

      {error ? (
        <Text className="mx-5 mb-2 text-xs text-red-600 font-sans-medium">
          {error}
        </Text>
      ) : null}

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {payableOrders.length === 0 ? (
          <View className="py-10 items-center">
            <Ionicons name="checkmark-circle" size={34} color="#059669" />
            <Text className="text-sm font-sans-bold text-stone-700 mt-3">
              No unpaid active orders
            </Text>
            <Text className="text-xs text-stone-500 font-sans-medium mt-1">
              Pay Now will appear here when an order needs payment.
            </Text>
          </View>
        ) : (
          payableOrders.map((order) => {
            const id = orderFetchId(order);
            const payment = payments[id];
            const amount =
              payment?.payableAmount ??
              order.remainingAmount ??
              order.finalAmount ??
              0;
            const status =
              payment?.verificationStatus === "submitted"
                ? "Verification pending"
                : payment?.paymentStatus ??
                  order.paymentStatus ??
                  "pending";
            return (
              <View
                key={id}
                className="bg-white rounded-[22px] border border-stone-100 p-3 mb-2"
              >
                <View className="flex-row items-center justify-between gap-2">
                  <Text
                    className="text-sm font-sans-extrabold text-stone-800 flex-1"
                    numberOfLines={1}
                  >
                    {getOrderDisplayId(order)}
                  </Text>
                  <View className="bg-amber-50 rounded-full px-2 py-0.5">
                    <Text className="text-[10px] font-sans-bold text-amber-700 capitalize">
                      {status}
                    </Text>
                  </View>
                </View>
                <Text className="text-xs text-stone-500 font-sans-medium mt-1">
                  {formatOrderItems(order.items)}
                </Text>
                <View className="flex-row items-center justify-between mt-2">
                  <Text className="text-sm font-sans-extrabold text-orange-600">
                    ₹{amount}
                  </Text>
                  <Text className="text-[10px] text-stone-400 font-sans-medium">
                    {formatOrderDate(order.createdAt)}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {payableOrders.length > 0 ? (
        <View className="px-5 pb-4 pt-2 border-t border-stone-100">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-xs text-stone-500 font-sans-medium">
              Total payable
            </Text>
            <Text className="text-base font-sans-extrabold text-stone-900">
              ₹{total}
            </Text>
          </View>
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => void handlePay()}
              disabled={busy || total <= 0}
              className="flex-1 bg-emerald-600 rounded-2xl py-3.5 flex-row items-center justify-center gap-2 active:opacity-80 disabled:opacity-50"
              accessibilityLabel={`Pay entire bill of ${total} rupees`}
            >
              {busy ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="card-outline" size={18} color="white" />
              )}
              <Text className="text-white text-sm font-sans-extrabold">
                {busy ? "Opening UPI app..." : `Pay Entire Bill · ₹${total}`}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => void handleShowQr()}
              disabled={total <= 0}
              className="w-12 rounded-2xl bg-emerald-50 border border-emerald-200 items-center justify-center active:opacity-70 disabled:opacity-50"
              accessibilityLabel="Show payment QR code"
            >
              <Ionicons name="qr-code-outline" size={20} color="#047857" />
            </Pressable>
          </View>
        </View>
      ) : null}
    </Sheet>

    <Modal
      visible={qrVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setQrVisible(false)}
    >
      <Pressable
        onPress={() => setQrVisible(false)}
        className="flex-1 items-center justify-center bg-black/40 px-6"
      >
        <Pressable
          onPress={() => {}}
          className="bg-white rounded-3xl w-full max-w-[320px] p-5 items-center"
        >
          <View className="w-full flex-row items-center justify-between mb-3">
            <Text className="text-sm font-sans-extrabold text-stone-900">
              Pay Entire Bill
            </Text>
            <Pressable
              onPress={() => setQrVisible(false)}
              className="p-1"
              accessibilityLabel="Close QR code"
            >
              <Ionicons name="close" size={20} color="#6B7280" />
            </Pressable>
          </View>
          {qrValue ? <QRCodeGenerator value={qrValue} size={220} /> : null}
          <Text className="text-lg font-sans-extrabold text-orange-600 mt-3">
            ₹{total}
          </Text>
          <Text className="text-[10px] text-stone-400 font-sans-medium mt-1 text-center">
            Scan with any UPI app
          </Text>
        </Pressable>
      </Pressable>
    </Modal>
    </>
  );
}
