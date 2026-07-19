import {
  Alert,
  FlatList,
  Image,
  Linking,
  Modal,
  Pressable,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCart, type CartItem } from "../context/CartContext";
import { PHONE_NUMBER } from "./OrderBottomSheet";

interface CartSheetProps {
  visible: boolean;
  onClose: () => void;
}

export default function CartSheet({ visible, onClose }: CartSheetProps) {
  const { items, total, itemCount, increment, decrement, removeItem, clearCart } =
    useCart();

  const buildWhatsAppMessage = () => {
    let msg = "🛒 *New Order*\n\n";
    msg += "━━━━━━━━━━━━━━━━\n";
    items.forEach((item, idx) => {
      msg += `${idx + 1}. *${item.subcategory.name}*\n`;
      msg += `   ${item.category.name} × ${item.quantity} = ₹${item.subcategory.price * item.quantity}\n`;
    });
    msg += "━━━━━━━━━━━━━━━━\n";
    msg += `💰 *Total: ₹${total}*\n`;
    msg += `📦 Items: ${itemCount}\n`;
    msg += `💳 Payment: Cash on Delivery\n\n`;
    msg += "Please confirm this order. Thank you!";
    return msg;
  };

  const handlePlaceOrder = () => {
    if (items.length === 0) return;
    const message = buildWhatsAppMessage();
    const url = `https://wa.me/${PHONE_NUMBER}?text=${encodeURIComponent(message)}`;
    Linking.openURL(url).then(() => {
      clearCart();
      onClose();
    }).catch(() => {
      Alert.alert("Error", "Could not open WhatsApp. Please install WhatsApp.");
    });
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
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-gray-50 rounded-t-3xl" style={{ maxHeight: "80%" }}>
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
                <View className="flex-row justify-between items-center mb-1">
                  <Text className="text-sm text-gray-500">Subtotal</Text>
                  <Text className="text-sm text-gray-700">₹{total}</Text>
                </View>
                <View className="flex-row justify-between items-center mb-1">
                  <Text className="text-sm text-gray-500">Delivery</Text>
                  <Text className="text-sm text-gray-700">Free</Text>
                </View>
                <View className="flex-row justify-between items-center mb-4 border-t border-gray-100 pt-3">
                  <Text className="text-lg font-bold text-gray-900">Total</Text>
                  <Text className="text-lg font-bold text-blue-600">₹{total}</Text>
                </View>

                <View className="flex-row items-center gap-2 mb-4 bg-amber-50 rounded-lg px-3 py-2">
                  <Ionicons name="cash-outline" size={18} color="#D97706" />
                  <Text className="text-sm text-amber-700 font-medium">
                    Cash on Delivery only
                  </Text>
                </View>

                <Pressable
                  onPress={handlePlaceOrder}
                  className="bg-[#25D366] rounded-xl py-4 flex-row items-center justify-center gap-2 active:bg-[#1ebe57]"
                >
                  <Ionicons name="logo-whatsapp" size={22} color="white" />
                  <Text className="text-white text-base font-bold">
                    Order on WhatsApp — ₹{total}
                  </Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
