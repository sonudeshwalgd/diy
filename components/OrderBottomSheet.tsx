import {
  Linking,
  Modal,
  Pressable,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export const PHONE_NUMBER = "918445231980";
const WHATSAPP_MESSAGE = "Hi, I'd like to place an order.";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function OrderBottomSheet({ visible, onClose }: Props) {
  const handleCall = () => {
    Linking.openURL(`tel:${PHONE_NUMBER}`);
  };

  const handleWhatsApp = () => {
    const url = `https://wa.me/${PHONE_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
    Linking.openURL(url);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white rounded-t-3xl px-6 pt-6 pb-10 items-center">
          <View className="w-10 h-1 bg-gray-300 rounded-full mb-5" />

          <Text className="text-lg font-semibold text-gray-900 text-center">
            To place an order, please call on this number
          </Text>

          <Text className="text-2xl font-bold text-blue-600 mt-4">
            +{PHONE_NUMBER}
          </Text>

          <Pressable
            onPress={handleCall}
            className="mt-6 bg-green-600 rounded-full px-8 py-3 flex-row items-center gap-2"
          >
            <Ionicons name="call" size={20} color="white" />
            <Text className="text-white text-base font-semibold">Call Now</Text>
          </Pressable>

          <Pressable
            onPress={handleWhatsApp}
            className="mt-4 bg-[#25D366] rounded-full px-8 py-3 flex-row items-center gap-2"
          >
            <Ionicons name="logo-whatsapp" size={22} color="white" />
            <Text className="text-white text-base font-semibold">
              Chat on WhatsApp
            </Text>
          </Pressable>

          <Pressable onPress={onClose} className="mt-6">
            <Text className="text-gray-400 text-sm">Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
