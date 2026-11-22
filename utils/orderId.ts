import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import { ApiError, getOrderById } from "../services/api";
import { setApiLogContext } from "../services/apiLogStore";
import { getUserToken } from "../services/userToken";

export const CUSTOMER_MOBILE_KEY = "diy_customer_mobile";
export const LAST_ORDER_ID_KEY = "diy_last_order_id";
export const ORDER_IDS_KEY = "diy_order_ids";

const CUSTOMER_CODE_LENGTH = 4;
const ORDER_CODE_LENGTH = 8;

function customerCodeFromToken(token: string): string {
  const cleaned = token.replace(/[^0-9a-z]/gi, "").toUpperCase();
  if (!cleaned) {
    return Crypto.randomUUID()
      .replace(/-/g, "")
      .slice(0, CUSTOMER_CODE_LENGTH)
      .toUpperCase();
  }
  return cleaned.slice(-CUSTOMER_CODE_LENGTH).padStart(CUSTOMER_CODE_LENGTH, "0");
}

export async function generateOrderId(): Promise<string> {
  let token: string;
  try {
    token = await getUserToken();
  } catch {
    token = Crypto.randomUUID();
  }
  const customerCode = customerCodeFromToken(token);
  const orderCode = Crypto.randomUUID()
    .replace(/-/g, "")
    .slice(0, ORDER_CODE_LENGTH)
    .toUpperCase();
  return `${orderCode}-${customerCode}`;
}

export async function getStoredOrderIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(ORDER_IDS_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return Array.from(
      new Set(parsed.filter((id): id is string => typeof id === "string" && !!id.trim()))
    );
  } catch {
    return [];
  }
}

export async function saveLastOrderId(orderId: string): Promise<void> {
  const id = orderId.trim();
  if (!id) return;
  try {
    const ids = await getStoredOrderIds();
    if (!ids.includes(id)) {
      await AsyncStorage.setItem(ORDER_IDS_KEY, JSON.stringify([...ids, id]));
    }
    await AsyncStorage.setItem(LAST_ORDER_ID_KEY, id);
    setApiLogContext({ lastOrderId: id });
  } catch {
    return;
  }
}

export async function removeStoredOrderIds(orderIds: string[]): Promise<void> {
  if (orderIds.length === 0) return;
  try {
    const remove = new Set(orderIds);
    const ids = (await getStoredOrderIds()).filter((id) => !remove.has(id));
    await AsyncStorage.setItem(ORDER_IDS_KEY, JSON.stringify(ids));
    const lastOrderId = await AsyncStorage.getItem(LAST_ORDER_ID_KEY);
    if (lastOrderId && remove.has(lastOrderId)) {
      await AsyncStorage.removeItem(LAST_ORDER_ID_KEY);
      setApiLogContext({ lastOrderId: null });
    }
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
    const { order } = await getOrderById(orderId, { silentNotFound: true });
    const mobile = order.customerMobile?.trim();
    if (!mobile) return null;
    await AsyncStorage.setItem(CUSTOMER_MOBILE_KEY, mobile);
    setApiLogContext({ customerMobile: mobile, lastOrderId: orderId });
    return mobile;
  } catch (error) {
    const notFound =
      error instanceof ApiError &&
      (error.status === 404 || error.message.toLowerCase().includes("not found"));
    if (notFound) await removeStoredOrderIds([orderId]);
    return null;
  }
}
