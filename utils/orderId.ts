import AsyncStorage from "@react-native-async-storage/async-storage";
import { getOrderById } from "../services/api";

export const CUSTOMER_MOBILE_KEY = "diy_customer_mobile";
export const LAST_ORDER_ID_KEY = "diy_last_order_id";

export function generateOrderId(): string {
  const now = new Date();
  const date = `${String(now.getFullYear()).slice(-2)}${String(
    now.getMonth() + 1
  ).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const suffix = `${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2, 6)}`.toUpperCase();
  return `DIY-${date}-${suffix}`;
}

export async function saveLastOrderId(orderId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_ORDER_ID_KEY, orderId);
  } catch {
    return;
  }
}

export async function resolveCustomerMobile(): Promise<string | null> {
  const saved = await AsyncStorage.getItem(CUSTOMER_MOBILE_KEY);
  if (saved) return saved;

  const orderId = await AsyncStorage.getItem(LAST_ORDER_ID_KEY);
  if (!orderId) return null;

  try {
    const { order } = await getOrderById(orderId);
    const mobile = order.customerMobile?.trim();
    if (!mobile) return null;
    await AsyncStorage.setItem(CUSTOMER_MOBILE_KEY, mobile);
    return mobile;
  } catch {
    return null;
  }
}
