import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  getOrderPayment,
  verifyOrderPayment,
  type OrderPaymentDetails,
} from "../services/api";

interface Props {
  orderId: string;
  staffKey: string;
  onVerified: (payment: OrderPaymentDetails) => void;
}

export default function StaffPaymentVerification({
  orderId,
  staffKey,
  onVerified,
}: Props) {
  const [payment, setPayment] = useState<OrderPaymentDetails | null>(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onVerifiedRef = useRef(onVerified);

  useEffect(() => {
    onVerifiedRef.current = onVerified;
  }, [onVerified]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await getOrderPayment(orderId);
      if (next.paymentStatus !== "paid") setAmount(String(next.remainingAmount));
      setPayment(next);
      onVerifiedRef.current(next);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not load payment details");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void Promise.resolve().then(() => void load());
  }, [load]);

  const verify = async (approved: boolean) => {
    setBusy(true);
    setError(null);
    try {
      const next = await verifyOrderPayment(orderId, {
        staffKey,
        approved,
        receivedAmount: approved ? Number(amount) : undefined,
        transactionId: payment?.paymentTransactionId ?? undefined,
      });
      setPayment(next);
      onVerifiedRef.current(next);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not update payment status");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="mt-4 bg-stone-50 border border-stone-100 rounded-2xl px-3.5 py-3">
      <View className="flex-row items-center gap-2 mb-2">
        <Ionicons name="card-outline" size={15} color="#78716C" />
        <Text className="text-[11px] text-stone-500 font-sans-bold uppercase tracking-wide">
          UPI payment
        </Text>
        {payment ? (
          <View
            className={`rounded-full px-2 py-0.5 ${
              payment.paymentStatus === "paid"
                ? "bg-emerald-100"
                : payment.paymentStatus === "failed"
                  ? "bg-red-100"
                  : "bg-amber-100"
            }`}
          >
            <Text
              className={`text-[9px] font-sans-bold capitalize ${
                payment.paymentStatus === "paid"
                  ? "text-emerald-700"
                  : payment.paymentStatus === "failed"
                    ? "text-red-700"
                    : "text-amber-700"
              }`}
            >
              {payment.verificationStatus === "submitted"
                ? "UTR submitted"
                : payment.paymentStatus}
            </Text>
          </View>
        ) : null}
      </View>

      {loading ? (
        <ActivityIndicator size="small" color="#EA580C" />
      ) : error && !payment ? (
        <Text className="text-[11px] text-red-600 font-sans-medium">{error}</Text>
      ) : payment ? (
        <>
          <View className="flex-row items-center justify-between py-1">
            <Text className="text-xs text-stone-500">Outstanding</Text>
            <Text className="text-xs text-stone-800 font-sans-bold">
              ₹{payment.remainingAmount}
            </Text>
          </View>
          {payment.paymentTransactionId ? (
            <View className="flex-row items-center justify-between py-1">
              <Text className="text-xs text-stone-500">Transaction ID</Text>
              <Text className="text-xs text-stone-800 font-sans-semibold">
                {payment.paymentTransactionId}
              </Text>
            </View>
          ) : null}

          {payment.paymentStatus !== "paid" ? (
            <>
              <View className="flex-row items-center justify-between mt-2">
                <Text className="text-[11px] text-stone-500 font-sans-medium">
                  Amount received
                </Text>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  className="bg-white border border-stone-200 rounded-lg px-2.5 py-1.5 w-24 text-right text-xs text-stone-900 font-sans-semibold"
                />
              </View>
              {error ? (
                <Text className="text-[11px] text-red-600 mt-1.5 font-sans-medium">
                  {error}
                </Text>
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
                  <Text className="text-white text-[11px] font-sans-bold">
                    Mark Paid
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => void verify(false)}
                  disabled={busy}
                  className="flex-1 bg-white border border-red-200 rounded-xl py-2 flex-row items-center justify-center gap-1 active:opacity-80"
                >
                  <Ionicons name="close" size={14} color="#B91C1C" />
                  <Text className="text-red-700 text-[11px] font-sans-bold">
                    Mark Failed
                  </Text>
                </Pressable>
              </View>
            </>
          ) : (
            <Text className="text-[11px] text-emerald-700 font-sans-medium mt-1.5">
              Verified · ₹{payment.paidAmount} received
            </Text>
          )}
        </>
      ) : null}
    </View>
  );
}
