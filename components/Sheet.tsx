import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
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
    <Pressable onPress={onClose} className="flex-1 justify-end bg-black/25">
      <Pressable
        onPress={() => {}}
        className="overflow-hidden"
        style={[{ borderTopLeftRadius: 28, borderTopRightRadius: 28 }, sheetStyle]}
      >
        <BlurView
          intensity={70}
          tint="light"
          experimentalBlurMethod="dimezisBlurView"
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={["rgba(255,255,255,0.72)", "rgba(255,255,255,0.55)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View className="items-center pt-2 pb-0.5">
          <View className="w-9 h-1 bg-gray-900/20 rounded-full" />
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
