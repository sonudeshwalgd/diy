import QRCode from "react-native-qrcode-svg";
import { View } from "react-native";

interface Props {
  value: string;
  size?: number;
}



export default function QRCodeGenerator({ value, size = 200 }: Props) {
  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <QRCode value={value} size={size} />
    </View>
  );
}
