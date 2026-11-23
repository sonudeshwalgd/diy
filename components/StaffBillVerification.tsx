import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  getOrderPayment,
  verifyBatchOrderPayment,
  type AdminOrder,
} from "../services/api";

interface Props {
  orders: AdminOrder[];
  staffKey: string;
  onVerified: () => void;
}

export default function StaffBillVerification({
  orders,
  staffKey,
  onVerified,
}: Props) {
  const orderIds = orders
    .filter(
      (order) =>
        order.orderStatus?.toUpperCase() !== "CANCELLED" &&
        order.paymentStatus !== "paid" &&
        (order.remainingAmount === undefined || order.remainingAmount > 0)
    )
    .map((order) => order.orderId || order._id);
  const idsKey = orderIds.join(",");
  const [total, setTotal] = useState(0);
  const [amount, setAmount] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!idsKey) {
      setTotal(0);
      setAmount("");
      return;
    }
    const payments = await Promise.all(
      idsKey.split(",").map((id) => getOrderPayment(id).catch(() => null))
    );
    const outstanding =
      Math.round(
        payments.reduce((sum, payment) => sum + (payment?.payableAmount ?? 0), 0) * 100
      ) / 100;
    setTotal(outstanding);
    setAmount(String(outstanding));
  }, [idsKey]);

  useEffect(() => {
    void Promise.resolve().then(() => void refresh());
  }, [refresh]);

  if (orderIds.length === 0) return null;

  const verify = async (approved: boolean) => {
    setBusy(true);
    setError(null);
    try {
      await verifyBatchOrderPayment({
        staffKey,
        orderIds,
        approved,
        receivedAmount: approved ? Number(amount) : undefined,
        transactionId: transactionId.trim() || undefined,
      });
      onVerified();
      void refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not update bill payment");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="mx-4 mb-2 bg-emerald-50 border border-emerald-100 rounded-2xl px-3.5 py-3">
      <View className="flex-row items-center gap-2 mb-2">
        <Ionicons name="receipt-outline" size={15} color="#047857" />
        <Text className="text-[11px] text-emerald-800 font-sans-bold uppercase tracking-wide">
          Entire bill · UPI
        </Text>
        <Text className="ml-auto text-xs font-sans-extrabold text-emerald-900">
          ₹{total}
        </Text>
      </View>
      <Text className="text-[10px] text-emerald-800 font-sans-medium mb-2">
        {orderIds.length} unpaid order{orderIds.length === 1 ? "" : "s"} included
      </Text>

      <View className="flex-row gap-2">
        <View className="flex-1">
          <Text className="text-[10px] text-stone-500 font-sans-medium mb-1">
            Amount received
          </Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            className="bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-900 font-sans-semibold"
          />
        </View>
        <View className="flex-1">
          <Text className="text-[10px] text-stone-500 font-sans-medium mb-1">
            UPI transaction ID
          </Text>
          <TextInput
            value={transactionId}
            onChangeText={setTransactionId}
            autoCapitalize="characters"
            className="bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs text-stone-900 font-sans-semibold"
          />
        </View>
      </View>

      {error ? (
        <Text className="text-[11px] text-red-600 mt-2 font-sans-medium">{error}</Text>
      ) : null}

      <View className="flex-row gap-2 mt-2.5">
        <Pressable
          onPress={() => void verify(true)}
          disabled={busy}
          className="flex-1 bg-emerald-600 rounded-xl py-2 flex-row items-center justify-center gap-1 active:opacity-80"
        >
          {busy ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Ionicons name="checkmark" size={14} color="white" />
          )}
          <Text className="text-white text-[11px] font-sans-bold">Mark Paid</Text>
        </Pressable>
        <Pressable
          onPress={() => void verify(false)}
          disabled={busy}
          className="flex-1 bg-white border border-red-200 rounded-xl py-2 flex-row items-center justify-center gap-1 active:opacity-80"
        >
          <Ionicons name="close" size={14} color="#B91C1C" />
          <Text className="text-red-700 text-[11px] font-sans-bold">Mark Failed</Text>
        </Pressable>
      </View>
    </View>
  );
}
