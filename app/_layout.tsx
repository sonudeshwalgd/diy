import "../global.css";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { CartProvider } from "../context/CartContext";

export default function RootLayout() {
  return (
    <GestureHandlerRootView className="flex-1">
      <CartProvider>
        <StatusBar style="auto" />
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="about" options={{ title: "About" }} />
        </Stack>
      </CartProvider>
    </GestureHandlerRootView>
  );
}
