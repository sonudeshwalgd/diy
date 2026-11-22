import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useState, useEffect, useRef, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCart, type CartItem } from "../context/CartContext";
import { getItemPrice } from "../data/products";
import { getDeliveryCharge } from "../utils/delivery";
import {
  CUSTOMER_MOBILE_KEY,
  LAST_ORDER_ID_KEY,
  generateOrderId,
} from "../utils/orderId";
import { useActiveOrders } from "../context/ActiveOrdersContext";
import { setApiLogContext } from "../services/apiLogStore";
import {
  markOrderPlaced,
  trackCheckoutStart,
  trackImpression,
} from "../services/activityTracker";
import { PHONE_NUMBER } from "./OrderBottomSheet";
import {
  checkDuplicateOrder,
  getCustomer,
  placeOrder,
  COIN_EARN_RATE,
  type AdminOrder,
  type CustomerInfo,
} from "../services/api";
import DuplicateOrderSheet from "./DuplicateOrderSheet";
import Sheet from "./Sheet";

interface CartSheetProps {
  visible: boolean;
  onClose: () => void;
  tableNumber?: string;
  counterNumber?: string;
  sourceLabel?: string;
  queryParams?: Record<string, string>;
  insideRestaurant?: boolean;
  onViewOrder: (orderId: string) => void;
}

