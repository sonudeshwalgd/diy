import { BlurView } from "expo-blur";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  sheetClassName?: string;
  sheetStyle?: StyleProp<ViewStyle>;
  keyboardAvoiding?: boolean;
}

export default function Sheet({
  visible,
  onClose,
  children,
  sheetClassName = "",
  sheetStyle,
  keyboardAvoiding = false,
}: SheetProps) {
  const content = (
    <Pressable onPress={onClose} className="flex-1 justify-end bg-black/40">
      <Pressable
        onPress={() => {}}
        className="overflow-hidden"
        style={[{ borderTopLeftRadius: 28, borderTopRightRadius: 28 }, sheetStyle]}
      >
        <BlurView
          intensity={60}
          tint="light"
          experimentalBlurMethod="dimezisBlurView"
          style={StyleSheet.absoluteFill}
        />
        <View style={StyleSheet.absoluteFill} className="bg-white/85" />
        <View className="items-center pt-2.5 pb-1">
          <View className="w-10 h-1.5 bg-gray-900/15 rounded-full" />
        </View>
        <View className={sheetClassName}>{children}</View>
      </Pressable>
    </Pressable>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      {keyboardAvoiding ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1"
        >
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </Modal>
  );
}
