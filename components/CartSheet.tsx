import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCart, type CartItem } from "../context/CartContext";
import { PHONE_NUMBER } from "./OrderBottomSheet";
import {
  getCustomer,
  placeOrder,
  type CustomerInfo,
} from "../services/api";

interface CartSheetProps {
  visible: boolean;
  onClose: () => void;
}

const MOBILE_KEY = "diy_customer_mobile";

export default function CartSheet({ visible, onClose }: CartSheetProps) {
  const { items, total, itemCount, increment, decrement, removeItem, clearCart } =
    useCart();

  const [mobile, setMobile] = useState("");
  const [savedMobile, setSavedMobile] = useState<string | null>(null);
  const [customer, setCustomer] = useState<CustomerInfo | null>(null);
  const [loadingCustomer, setLoadingCustomer] = useState(false);
  const [coinsToUse, setCoinsToUse] = useState(0);
  const [placing, setPlacing] = useState(false);
  const [showMobileInput, setShowMobileInput] = useState(false);

  useEffect(() => {
    if (visible) {
      AsyncStorage.getItem(MOBILE_KEY).then((m) => {
        if (m) {
          setSavedMobile(m);
          setMobile(m);
          fetchCustomer(m);
          setShowMobileInput(false);
        }
      });
    } else {
      setShowMobileInput(false);
    }
  }, [visible]);

  const fetchCustomer = async (m: string) => {
    setLoadingCustomer(true);
    try {
      const data = await getCustomer(m);
      setCustomer(data);
      setCoinsToUse(0);
    } catch {
      setCustomer(null);
    } finally {
      setLoadingCustomer(false);
    }
  };

  const handleMobileSubmit = async () => {
    const cleaned = mobile.trim();
    if (cleaned.length !== 10 || !/^\d{10}$/.test(cleaned)) {
      Alert.alert("Invalid Number", "Please enter a valid 10-digit mobile number.");
      return;
    }
    await AsyncStorage.setItem(MOBILE_KEY, cleaned);
    setSavedMobile(cleaned);
    await fetchCustomer(cleaned);
  };

  const maxRedeemable = Math.min(
    Math.floor(total * 0.5),
    customer?.totalCoins || 0
  );

  const coinsDiscount = coinsToUse;
  const finalTotal = Math.max(0, total - coinsDiscount);
  const coinsEarned = Math.floor(finalTotal * 0.05);

  const buildWhatsAppMessage = () => {
    let msg = "🛒 *New Order*\n\n";
    msg += `📱 *Customer Mobile:* ${savedMobile || "N/A"}\n\n`;
    msg += "━━━━━━━━━━━━━━━━\n";
    items.forEach((item, idx) => {
      msg += `${idx + 1}. *${item.subcategory.name}*\n`;
      msg += `   ${item.category.name} × ${item.quantity} = ₹${item.subcategory.price * item.quantity}\n`;
    });
    msg += "━━━━━━━━━━━━━━━━\n";
    msg += `💰 *Original Total:* ₹${total}\n`;
    if (coinsDiscount > 0) {
      msg += `🪙 *Coins Used:* ${coinsToUse} (−₹${coinsDiscount})\n`;
    }
    msg += `🪙 *Coins Earned:* ${coinsEarned}\n`;
    msg += `💵 *Final Total:* ₹${finalTotal}\n`;
    msg += `📦 Items: ${itemCount}\n`;
    msg += `💳 Payment: Cash on Delivery\n\n`;
    msg += "Please confirm this order. Thank you!";
    return msg;
  };

  const handlePlaceOrder = async () => {
    if (items.length === 0) return;

    setPlacing(true);
    try {
      const message = buildWhatsAppMessage();
      const result = await placeOrder({
        customerMobile: savedMobile || undefined,
        items: items.map((i) => ({
          name: i.subcategory.name,
          price: i.subcategory.price,
          quantity: i.quantity,
        })),
        totalAmount: total,
        coinsUsed: savedMobile ? coinsToUse : 0,
        paymentMethod: "cod",
        whatsappMessage: message,
      });

      const url = `https://wa.me/${PHONE_NUMBER}?text=${encodeURIComponent(message)}`;
      await Linking.openURL(url);
      clearCart();
      onClose();
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to place order";
      Alert.alert("Error", msg);
    } finally {
      setPlacing(false);
    }
  };

  const renderItem = ({ item }: { item: CartItem }) => (
    <View className="flex-row items-center bg-white rounded-xl p-3 mb-3 mx-4 border border-gray-100">
      <Image
        source={{ uri: item.category.image }}
        className="w-12 h-12 rounded-lg"
        resizeMode="cover"
      />
      <View className="flex-1 ml-3">
        <Text className="text-xs text-gray-400">{item.category.name}</Text>
        <Text className="text-sm font-semibold text-gray-900">
          {item.subcategory.name}
        </Text>
        <Text className="text-sm text-blue-600 font-bold mt-0.5">
          ₹{item.subcategory.price} × {item.quantity}
        </Text>
      </View>

      <View className="flex-row items-center gap-2 mr-2">
        <Pressable
          onPress={() => decrement(item.subcategory.id)}
          className="w-7 h-7 rounded-full bg-gray-200 items-center justify-center"
        >
          <Ionicons name="remove" size={16} color="#374151" />
        </Pressable>
        <Text className="text-sm font-bold text-gray-900 w-5 text-center">
          {item.quantity}
        </Text>
        <Pressable
          onPress={() => increment(item.subcategory.id)}
          className="w-7 h-7 rounded-full bg-blue-600 items-center justify-center"
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
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-gray-50 rounded-t-3xl" style={{ maxHeight: "85%" }}>
            <View className="px-5 pt-5 pb-3 flex-row items-center justify-between">
              <View>
                <Text className="text-xl font-bold text-gray-900">Your Cart</Text>
                <Text className="text-sm text-gray-500 mt-0.5">
                  {itemCount} {itemCount === 1 ? "item" : "items"}
                </Text>
              </View>
              <Pressable onPress={onClose} className="p-1">
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
                />

                <View className="bg-white rounded-t-2xl px-5 pt-4 pb-8 border-t border-gray-200">
                  {/* Use Coins Button / Verified */}
                  {savedMobile && customer ? (
                    <View className="mb-4 bg-amber-50 rounded-xl px-4 py-3 border border-amber-200">
                      <View className="flex-row items-center justify-between mb-1">
                        <View className="flex-row items-center gap-2">
                          <Ionicons name="wallet-outline" size={18} color="#D97706" />
                          <Text className="text-sm font-semibold text-amber-800">
                            Loyalty Coins
                          </Text>
                        </View>
                        <Pressable
                          onPress={() => {
                            setSavedMobile(null);
                            setCustomer(null);
                            setCoinsToUse(0);
                            setShowMobileInput(false);
                            AsyncStorage.removeItem(MOBILE_KEY);
                          }}
                        >
                          <Text className="text-amber-600 text-xs font-medium">Change</Text>
                        </Pressable>
                      </View>
                      <View className="flex-row items-center justify-between">
                        <Text className="text-xs text-amber-700">
                          📱 {savedMobile}
                        </Text>
                        <Text className="text-sm font-bold text-amber-800">
                          🪙 {customer.totalCoins} coins = ₹{customer.totalCoins}
                        </Text>
                      </View>
                    </View>
                  ) : !showMobileInput ? (
                    <Pressable
                      onPress={() => setShowMobileInput(true)}
                      className="mb-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl px-4 py-3.5 border border-amber-200 flex-row items-center justify-between"
                    >
                      <View className="flex-row items-center gap-3">
                        <View className="bg-amber-100 rounded-full w-10 h-10 items-center justify-center">
                          <Ionicons name="wallet-outline" size={20} color="#D97706" />
                        </View>
                        <View>
                          <Text className="text-sm font-semibold text-gray-900">
                            Have Loyalty Coins?
                          </Text>
                          <Text className="text-xs text-gray-500 mt-0.5">
                            Tap to enter number & get discount
                          </Text>
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color="#D97706" />
                    </Pressable>
                  ) : null}

                  {/* Mobile Input (shown when tapping Use Coins) */}
                  {showMobileInput && !savedMobile && (
                    <View className="mb-4">
                      <View className="flex-row items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                        <Text className="text-gray-400 text-lg">+91</Text>
                        <TextInput
                          className="flex-1 text-sm text-gray-900"
                          placeholder="Enter 10-digit mobile number"
                          keyboardType="numeric"
                          maxLength={10}
                          value={mobile}
                          onChangeText={setMobile}
                          autoFocus
                        />
                        <Pressable
                          onPress={handleMobileSubmit}
                          className="bg-amber-500 rounded-lg px-3 py-1.5"
                          disabled={loadingCustomer}
                        >
                          <Text className="text-white text-xs font-semibold">
                            {loadingCustomer ? "..." : "Apply"}
                          </Text>
                        </Pressable>
                      </View>
                      <Pressable
                        onPress={() => {
                          setShowMobileInput(false);
                          setMobile("");
                        }}
                        className="mt-1.5 items-center"
                      >
                        <Text className="text-xs text-gray-400">Skip</Text>
                      </Pressable>
                    </View>
                  )}

                  {/* Coins Section */}
                  {customer && (
                    <View className="mb-4 bg-amber-50 rounded-lg px-3 py-3 border border-amber-200">
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-sm font-semibold text-amber-800">
                          🪙 Available Coins: {customer.totalCoins}
                        </Text>
                        <Text className="text-xs text-amber-600">
                          = ₹{customer.totalCoins}
                        </Text>
                      </View>

                      {maxRedeemable > 0 && (
                        <View>
                          <Text className="text-xs text-amber-700 mb-1.5">
                            Max redeemable: {maxRedeemable} coins (50% of order)
                          </Text>
                          <View className="flex-row items-center gap-2">
                            <Pressable
                              onPress={() => setCoinsToUse(0)}
                              className={`rounded-lg px-3 py-1.5 ${
                                coinsToUse === 0
                                  ? "bg-amber-600"
                                  : "bg-white border border-amber-300"
                              }`}
                            >
                              <Text
                                className={`text-xs font-medium ${
                                  coinsToUse === 0 ? "text-white" : "text-amber-700"
                                }`}
                              >
                                None
                              </Text>
                            </Pressable>
                            <Pressable
                              onPress={() => setCoinsToUse(maxRedeemable)}
                              className={`rounded-lg px-3 py-1.5 ${
                                coinsToUse === maxRedeemable
                                  ? "bg-amber-600"
                                  : "bg-white border border-amber-300"
                              }`}
                            >
                              <Text
                                className={`text-xs font-medium ${
                                  coinsToUse === maxRedeemable
                                    ? "text-white"
                                    : "text-amber-700"
                                }`}
                              >
                                Max ({maxRedeemable})
                              </Text>
                            </Pressable>
                          </View>
                        </View>
                      )}

                      {maxRedeemable === 0 && customer.totalCoins > 0 && (
                        <Text className="text-xs text-amber-600">
                          Order total too low to redeem coins
                        </Text>
                      )}
                      {customer.totalCoins === 0 && (
                        <Text className="text-xs text-amber-600">
                          Place orders to earn coins (5% back)
                        </Text>
                      )}
                    </View>
                  )}

                  {/* Pricing */}
                  <View className="flex-row justify-between items-center mb-1">
                    <Text className="text-sm text-gray-500">Subtotal</Text>
                    <Text className="text-sm text-gray-700">₹{total}</Text>
                  </View>

                  {coinsDiscount > 0 && (
                    <View className="flex-row justify-between items-center mb-1">
                      <Text className="text-sm text-green-600">Coins Discount</Text>
                      <Text className="text-sm text-green-600">−₹{coinsDiscount}</Text>
                    </View>
                  )}

                  <View className="flex-row justify-between items-center mb-1">
                    <Text className="text-sm text-gray-500">Delivery</Text>
                    <Text className="text-sm text-gray-700">Free</Text>
                  </View>

                  <View className="flex-row justify-between items-center mb-1 border-t border-gray-100 pt-2">
                    <Text className="text-lg font-bold text-gray-900">Final Total</Text>
                    <Text className="text-lg font-bold text-blue-600">₹{finalTotal}</Text>
                  </View>

                  {coinsToUse === 0 && maxRedeemable > 0 && (
                    <View className="flex-row justify-between items-center mb-1">
                      <Text className="text-xs text-gray-400">You'll earn</Text>
                      <Text className="text-xs text-green-600 font-medium">
                        🪙 {Math.floor(total * 0.05)} coins
                      </Text>
                    </View>
                  )}

                  {coinsDiscount > 0 && (
                    <View className="flex-row justify-between items-center mb-3">
                      <Text className="text-xs text-gray-400">You'll earn</Text>
                      <Text className="text-xs text-green-600 font-medium">
                        🪙 {coinsEarned} coins
                      </Text>
                    </View>
                  )}

                  <View className="flex-row items-center gap-2 mb-4 bg-amber-50 rounded-lg px-3 py-2">
                    <Ionicons name="cash-outline" size={18} color="#D97706" />
                    <Text className="text-sm text-amber-700 font-medium">
                      Cash on Delivery only
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
                    <Text className="text-white text-base font-bold">
                      {placing
                        ? "Placing Order..."
                        : `Order on WhatsApp — ₹${finalTotal}`}
                    </Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
