import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMenu } from "../../context/MenuContext";
import {
  getRestaurantOrders,
  updateRestaurantOrderStatus,
  verifyStaffKey,
  type AdminOrder,
  type PreparationStatus,
} from "../../services/api";

const ACTIONS: { label: string; status: PreparationStatus }[] = [
  { label: "Accepted", status: "accepted" },
  { label: "Preparing", status: "preparing" },
  { label: "Ready", status: "ready" },
];

const statusStyle = (status?: string) => {
  if (status === "ready") return "bg-emerald-50 text-emerald-700";
  if (status === "preparing") return "bg-amber-50 text-amber-700";
  return "bg-orange-50 text-orange-700";
};

export default function RestaurantOrdersScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { restaurants } = useMenu();
  const restaurant = restaurants.find(
    (entry) => entry.slug === slug || entry.id === slug
  );
  const restaurantSlug = restaurant?.slug ?? slug;

  const [staffKey, setStaffKey] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const refreshingRef = useRef(false);

  const fetchOrders = useCallback(
    async (key: string, silent = false) => {
      if (refreshingRef.current || !key) return;
      refreshingRef.current = true;
      if (!silent) setLoading(true);
      try {
        const data = await getRestaurantOrders(restaurantSlug, key);
        setOrders(data.orders);
        setLoadError(null);
      } catch (err) {
        setLoadError(
          err instanceof Error ? err.message : "Could not load orders"
        );
      } finally {
        refreshingRef.current = false;
        setLoading(false);
      }
    },
    [restaurantSlug]
  );

  useEffect(() => {
    if (!unlocked) return;
    const timer = setInterval(() => void fetchOrders(staffKey, true), 20_000);
    return () => clearInterval(timer);
  }, [fetchOrders, staffKey, unlocked]);

  const handleUnlock = async () => {
    setVerifying(true);
    setUnlockError(null);
    try {
      const valid = await verifyStaffKey(staffKey, restaurantSlug);
      if (!valid) {
        setUnlockError("That staff key is not valid. Please try again.");
        return;
      }
      setUnlocked(true);
      void fetchOrders(staffKey);
    } catch (err) {
      setUnlockError(
        err instanceof Error ? err.message : "Could not verify staff key"
      );
    } finally {
      setVerifying(false);
    }
  };

  const handleLock = () => {
    setStaffKey("");
    setUnlocked(false);
    setOrders([]);
    setLoadError(null);
    setUnlockError(null);
  };

  const handleStatus = async (order: AdminOrder, status: PreparationStatus) => {
    if (updatingId) return;
    setUpdatingId(order._id);
    setLoadError(null);
    try {
      const result = await updateRestaurantOrderStatus(
        restaurantSlug,
        order.orderId ?? order._id,
        staffKey,
        status
      );
      setOrders((current) =>
        current.map((entry) =>
          entry._id === order._id
            ? { ...entry, restaurantStatus: status }
            : entry
        )
      );
      if (!result.order) return;
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Could not update order");
    } finally {
      setUpdatingId(null);
    }
  };

  const activeOrders = useMemo(
    () =>
      orders.filter((order) =>
        ["accepted", "preparing", "ready"].includes(
          order.restaurantStatus ?? order.restaurantStatuses?.[0]?.status ?? "accepted"
        )
      ),
    [orders]
  );

  return (
    <View className="flex-1 bg-stone-100">
      <SafeAreaView edges={["top"]} className="bg-white/90 border-b border-stone-200">
        <View className="px-4 py-3 flex-row items-center gap-3">
          <Pressable
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.replace("/");
            }}
            className="p-2 rounded-full bg-stone-100 active:opacity-80"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={20} color="#57534E" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-lg font-sans-extrabold text-stone-900">
              {restaurant?.name ?? "Restaurant"} Orders
            </Text>
            <Text className="text-[11px] text-stone-500 font-sans-medium">
              Preparation queue for this kitchen
            </Text>
          </View>
          {unlocked ? (
            <>
              <Pressable
                onPress={() => void fetchOrders(staffKey)}
                className="p-2 rounded-full bg-orange-100 active:opacity-80"
                accessibilityLabel="Refresh orders"
              >
                <Ionicons name="refresh" size={18} color="#EA580C" />
              </Pressable>
              <Pressable
                onPress={handleLock}
                className="p-2 rounded-full bg-stone-100 active:opacity-80"
                accessibilityLabel="Lock orders"
              >
                <Ionicons name="lock-closed-outline" size={18} color="#57534E" />
              </Pressable>
            </>
          ) : null}
        </View>
      </SafeAreaView>

      {!unlocked ? (
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <View className="bg-white rounded-3xl p-6 border border-white">
            <View className="w-14 h-14 rounded-2xl bg-orange-100 items-center justify-center mb-4">
              <Ionicons name="lock-closed" size={26} color="#EA580C" />
            </View>
            <Text className="text-xl font-sans-extrabold text-stone-900">
              Kitchen staff access
            </Text>
            <Text className="text-sm text-stone-500 font-sans-medium mt-1 leading-5">
              Enter the staff key for this restaurant to view and update
              preparation status.
            </Text>
            <TextInput
              value={staffKey}
              onChangeText={(value) => {
                setStaffKey(value);
                setUnlockError(null);
              }}
              placeholder="Enter staff key"
              placeholderTextColor="#A8A29E"
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
              className="mt-5 bg-stone-100 border border-stone-200 rounded-2xl px-4 py-3.5 text-base font-sans-semibold text-stone-900"
              onSubmitEditing={() => void handleUnlock()}
              returnKeyType="go"
            />
            {unlockError ? (
              <Text className="text-xs text-red-500 font-sans-semibold mt-2">
                {unlockError}
              </Text>
            ) : null}
            <Pressable
              onPress={() => void handleUnlock()}
              disabled={verifying || !staffKey.length}
              className={`mt-4 rounded-2xl py-3.5 items-center ${
                verifying || !staffKey.length ? "bg-stone-300" : "bg-orange-600"
              }`}
            >
              {verifying ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-sm font-sans-bold">
                  Unlock kitchen orders
                </Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          {loadError ? (
            <View className="bg-red-50 border border-red-200 rounded-2xl px-3 py-2 mb-3">
              <Text className="text-xs text-red-600 font-sans-semibold">
                {loadError}
              </Text>
            </View>
          ) : null}
          {loading ? (
            <ActivityIndicator color="#EA580C" className="my-6" />
          ) : null}
          {activeOrders.length === 0 && !loading ? (
            <View className="bg-white rounded-3xl p-6 items-center">
              <Ionicons name="checkmark-circle-outline" size={34} color="#A8A29E" />
              <Text className="text-sm text-stone-500 font-sans-semibold mt-2">
                No active orders for this kitchen
              </Text>
            </View>
          ) : null}
          {activeOrders.map((order) => {
            const restaurantStatus =
              order.restaurantStatus ??
              order.restaurantStatuses?.find(
                (entry) =>
                  entry.restaurantId === (restaurant?.id ?? restaurantSlug)
              )?.status ??
              "accepted";
            return (
              <View
                key={order._id}
                className="bg-white rounded-3xl p-4 mb-3 border border-white"
              >
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-sans-extrabold text-stone-900">
                    {order.orderId || `#${order._id.slice(-6).toUpperCase()}`}
                  </Text>
                  <View
                    className={`rounded-full px-2.5 py-1 ${statusStyle(restaurantStatus)}`}
                  >
                    <Text className="text-[10px] font-sans-bold capitalize">
                      {restaurantStatus}
                    </Text>
                  </View>
                </View>
                <Text className="text-[11px] text-stone-400 font-sans-medium mt-1">
                  {new Date(order.createdAt).toLocaleString()} · Central:{" "}
                  {order.orderStatus}
                </Text>
                <View className="border-t border-stone-100 mt-2 pt-2">
                  {order.items
                    .filter(
                      (item) =>
                        (item.restaurantId ?? item.restaurant) ===
                        (restaurant?.id ?? restaurantSlug)
                    )
                    .map((item, index) => (
                      <View
                        key={`${item.name}-${index}`}
                        className="flex-row justify-between py-0.5"
                      >
                        <Text
                          className="text-xs text-stone-600 font-sans-medium flex-1"
                          numberOfLines={1}
                        >
                          {item.name} × {item.quantity}
                        </Text>
                        <Text className="text-xs text-stone-800 font-sans-semibold">
                          ₹{item.price * item.quantity}
                        </Text>
                      </View>
                    ))}
                </View>
                <View className="flex-row gap-2 mt-3 flex-wrap">
                  {ACTIONS.map((action) => {
                    const isCurrent = restaurantStatus === action.status;
                    return (
                      <Pressable
                        key={action.status}
                        onPress={() => void handleStatus(order, action.status)}
                        disabled={isCurrent || updatingId === order._id}
                        className={`rounded-full border px-3 py-1.5 ${
                          isCurrent || updatingId === order._id
                            ? "opacity-40"
                            : "active:opacity-80"
                        } ${statusStyle(action.status)}`}
                      >
                        <Text className="text-[11px] font-sans-bold">
                          {action.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}
