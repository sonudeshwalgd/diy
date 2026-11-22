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
import { ActiveOrdersProvider } from "../context/ActiveOrdersContext";
import ApiLogSync from "../components/ApiLogSync";
import ActivityTrackerSync from "../components/ActivityTrackerSync";
import AppErrorBoundary from "../components/AppErrorBoundary";
import VercelAnalytics from "../components/VercelAnalytics";
import { setApiLogContext } from "../services/apiLogStore";
import { getUserToken } from "../services/userToken";
import { installAppErrorHandlers } from "../services/appErrorStore";

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
    void getUserToken()
      .then((visitorId) => setApiLogContext({ visitorId }))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => installAppErrorHandlers(), []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AppErrorBoundary>
      <GestureHandlerRootView className="flex-1">
        <CartProvider>
          <DisabledItemsProvider>
            <ActiveOrdersProvider>
              <ApiLogSync />
              <ActivityTrackerSync />
              <VercelAnalytics />
              <StatusBar style="dark" />
              <Stack>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="about" options={{ title: "About" }} />
                <Stack.Screen name="privacy" options={{ title: "Privacy Policy" }} />
                <Stack.Screen name="feedback" options={{ title: "Feedback", headerShown: false }} />
                <Stack.Screen name="items/disabled" options={{ headerShown: false }} />
                <Stack.Screen name="orders" options={{ headerShown: false }} />
              </Stack>
            </ActiveOrdersProvider>
          </DisabledItemsProvider>
        </CartProvider>
      </GestureHandlerRootView>
    </AppErrorBoundary>
  );
}
