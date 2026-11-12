import "../global.css";

import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { CartProvider } from "../context/CartContext";
import { DisabledItemsProvider } from "../context/DisabledItemsContext";
import VercelAnalytics from "../components/VercelAnalytics";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView className="flex-1">
      <CartProvider>
        <DisabledItemsProvider>
          <VercelAnalytics />
          <StatusBar style="dark" />
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="about" options={{ title: "About" }} />
            <Stack.Screen name="privacy" options={{ title: "Privacy Policy" }} />
            <Stack.Screen name="feedback" options={{ title: "Feedback", headerShown: false }} />
            <Stack.Screen name="items/disabled" options={{ headerShown: false }} />
          </Stack>
        </DisabledItemsProvider>
      </CartProvider>
    </GestureHandlerRootView>
  );
}
