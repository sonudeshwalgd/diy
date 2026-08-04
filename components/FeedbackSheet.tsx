import { useEffect, useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Sheet from "./Sheet";
import {
  submitFeedback,
  type OrderHistoryOrder,
} from "../services/api";

interface Props {
  visible: boolean;
  onClose: () => void;
  order?: OrderHistoryOrder | null;
  mobile?: string;
  onSubmitted?: () => void;
}

export default function FeedbackSheet({
  visible,
  onClose,
  order,
  mobile,
  onSubmitted,
}: Props) {
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (visible) {
      setRating(0);
      setMessage("");
      setSubmitted(false);
    }
  }, [visible]);

  const isAnonymous = !order;

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    try {
      await submitFeedback({
        orderId: order?._id,
        customerMobile: order ? mobile : undefined,
        rating,
        message,
        anonymous: isAnonymous,
      });
      setSubmitted(true);
      onSubmitted?.();
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "Failed to submit feedback";
      Alert.alert("Error", msg);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      keyboardAvoiding
      sheetClassName="bg-gray-50 rounded-t-3xl"
      sheetStyle={{ maxHeight: "85%" }}
    >
      {/* Header */}
      <View className="px-5 pt-5 pb-3 flex-row items-center justify-between">
        <View>
          <Text className="text-xl font-bold text-gray-900">
            {isAnonymous ? "Anonymous Feedback" : "Order Feedback"}
          </Text>
          <Text className="text-sm text-gray-500 mt-0.5">
            {isAnonymous
              ? "This feedback will be anonymous"
              : "Tell us about this order"}
          </Text>
        </View>
        <Pressable onPress={onClose} className="p-1">
          <Ionicons name="close" size={24} color="#6B7280" />
        </Pressable>
      </View>

      {!submitted ? (
        <>
          {isAnonymous ? (
            <View className="mx-5 mb-4 bg-blue-50 rounded-xl p-4 border border-blue-200">
              <View className="flex-row items-center gap-2 mb-1">
                <Ionicons name="eye-off-outline" size={18} color="#2563EB" />
                <Text className="text-sm font-semibold text-blue-800">
                  100% Anonymous
                </Text>
              </View>
              <Text className="text-xs text-blue-700">
                Your identity will not be revealed. Share your honest experience.
              </Text>
            </View>
          ) : order ? (
            <View className="mx-5 mb-4 bg-white rounded-xl p-4 border border-gray-100">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-xs text-gray-400">
                  #{order._id.slice(-8).toUpperCase()}
                </Text>
                <Text className="text-xs text-gray-400">
                  {formatDate(order.createdAt)}
                </Text>
              </View>
              {order.items.map((itm, i) => (
                <Text key={i} className="text-sm text-gray-700">
                  {itm.name} × {itm.quantity} = ₹{itm.price * itm.quantity}
                </Text>
              ))}
              <View className="border-t border-gray-100 mt-2 pt-2 flex-row justify-between">
                <Text className="text-sm font-bold text-gray-900">Total</Text>
                <Text className="text-sm font-bold text-blue-600">
                  ₹{order.finalAmount}
                </Text>
              </View>
            </View>
          ) : null}

          {/* Rating */}
          <View className="px-5 mb-4">
            <Text className="text-sm font-semibold text-gray-900 mb-2">
              How was your experience?
            </Text>
            <View className="flex-row items-center gap-3">
              {[1, 2, 3, 4, 5].map((n) => (
                <Pressable key={n} onPress={() => setRating(n)} className="p-0.5">
                  <Ionicons
                    name={n <= rating ? "star" : "star-outline"}
                    size={34}
                    color={n <= rating ? "#F59E0B" : "#D1D5DB"}
                  />
                </Pressable>
              ))}
            </View>
          </View>

          {/* Message */}
          <View className="px-5 mb-4">
            <Text className="text-sm font-semibold text-gray-900 mb-2">
              Your message (optional)
            </Text>
            <TextInput
              className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm min-h-[100px] text-gray-900"
              placeholder="Share your experience or suggestions..."
              placeholderTextColor="#9CA3AF"
              multiline
              value={message}
              onChangeText={setMessage}
              textAlignVertical="top"
            />
          </View>

          <View className="px-5 pb-8">
            <Pressable
              onPress={handleSubmit}
              disabled={rating === 0 || submitting}
              className={`rounded-xl py-4 items-center ${
                rating === 0 || submitting
                  ? "bg-gray-300"
                  : "bg-blue-600 active:bg-blue-700"
              }`}
            >
              <Text className="text-white text-base font-bold">
                {submitting ? "Submitting..." : "Submit Feedback"}
              </Text>
            </Pressable>
          </View>
        </>
      ) : (
        <View className="items-center py-14 px-6">
          <Ionicons name="checkmark-circle" size={64} color="#16A34A" />
          <Text className="text-lg font-bold text-gray-900 mt-4">Thank you!</Text>
          <Text className="text-sm text-gray-500 mt-1 text-center">
            Your feedback has been submitted.
          </Text>
          <Pressable
            onPress={onClose}
            className="mt-6 bg-blue-600 rounded-xl px-8 py-3"
          >
            <Text className="text-white text-sm font-semibold">Done</Text>
          </Pressable>
        </View>
      )}
    </Sheet>
  );
}
