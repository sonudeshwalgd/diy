import { Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { AdminOrder } from "../services/api";
import { getOrderDisplayId } from "../utils/orderDisplay";
import Sheet from "./Sheet";

interface Props {
  visible: boolean;
  order: AdminOrder | null;
  onViewPrevious: () => void;
  onPlaceNew: () => void;
  onDismiss: () => void;
}

export default function DuplicateOrderSheet({
  visible,
  order,
  onViewPrevious,
  onPlaceNew,
  onDismiss,
}: Props) {
  return (
    <Sheet
      visible={visible && !!order}
      onClose={onDismiss}
      sheetClassName="px-6 pb-8 items-center"
      sheetStyle={{ maxHeight: "85%" }}
    >
      <View className="bg-amber-50 rounded-full p-3 mb-4">
        <Ionicons name="alert-circle" size={28} color="#D97706" />
      </View>

      <Text className="text-lg font-sans-extrabold text-stone-900 text-center">
        You already have a similar active order!
      </Text>
      <Text className="text-sm text-stone-500 text-center mt-2">
        You have already placed this order, and it has not been delivered or
        cancelled yet.
      </Text>

      {order && (
        <ScrollView className="w-full mt-5" showsVerticalScrollIndicator={false}>
          <View className="bg-white rounded-2xl border border-stone-100 p-4">
            <Text className="text-xs font-sans-bold text-stone-500 uppercase tracking-wide">
              Previous order {getOrderDisplayId(order)}
            </Text>
            <View className="border-t border-stone-100 mt-3 pt-2">
              {order.items.map((item, index) => (
                <View
                  key={`${item.name}-${index}`}
                  className="flex-row justify-between py-1.5"
                >
                  <Text className="flex-1 mr-3 text-sm text-stone-700 font-sans-medium">
                    {item.name} × {item.quantity}
                  </Text>
                  <Text className="text-sm font-sans-semibold text-stone-800">
                    ₹{item.price * item.quantity}
                  </Text>
                </View>
              ))}
            </View>
            <View className="flex-row justify-between border-t border-stone-100 pt-3 mt-2">
              <Text className="text-sm font-sans-bold text-stone-900">
                Total amount
              </Text>
              <Text className="text-base font-sans-extrabold text-orange-600">
                ₹{order.finalAmount}
              </Text>
            </View>
          </View>
        </ScrollView>
      )}

      <Text className="text-sm text-stone-600 text-center mt-5">
        Do you want to repeat this order or place a new order?
      </Text>

      <Pressable
        onPress={onViewPrevious}
        accessibilityLabel="View Previous Order"
        className="w-full mt-4 rounded-2xl border border-stone-200 bg-white py-3 items-center"
      >
        <Text className="text-sm font-sans-bold text-stone-700">
          View Previous Order
        </Text>
      </Pressable>

      <Pressable
        onPress={onPlaceNew}
        accessibilityLabel="Place New Order"
        className="w-full mt-3 rounded-2xl bg-orange-600 py-3 items-center"
      >
        <Text className="text-sm font-sans-bold text-white">Place New Order</Text>
      </Pressable>
    </Sheet>
  );
}
