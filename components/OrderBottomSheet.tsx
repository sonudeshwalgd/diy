import { useEffect, useRef } from "react";
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
  counterNumber?: string;
}

export default function OrderBottomSheet({
  visible,
  onClose,
  tableNumber,
  counterNumber,
}: Props) {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => onCloseRef.current(), 2000);
    return () => clearTimeout(timer);
  }, [visible]);

  const handleWhatsApp = () => {
    const sourceLine = tableNumber
      ? `🍽️ *Table No:* ${tableNumber}`
      : counterNumber
        ? `🔢 *Counter No:* ${counterNumber}`
        : null;
    const message = sourceLine
      ? `Hi, I'd like to place an order.\n\n${sourceLine}`
      : "Hi, I'd like to place an order.";
    const url = `https://wa.me/${PHONE_NUMBER}?text=${encodeURIComponent(message)}`;
    Linking.openURL(url);
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      sheetClassName="px-6 pt-0 pb-5 items-center"
    >
          <Text className="text-sm font-sans-medium text-stone-600 text-center">
            To place an order, tap below
          </Text>

          <Pressable
            onPress={handleWhatsApp}
            className="mt-3 bg-[#25D366] rounded-full px-8 py-2.5 flex-row items-center gap-2"
          >
            <Ionicons name="logo-whatsapp" size={20} color="white" />
            <Text className="text-sm font-sans-semibold text-white">
              Order on WhatsApp
            </Text>
          </Pressable>
    </Sheet>
  );
}