export default function CartSheet({
  visible,
  onClose,
  tableNumber,
  counterNumber,
  sourceLabel,
  queryParams,
  insideRestaurant,
  onViewOrder,
}: CartSheetProps) {
  const { items, total, itemCount, increment, decrement, removeItem, clearCart } =
    useCart();
  const { rememberOrderId } = useActiveOrders();

  const [mobile, setMobile] = useState("");
  const [savedMobile, setSavedMobile] = useState<string | null>(null);
  const [customer, setCustomer] = useState<CustomerInfo | null>(null);
  const [loadingCustomer, setLoadingCustomer] = useState(false);
  const [coinsToUse, setCoinsToUse] = useState(0);
  const [placing, setPlacing] = useState(false);
  const [duplicateOrder, setDuplicateOrder] = useState<AdminOrder | null>(null);
  const [showMobileInput, setShowMobileInput] = useState(false);
  const [loyaltyError, setLoyaltyError] = useState<string | null>(null);
  const pendingOrderIdRef = useRef<string | null>(null);
  const placingRef = useRef(false);

  const fetchCustomer = useCallback(async (m: string) => {
    setLoadingCustomer(true);
    setLoyaltyError(null);
    try {
      const data = await getCustomer(m);
      setCustomer(data);
      setSavedMobile(m);
      setMobile(m);
      setShowMobileInput(false);
      setCoinsToUse(0);
      await AsyncStorage.setItem(CUSTOMER_MOBILE_KEY, m);
      setApiLogContext({ customerMobile: m });
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message.toLowerCase().includes("not found")) {
        setCustomer({
          mobileNumber: m,
          totalCoins: 0,
          totalOrders: 0,
          lifetimeSpent: 0,
        });
        setSavedMobile(m);
        setMobile(m);
        setShowMobileInput(false);
        setCoinsToUse(0);
        await AsyncStorage.setItem(CUSTOMER_MOBILE_KEY, m);
        setApiLogContext({ customerMobile: m });
        return;
      }
      setCustomer(null);
      setSavedMobile(null);
      setShowMobileInput(true);
      setLoyaltyError("Could not load loyalty points. Please try again.");
      setCoinsToUse(0);
    } finally {
      setLoadingCustomer(false);
    }
  }, []);

  const closeSheet = () => {
    setShowMobileInput(false);
    setLoyaltyError(null);
    pendingOrderIdRef.current = null;
    onClose();
  };

  const handleClose = () => {
    if (placingRef.current) return;
    closeSheet();
  };

  useEffect(() => {
    if (!visible) return;
    trackImpression({
      type: "cart_view",
      name: "Opened cart",
      value: total,
      quantity: itemCount,
    });
    AsyncStorage.getItem(CUSTOMER_MOBILE_KEY).then((m) => {
      if (m) {
        setMobile(m);
        setShowMobileInput(false);
        void fetchCustomer(m);
      }
    });
  }, [visible, fetchCustomer, total, itemCount]);

  const handleMobileSubmit = async () => {
    const cleaned = mobile.trim();
    if (cleaned.length !== 10 || !/^\d{10}$/.test(cleaned)) {
      Alert.alert("Invalid Number", "Please enter a valid 10-digit mobile number.");
      return;
    }
    await fetchCustomer(cleaned);
  };

  const maxRedeemable = customer
    ? Math.min(customer.totalCoins, Math.floor(total))
    : 0;

  const appliedCoins = Math.min(coinsToUse, maxRedeemable);
  const coinsDiscount = appliedCoins;
  const deliveryCharge = insideRestaurant ? 0 : getDeliveryCharge(total);
  const finalTotal = Math.max(0, total - coinsDiscount) + deliveryCharge;
  const coinsEarned = Math.floor(finalTotal * (COIN_EARN_RATE / 100));

  const buildWhatsAppMessage = (orderId: string) => {
    let msg = "🛒 *New Order*\n";
    msg += `🧾 *Order ID:* ${orderId}\n\n`;
    if (tableNumber) {
      msg += `🍽️ *Table No:* ${tableNumber}\n`;
    }
    if (counterNumber) {
      msg += `🔢 *Counter No:* ${counterNumber}\n`;
    }
    msg += `📱 *Customer Mobile:* ${savedMobile || "N/A"}\n\n`;
    msg += "━━━━━━━━━━━━━━━━\n";
    items.forEach((item, idx) => {
      msg += `${idx + 1}. *${item.subcategory.name}*\n`;
      msg += `   ${item.category.name} × ${item.quantity} = ₹${getItemPrice(item.subcategory) * item.quantity}\n`;
    });
    msg += "━━━━━━━━━━━━━━━━\n";
    msg += `💰 *Original Total:* ₹${total}\n`;
    if (coinsDiscount > 0) {
      msg += `🪙 *Coins Used:* ${appliedCoins} (−₹${coinsDiscount})\n`;
    }
    if (!insideRestaurant) {
      msg += `🛵 *Delivery:* ${deliveryCharge === 0 ? "Free" : `₹${deliveryCharge}`}\n`;
    }
    msg += `🪙 *Coins Earned:* ${coinsEarned}\n`;
    msg += `💵 *Final Total:* ₹${finalTotal}\n`;
    msg += `📦 Items: ${itemCount}\n`;
    msg += `💳 Payment: Cash on Delivery\n\n`;
    msg += "Please confirm this order. Thank you!";
    return msg;
  };

  const findDuplicateOrder = async (): Promise<AdminOrder | null> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      return await checkDuplicateOrder(
        items.map((item) => ({
          itemId: item.subcategory.id,
          quantity: item.quantity,
        })),
        savedMobile || undefined,
        controller.signal
      );
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  };

  const submitOrder = async () => {
    if (placingRef.current) return;
    placingRef.current = true;
    setPlacing(true);

    const orderId = pendingOrderIdRef.current ?? generateOrderId();
    pendingOrderIdRef.current = orderId;
    const message = buildWhatsAppMessage(orderId);
    const orderPayload = {
      orderId,
      customerMobile: savedMobile || undefined,
      items: items.map((i) => ({
        itemId: i.subcategory.id,
        name: i.subcategory.name,
        price: getItemPrice(i.subcategory),
        quantity: i.quantity,
      })),
      subtotal: total,
      totalAmount: total + deliveryCharge,
      deliveryFee: deliveryCharge,
      coinsUsed: savedMobile ? appliedCoins : 0,
      paymentMethod: "cod",
      whatsappMessage: message,
      tableNumber,
      counterNumber,
      utmSource: queryParams?.utm_source,
      insideRestaurant: !!insideRestaurant,
      queryParams,
    };
    const url = `https://wa.me/${PHONE_NUMBER}?text=${encodeURIComponent(message)}`;

    trackCheckoutStart({
      value: finalTotal,
      quantity: itemCount,
      metadata: {
        itemCount,
        subtotal: total,
        deliveryCharge,
        coinsDiscount,
        insideRestaurant: !!insideRestaurant,
        tableNumber: tableNumber ?? null,
        counterNumber: counterNumber ?? null,
        items: orderPayload.items,
      },
    });

    let result: Awaited<ReturnType<typeof placeOrder>>;
    try {
      result = await placeOrder(orderPayload);
    } catch {
      trackImpression({
        type: "order_failed",
        name: "Order save failed",
        value: finalTotal,
        quantity: itemCount,
        metadata: { orderId, items: orderPayload.items },
      });
      Alert.alert(
        "Order not saved",
        "We could not save your order. Please try again."
      );
      placingRef.current = false;
      setPlacing(false);
      return;
    }

    await rememberOrderId(orderId, result.order);

    await markOrderPlaced({
      orderId,
      items: items.map((item) => ({
        id: item.subcategory.id,
        name: item.subcategory.name,
        price: getItemPrice(item.subcategory),
        quantity: item.quantity,
      })),
      total: finalTotal,
      itemCount,
    });

    if (result.idempotent) {
      clearCart();
      placingRef.current = false;
      closeSheet();
      setPlacing(false);
      Alert.alert(
        "Order already placed",
        "This order was already saved. It was not sent again."
      );
      return;
    }

    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(
        "WhatsApp not available",
        "Your order was saved. Please open WhatsApp and contact the outlet to confirm."
      );
    }

    clearCart();
    placingRef.current = false;
    closeSheet();
    setPlacing(false);
  };

  const handlePlaceOrder = async () => {
    if (items.length === 0 || placingRef.current) return;

    placingRef.current = true;
    setPlacing(true);

    const duplicate = await findDuplicateOrder();
    if (duplicate) {
      placingRef.current = false;
      setPlacing(false);
      setDuplicateOrder(duplicate);
      return;
    }

    placingRef.current = false;
    setPlacing(false);
    await submitOrder();
  };

  const handleViewPrevious = () => {
    const order = duplicateOrder;
    setDuplicateOrder(null);
    closeSheet();
    if (order) onViewOrder(order.orderId || order._id);
  };

  const handlePlaceNew = () => {
    setDuplicateOrder(null);
    void submitOrder();
  };

  const renderItem = ({ item }: { item: CartItem }) => (
    <View className="flex-row items-center bg-white/85 rounded-3xl p-3 mb-3 mx-4 border border-white/80">
      <Image
        source={item.subcategory.image || item.category.image}
        style={{
          width: 64,
          height: 64,
          borderRadius: 12,
          backgroundColor: "#F5F5F4",
        }}
        resizeMode="contain"
      />
      <View className="flex-1 ml-3">
        <Text className="text-xs text-gray-400">{item.category.name}</Text>
        <Text className="text-base font-sans-semibold text-gray-900" numberOfLines={2}>
          {item.subcategory.name}
        </Text>
        <Text className="text-base text-orange-600 font-sans-extrabold mt-0.5">
          ₹{getItemPrice(item.subcategory)} × {item.quantity}
        </Text>
      </View>

      <View className="flex-row items-center gap-2 mr-2">
        <Pressable
          onPress={() => decrement(item.subcategory.id)}
          className="w-8 h-8 rounded-full bg-gray-200 items-center justify-center"
        >
          <Ionicons name="remove" size={16} color="#374151" />
        </Pressable>
        <Text className="text-sm font-sans-bold text-gray-900 w-5 text-center">
          {item.quantity}
        </Text>
        <Pressable
          onPress={() => increment(item.subcategory.id)}
          className="w-8 h-8 rounded-full bg-orange-600 items-center justify-center"
        >
          <Ionicons name="add" size={16} color="white" />
        </Pressable>
      </View>

      <Pressable
        onPress={() => removeItem(item.subcategory.id)}
        className="ml-1"
      >
        <Ionicons name="trash-outline" size={18} color="#EF4444" />
      </Pressable>
    </View>
  );

  return (
    <>
    <Sheet
      visible={visible}
      onClose={handleClose}
      keyboardAvoiding
      sheetClassName=""
      sheetStyle={{ maxHeight: "85%" }}
    >
      <View className="px-5 pt-2 pb-3 flex-row items-center justify-between">
              <View>
                <Text className="text-xl font-sans-bold text-gray-900">Your Cart</Text>
                <View className="flex-row items-center gap-2 mt-0.5">
                  <Text className="text-sm text-gray-500">
                    {itemCount} {itemCount === 1 ? "item" : "items"}
                  </Text>
                  {customer && customer.totalCoins > 0 && (
                    <View className="bg-amber-100 rounded-full px-2 py-0.5 flex-row items-center gap-1">
                      <Ionicons name="wallet-outline" size={11} color="#B45309" />
                      <Text className="text-[11px] font-sans-bold text-amber-700">
                        ₹{customer.totalCoins}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              <Pressable onPress={handleClose} className="p-1">
                <Ionicons name="close" size={24} color="#6B7280" />
              </Pressable>
            </View>

            {items.length === 0 ? (
              <View className="items-center py-16">
                <Ionicons name="cart-outline" size={64} color="#D1D5DB" />
                <Text className="text-gray-400 text-base mt-4">Your cart is empty</Text>
              </View>
            ) : (
              <>
                <FlatList
                  data={items}
                  keyExtractor={(item) => item.subcategory.id}
                  renderItem={renderItem}
                  contentContainerStyle={{ paddingVertical: 8 }}
                  showsVerticalScrollIndicator={false}
                  style={{ flexShrink: 1 }}
                  ListFooterComponent={
                <View className="bg-white/85 rounded-t-3xl px-5 pt-4 pb-3 border-t border-white/60">
                  {/* Loyalty */}
                  <View className="mb-4">
                    {loadingCustomer ? (
                      <View className="bg-amber-50 rounded-2xl px-4 py-3.5 border border-amber-200 flex-row items-center gap-3">
                        <ActivityIndicator size="small" color="#D97706" />
                        <Text className="text-sm text-amber-800 font-sans-medium">
                          Checking loyalty points…
                        </Text>
                      </View>
                    ) : savedMobile && customer ? (
                      <View className="bg-amber-50 rounded-2xl px-4 py-3 border border-amber-200">
                        <View className="flex-row items-center justify-between mb-2">
                          <View className="flex-row items-center gap-2">
                            <Ionicons name="wallet-outline" size={18} color="#D97706" />
                            <Text className="text-sm font-sans-semibold text-amber-800">
                              Loyalty Points
                            </Text>
                          </View>
                          <Pressable
                            onPress={() => {
                              setSavedMobile(null);
                              setCustomer(null);
                              setCoinsToUse(0);
                              setShowMobileInput(false);
                              setLoyaltyError(null);
                              AsyncStorage.removeItem(CUSTOMER_MOBILE_KEY);
                              AsyncStorage.removeItem(LAST_ORDER_ID_KEY);
                              setApiLogContext({ customerMobile: null, lastOrderId: null });
                            }}
                          >
                            <Text className="text-amber-600 text-xs font-sans-medium">Change</Text>
                          </Pressable>
                        </View>

                        <View className="flex-row items-end justify-between">
                          <Text className="text-xs text-amber-700">
                            📱 {savedMobile}
                          </Text>
                          <Text className="text-2xl font-sans-extrabold text-amber-800">
                            ₹{customer.totalCoins}
                          </Text>
                        </View>

                        {maxRedeemable > 0 ? (
                          <View className="mt-2.5">
                            <Text className="text-xs text-amber-700 mb-1.5">
                              {appliedCoins > 0
                                ? `Using ₹${appliedCoins} of ₹${maxRedeemable}`
                                : `You can use up to ₹${maxRedeemable}`}
                            </Text>
                            <View className="flex-row items-center gap-2">
                              <Pressable
                                onPress={() => setCoinsToUse(0)}
                                className={`flex-1 rounded-xl py-2 items-center ${
                                  appliedCoins === 0
                                    ? "bg-amber-600"
                                    : "bg-white border border-amber-300"
                                }`}
                              >
                                <Text
                                  className={`text-xs font-sans-semibold ${
                                    appliedCoins === 0 ? "text-white" : "text-amber-700"
                                  }`}
                                >
                                  Do not use
                                </Text>
                              </Pressable>
                              <Pressable
                                onPress={() => setCoinsToUse(maxRedeemable)}
                                className={`flex-1 rounded-xl py-2 items-center ${
                                  appliedCoins === maxRedeemable
                                    ? "bg-amber-600"
                                    : "bg-white border border-amber-300"
                                }`}
                              >
                                <Text
                                  className={`text-xs font-sans-semibold ${
                                    appliedCoins === maxRedeemable
                                      ? "text-white"
                                      : "text-amber-700"
                                  }`}
                                >
                                  Use all ₹{maxRedeemable}
                                </Text>
                              </Pressable>
                            </View>
                          </View>
                        ) : customer.totalCoins === 0 ? (
                          <Text className="text-xs text-amber-600 mt-2">
                            Place orders to earn coins ({COIN_EARN_RATE}% back)
                          </Text>
                        ) : null}
                      </View>
                    ) : showMobileInput ? (
                      <View className="bg-white rounded-2xl px-4 py-3.5 border border-amber-200">
                        <View className="flex-row items-center gap-2 mb-2.5">
                          <View className="w-8 h-8 rounded-full bg-amber-100 items-center justify-center">
                            <Ionicons name="wallet-outline" size={16} color="#D97706" />
                          </View>
                          <View className="flex-1">
                            <Text className="text-sm font-sans-semibold text-gray-900">
                              Check loyalty points
                            </Text>
                            <Text className="text-[11px] text-gray-500 mt-0.5">
                              Enter your registered mobile number
                            </Text>
                          </View>
                        </View>

                        <View className="flex-row items-center gap-2">
                          <View className="flex-row items-center gap-1.5 bg-stone-100 rounded-xl px-3 py-2.5">
                            <Ionicons name="call-outline" size={15} color="#D97706" />
                            <Text className="text-sm font-sans-semibold text-gray-700">
                              +91
                            </Text>
                          </View>
                          <TextInput
                            className="flex-1 bg-stone-100 rounded-xl px-3 py-2.5 text-sm text-gray-900"
                            placeholder="10-digit mobile number"
                            placeholderTextColor="#9CA3AF"
                            keyboardType="numeric"
                            maxLength={10}
                            value={mobile}
                            onChangeText={setMobile}
                            autoFocus
                          />
                        </View>

                        <Pressable
                          onPress={handleMobileSubmit}
                          disabled={loadingCustomer}
                          className={`mt-2.5 rounded-xl py-2.5 flex-row items-center justify-center gap-2 ${
                            loadingCustomer
                              ? "bg-amber-300"
                              : "bg-amber-500 active:bg-amber-600"
                          }`}
                        >
                          {loadingCustomer ? (
                            <ActivityIndicator size="small" color="white" />
                          ) : (
                            <Ionicons name="search" size={16} color="white" />
                          )}
                          <Text className="text-white text-sm font-sans-bold">
                            {loadingCustomer ? "Checking..." : "Check Points"}
                          </Text>
                        </Pressable>

                        {loyaltyError && (
                          <Text className="text-xs text-red-500 mt-2">
                            {loyaltyError}
                          </Text>
                        )}

                        <Pressable
                          onPress={() => {
                            setShowMobileInput(false);
                            setMobile("");
                            setLoyaltyError(null);
                          }}
                          className="mt-2 items-center"
                        >
                          <Text className="text-xs text-gray-400">Skip</Text>
                        </Pressable>
                      </View>
                    ) : (
                      <Pressable
                        onPress={() => setShowMobileInput(true)}
                        className="bg-amber-50 rounded-2xl px-4 py-3.5 border border-amber-200 flex-row items-center justify-between"
                      >
                        <View className="flex-row items-center gap-3">
                          <View className="bg-amber-100 rounded-full w-10 h-10 items-center justify-center">
                            <Ionicons name="wallet-outline" size={20} color="#D97706" />
                          </View>
                          <View>
                            <Text className="text-sm font-sans-semibold text-gray-900">
                              Have Loyalty Coins?
                            </Text>
                            <Text className="text-xs text-gray-500 mt-0.5">
                              Tap to enter number & get discount
                            </Text>
                          </View>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color="#D97706" />
                      </Pressable>
                    )}
                  </View>

                  {/* Pricing */}
                  <View className="flex-row justify-between items-center mb-1">
                    <Text className="text-sm text-gray-500">Subtotal</Text>
                    <Text className="text-base font-sans-semibold text-gray-900">
                      ₹{total}
                    </Text>
                  </View>

                  {coinsDiscount > 0 && (
                    <View className="flex-row justify-between items-center mb-1">
                      <Text className="text-sm text-green-600">Coins Discount</Text>
                      <Text className="text-sm text-green-600">−₹{coinsDiscount}</Text>
                    </View>
                  )}

                  {!insideRestaurant && (
                    <View className="flex-row justify-between items-center mb-1">
                      <Text className="text-sm text-gray-500">Delivery</Text>
                      <Text
                        className={`text-sm ${
                          deliveryCharge === 0
                            ? "text-green-600 font-sans-semibold"
                            : "text-gray-700"
                        }`}
                      >
                        {deliveryCharge === 0 ? "Free" : `₹${deliveryCharge}`}
                      </Text>
                    </View>
                  )}
                </View>
                  }
                />

                <View className="bg-white/85 px-5 pt-3 pb-5 border-t border-white/60">
                  <View className="flex-row justify-between items-center mb-1">
                    <Text className="text-lg font-sans-bold text-gray-900">Final Total</Text>
                    <Text className="text-2xl font-sans-extrabold text-orange-600">₹{finalTotal}</Text>
                  </View>

                  {appliedCoins === 0 && maxRedeemable > 0 && (
                    <View className="flex-row justify-between items-center mb-1">
                      <Text className="text-xs text-gray-400">You will earn</Text>
                      <Text className="text-xs text-green-600 font-sans-medium">
                        🪙 {Math.floor(total * (COIN_EARN_RATE / 100))} coins
                      </Text>
                    </View>
                  )}

                  {coinsDiscount > 0 && (
                    <View className="flex-row justify-between items-center mb-3">
                      <Text className="text-xs text-gray-400">You will earn</Text>
                      <Text className="text-xs text-green-600 font-sans-medium">
                        🪙 {coinsEarned} coins
                      </Text>
                    </View>
                  )}

                  <View className="flex-row items-center gap-2 mb-4 bg-amber-50 rounded-lg px-3 py-2">
                    <Ionicons name="cash-outline" size={18} color="#D97706" />
                    <Text className="text-sm text-amber-700 font-sans-medium">
                      {insideRestaurant
                        ? `Cash on Delivery · No delivery fee${sourceLabel ? ` · ${sourceLabel}` : ""}`
                        : "Cash on Delivery & ₹0 delivery fee above ₹149 in Graphic Era"}
                    </Text>
                  </View>

                  <Pressable
                    onPress={handlePlaceOrder}
                    disabled={placing}
                    className={`rounded-xl py-4 flex-row items-center justify-center gap-2 ${
                      placing ? "bg-gray-400" : "bg-[#25D366] active:bg-[#1ebe57]"
                    }`}
                  >
                    <Ionicons name="logo-whatsapp" size={22} color="white" />
                    <Text className="text-white text-base font-sans-bold">
                      {placing
                        ? "Placing Order..."
                        : `Order on WhatsApp — ₹${finalTotal}`}
                    </Text>
                  </Pressable>
                </View>
              </>
            )}
    </Sheet>
    <DuplicateOrderSheet
      visible={!!duplicateOrder}
      order={duplicateOrder}
      onViewPrevious={handleViewPrevious}
      onPlaceNew={handlePlaceNew}
      onDismiss={() => setDuplicateOrder(null)}
    />
    </>
  );
}
