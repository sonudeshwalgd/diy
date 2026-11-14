import {
  Linking,
  Pressable,
  Text,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Sheet from "./Sheet";

export const PHONE_NUMBER = "919068222172";

interface Props {
  visible: boolean;
  onClose: () => void;
  tableNumber?: string;
}

export default function OrderBottomSheet({ visible, onClose, tableNumber }: Props) {
  const handleCall = () => {
    Linking.openURL(`tel:${PHONE_NUMBER}`);
  };

  const handleWhatsApp = () => {
    const message = tableNumber
      ? `Hi, I'd like to place an order.\n\n🍽️ *Table No:* ${tableNumber}`
      : "Hi, I'd like to place an order.";
    const url = `https://wa.me/${PHONE_NUMBER}?text=${encodeURIComponent(message)}`;
    Linking.openURL(url);
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      sheetClassName="px-6 pt-1 pb-10 items-center"
    >
          <Text className="text-lg font-sans-semibold text-gray-900 text-center">
            To place an order, please call on this number
          </Text>

          <Text className="text-2xl font-sans-bold text-orange-600 mt-4">
            +{PHONE_NUMBER}
          </Text>

          <Pressable
            onPress={handleCall}
            className="mt-6 bg-green-600 rounded-full px-8 py-3 flex-row items-center gap-2"
          >
            <Ionicons name="call" size={20} color="white" />
            <Text className="text-white text-base font-sans-semibold">Call Now</Text>
          </Pressable>

          <Pressable
            onPress={handleWhatsApp}
            className="mt-4 bg-[#25D366] rounded-full px-8 py-3 flex-row items-center gap-2"
          >
            <Ionicons name="logo-whatsapp" size={22} color="white" />
            <Text className="text-white text-base font-sans-semibold">
              Chat on WhatsApp
            </Text>
          </Pressable>

          <Pressable onPress={onClose} className="mt-6">
            <Text className="text-gray-400 text-sm">Close</Text>
          </Pressable>
    </Sheet>
  );
}
