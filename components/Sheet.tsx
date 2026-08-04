import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
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
  sheetClassName,
  sheetStyle,
  keyboardAvoiding = false,
}: SheetProps) {
  const content = (
    <Pressable onPress={onClose} className="flex-1 justify-end bg-black/50">
      <Pressable
        onPress={() => {}}
        className={sheetClassName}
        style={sheetStyle}
      >
        {children}
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
