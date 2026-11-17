import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useDisabledItems } from "../context/DisabledItemsContext";
import { getAllOrders, type AdminOrder } from "../services/api";

function sourceLabel(order: AdminOrder): string {
  if (order.tableNumber) return `Table ${order.tableNumber}`;
  if (order.counterNumber) return `Counter ${order.counterNumber}`;
  return "Delivery";
}

export default function OrdersScreen() {
  const router = useRouter();
  const { unlock, lock, unlocked, verifying } = useDisabledItems();

  const [staffKey, setStaffKey] = useState("");
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const hasAccess = unlocked && staffKey.length > 0;

  useEffect(() => {
    return () => {
      void lock();
    };
  }, [lock]);

  const fetchOrders = useCallback(async (key: string) => {
    const data = await getAllOrders(key);
    return data.orders;
  }, []);

  const handleLoadError = useCallback(
    (err: unknown) => {
      const message = err instanceof Error ? err.message : "Could not load orders";
      if (message.toLowerCase().includes("invalid staff key")) {
        setStaffKey("");
        setOrders([]);
        void lock();
        setUnlockError("That staff key is not valid. Please try again.");
      } else {
        setLoadError(message);
      }
    },
    [lock]
  );

  useEffect(() => {
    if (!unlocked || !staffKey) return;

    let active = true;
    fetchOrders(staffKey)
      .then((data) => {
        if (!active) return;
        setOrders(data);
        setLoadError(null);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!active) return;
        handleLoadError(err);
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [unlocked, staffKey, fetchOrders, handleLoadError]);

  const handleUnlock = async () => {
    const ok = await unlock(staffKey);
    if (!ok) {
      setUnlockError("That staff key is not valid. Please try again.");
      return;
    }
    setUnlockError(null);
    setLoading(true);
  };

  const handleRefresh = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchOrders(staffKey);
      setOrders(data);
    } catch (err) {
      handleLoadError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLock = () => {
    setStaffKey("");
    setOrders([]);
    setUnlockError(null);
    void lock();
  };

  return (
    <View className="flex-1 bg-stone-100">
      <SafeAreaView edges={["top"]} className="bg-white/90 border-b border-stone-200">
        <View className="px-4 py-3 flex-row items-center gap-3">
          <Pressable
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/");
              }
            }}
            className="p-2 rounded-full bg-stone-100 active:opacity-80"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={20} color="#57534E" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-lg font-sans-extrabold text-stone-900 tracking-tight">
              Orders Management
            </Text>
            <Text className="text-[11px] text-stone-500 font-sans-medium">
              Staff access to all orders
            </Text>
          </View>
          {hasAccess && (
            <>
              <Pressable
                onPress={() => void handleRefresh()}
                className="p-2 rounded-full bg-orange-100 active:opacity-80"
                accessibilityLabel="Refresh orders"
              >
                <Ionicons name="refresh" size={19} color="#EA580C" />
              </Pressable>
              <Pressable
                onPress={handleLock}
                className="p-2 rounded-full bg-stone-100 active:opacity-80"
                accessibilityLabel="Lock staff access"
              >
                <Ionicons name="lock-closed-outline" size={19} color="#57534E" />
              </Pressable>
            </>
          )}
        </View>
      </SafeAreaView>

      {!hasAccess ? (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <View
            className="bg-white rounded-3xl p-6 border border-white"
            style={{
              shadowColor: "#78716C",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 10,
              elevation: 2,
            }}
          >
            <View className="w-14 h-14 rounded-2xl bg-orange-100 items-center justify-center mb-4">
              <Ionicons name="lock-closed" size={26} color="#EA580C" />
            </View>
            <Text className="text-xl font-sans-extrabold text-stone-900">
              Staff access
            </Text>
            <Text className="text-sm text-stone-500 font-sans-medium mt-1 leading-5">
              Enter your staff key to view and manage all customer orders.
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

            {unlockError && (
              <View className="flex-row items-center gap-2 mt-3">
                <Ionicons name="alert-circle" size={16} color="#DC2626" />
                <Text className="text-xs text-red-600 font-sans-semibold flex-1">
                  {unlockError}
                </Text>
              </View>
            )}

            <Pressable
              onPress={() => void handleUnlock()}
              disabled={verifying || !staffKey.trim()}
              className={`mt-4 rounded-2xl py-3.5 items-center justify-center flex-row gap-2 ${
                verifying || !staffKey.trim()
                  ? "bg-stone-300"
                  : "bg-orange-600 active:opacity-90"
              }`}
            >
              {verifying ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="key" size={17} color="white" />
                  <Text className="text-white text-sm font-sans-bold">
                    Unlock orders
                  </Text>
                </>
              )}
            </Pressable>
          </View>

          <View className="flex-row items-start gap-2 mt-5 px-2">
            <Ionicons name="information-circle-outline" size={16} color="#78716C" />
            <Text className="text-[11px] text-stone-500 font-sans-medium flex-1 leading-4">
              Ask the outlet manager if you do not have a staff key. The same key
              used for item availability unlocks orders.
            </Text>
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-sm text-stone-500 font-sans-semibold">
              {loading ? "Loading orders…" : `${orders.length} orders`}
            </Text>
            {loading && <ActivityIndicator size="small" color="#EA580C" />}
          </View>

          {loadError && (
            <View className="flex-row items-center gap-2 mb-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
              <Ionicons name="alert-circle" size={16} color="#DC2626" />
              <Text className="text-xs text-red-700 font-sans-semibold flex-1">
                {loadError}
              </Text>
            </View>
          )}

          {!loading && orders.length === 0 && !loadError ? (
            <View className="bg-white rounded-3xl py-14 items-center border border-white">
              <Ionicons name="receipt-outline" size={48} color="#D6D3D1" />
              <Text className="text-stone-400 text-sm mt-3 font-sans-medium">
                No orders yet
              </Text>
            </View>
          ) : (
            orders.map((order) => (
              <View
                key={order._id}
                className="bg-white rounded-3xl p-4 mb-3 border border-white"
              >
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-sans-extrabold text-stone-900">
                    #{order._id.slice(-6).toUpperCase()}
                  </Text>
                  <View className="bg-emerald-50 rounded-full px-2.5 py-1">
                    <Text className="text-[10px] font-sans-bold text-emerald-700">
                      {order.orderStatus}
                    </Text>
                  </View>
                </View>

                <Text className="text-[11px] text-stone-400 font-sans-medium mt-1">
                  {new Date(order.createdAt).toLocaleString()}
                </Text>

                <View className="flex-row items-center gap-2 mt-2 flex-wrap">
                  <View className="bg-orange-50 rounded-full px-2.5 py-1">
                    <Text className="text-[10px] font-sans-bold text-orange-700">
                      {sourceLabel(order)}
                    </Text>
                  </View>
                  {order.customerMobile ? (
                    <Text className="text-[11px] text-stone-600 font-sans-medium">
                      📱 {order.customerMobile}
                    </Text>
                  ) : null}
                  {order.customerName ? (
                    <Text className="text-[11px] text-stone-600 font-sans-medium">
                      {order.customerName}
                    </Text>
                  ) : null}
                </View>

                <View className="border-t border-stone-100 mt-3 pt-3">
                  {order.items.map((item, index) => (
                    <View
                      key={`${order._id}-${index}`}
                      className="flex-row items-center justify-between mb-1"
                    >
                      <Text className="text-xs text-stone-600 font-sans-medium flex-1">
                        {item.name} × {item.quantity}
                      </Text>
                      <Text className="text-xs text-stone-800 font-sans-semibold">
                        ₹{item.price * item.quantity}
                      </Text>
                    </View>
                  ))}
                </View>

                <View className="border-t border-stone-100 mt-2 pt-2">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-[11px] text-stone-500 font-sans-medium">
                      Delivery
                    </Text>
                    <Text className="text-[11px] text-stone-700 font-sans-semibold">
                      ₹{order.deliveryFee ?? 0}
                    </Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm font-sans-bold text-stone-900">
                      Final total
                    </Text>
                    <Text className="text-base font-sans-extrabold text-orange-600">
                      ₹{order.finalAmount}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}
