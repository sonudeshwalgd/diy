import { useState } from "react";
import { Clipboard, Modal, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import QRCodeGenerator from "../utils/QRCodeGenerator";

const WIFI_SSID = "DIY_Shop";
const WIFI_PASSWORD = "Nitio@123";
const WIFI_QR_VALUE = `WIFI:T:WPA;S:${WIFI_SSID};P:${WIFI_PASSWORD};;`;

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function WifiBottomSheet({ visible, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    Clipboard.setString(WIFI_PASSWORD);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white rounded-t-3xl px-6 pt-6 pb-10 items-center">
          <View className="w-10 h-1 bg-gray-300 rounded-full mb-5" />

          <View className="bg-blue-50 rounded-full p-3 mb-4">
            <Ionicons name="wifi" size={28} color="#2563EB" />
          </View>

          <Text className="text-lg font-semibold text-gray-900 text-center">
            Connect to our Wi-Fi
          </Text>
          <Text className="text-sm text-gray-500 mt-1">
            Scan the QR code or copy the password
          </Text>

          <View className="bg-white rounded-2xl p-4 mt-5 shadow-sm border border-gray-100">
            <QRCodeGenerator value={WIFI_QR_VALUE} size={180} />
          </View>

          <Text className="text-xs text-gray-400 mt-3">
            Network: {WIFI_SSID}
          </Text>

          <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3 mt-4 w-full">
            <Text className="text-gray-900 text-lg font-mono flex-1">
              {WIFI_PASSWORD}
            </Text>
            <Pressable
              onPress={handleCopy}
              className="bg-blue-600 rounded-lg px-4 py-2 flex-row items-center gap-1.5"
            >
              <Ionicons
                name={copied ? "checkmark" : "copy"}
                size={16}
                color="white"
              />
              <Text className="text-white text-sm font-semibold">
                {copied ? "Copied!" : "Copy"}
              </Text>
            </Pressable>
          </View>

          <Pressable onPress={onClose} className="mt-6">
            <Text className="text-gray-400 text-sm">Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
