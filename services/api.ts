import { apiFetch, ApiError } from "./apiClient";
import { getUserToken } from "./userToken";
import { setApiLogContext } from "./apiLogStore";

export { ApiError };
export const ADMIN_MOBILE = process.env.EXPO_PUBLIC_ADMIN_MOBILE || "";
export const COIN_EARN_RATE = Number(process.env.EXPO_PUBLIC_COIN_EARN_RATE || 5);
export const FEEDBACK_POINTS = Number(process.env.EXPO_PUBLIC_FEEDBACK_POINTS || 5);

export interface BackendOrderItem {
  itemId?: string;
  name: string;
  price: number;
  quantity: number;
  restaurant?: string;
}

export interface PlaceOrderPayload {
  orderId: string;
  customerMobile?: string;
  customerName?: string;
  items: BackendOrderItem[];
  subtotal?: number;
  totalAmount: number;
  deliveryFee?: number;
  coinsUsed: number;
  paymentMethod?: string;
  whatsappMessage?: string;
  tableNumber?: string;
  counterNumber?: string;
  utmSource?: string;
  insideRestaurant?: boolean;
  queryParams?: Record<string, string>;
  coinEarnRate?: number;
}

export interface PlaceOrderResponse {
  order: {
    _id: string;
    orderId?: string;
    customerMobile: string;
    items: BackendOrderItem[];
    totalAmount: number;
    discountApplied: number;
    coinsUsed: number;
    coinsEarned: number;
    finalAmount: number;
    orderStatus: string;
    createdAt: string;
  };
  updatedCoins: number;
  idempotent?: boolean;
}

export interface CustomerInfo {
  mobileNumber: string;
  totalCoins: number;
  totalOrders: number;
  lifetimeSpent: number;
}

export interface OrderHistoryOrder {
  _id: string;
  orderId?: string;
  items: BackendOrderItem[];
  totalAmount: number;
  discountApplied: number;
  coinsUsed: number;
  coinsEarned: number;
  finalAmount: number;
  orderStatus: string;
  createdAt: string;
  feedbackGiven?: boolean;
  feedback?: {
    rating: number;
    message: string;
    anonymous: boolean;
    createdAt: string;
  } | null;
}

export interface OrderHistoryResponse {
  customer: CustomerInfo;
  orders: OrderHistoryOrder[];
}

export interface AdminOrder extends OrderHistoryOrder {
  customerMobile?: string;
  customerName?: string;
  subtotal?: number;
  deliveryFee?: number;
  tableNumber?: string;
  counterNumber?: string;
  utmSource?: string;
  insideRestaurant?: boolean;
  orderSource?: string;
  whatsappMessage?: string;
}

export interface AdminOrdersResponse {
  orders: AdminOrder[];
}

export interface AnalyticsDay {
  date: string;
  orders: number;
  itemsSold: number;
  revenue: number;
}

export interface AnalyticsItem {
  name: string;
  quantity: number;
  revenue: number;
  restaurant?: string;
}

export interface OrderAnalytics {
  daily: AnalyticsDay[];
  lifetime: { orders: number; itemsSold: number; revenue: number };
  items: AnalyticsItem[];
}

export interface SingleOrderResponse {
  order: AdminOrder;
}

export interface RedeemResponse {
  usableDiscount: number;
  coinsUsed: number;
  availableCoins: number;
}

export interface FeedbackPayload {
  orderId?: string;
  customerMobile?: string;
  rating: number;
  message?: string;
  anonymous?: boolean;
  feedbackPoints?: number;
}

export interface FeedbackRecord {
  _id: string;
  orderId?: string;
  customerMobile?: string;
  rating: number;
  message: string;
  anonymous: boolean;
  createdAt: string;
}

export interface FeedbackResponse {
  feedback: FeedbackRecord;
}

export interface FeedbackListResponse {
  feedback: FeedbackRecord[];
}

export interface DisabledItemsResponse {
  itemIds: string[];
}

export interface HiddenItemsResponse {
  itemIds: string[];
}

export interface PopularItemsResponse {
  items: { name: string; quantity: number }[];
}

const disabledItemsPath = (restaurant?: string) =>
  restaurant === "diy_chineese" ? "/items/disabled/diy_chineese" : "/items/disabled";

const hiddenItemsPath = (restaurant?: string) =>
  restaurant === "diy_chineese" ? "/items/hidden/diy_chineese" : "/items/hidden";

export const getDisabledItems = async (
  restaurant?: string
): Promise<DisabledItemsResponse> => {
  const res = await apiFetch(disabledItemsPath(restaurant));
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to fetch disabled items");
  }
  return res.json();
};

export const verifyStaffKey = async (
  staffKey: string,
  restaurant?: string
): Promise<boolean> => {
  const res = await apiFetch(`${disabledItemsPath(restaurant)}/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ staffKey }),
  });
  if (!res.ok) {
    throw new Error("Could not verify staff key");
  }
  const data = await res.json();
  return Boolean(data.valid);
};

export const saveDisabledItems = async (
  itemIds: string[],
  staffKey: string,
  restaurant?: string
): Promise<DisabledItemsResponse> => {
  const res = await apiFetch(disabledItemsPath(restaurant), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ itemIds, staffKey }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to save disabled items");
  }
  return res.json();
};

export const getHiddenItems = async (
  restaurant?: string
): Promise<HiddenItemsResponse> => {
  const res = await apiFetch(hiddenItemsPath(restaurant));
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to fetch hidden items");
  }
  return res.json();
};

export const saveHiddenItems = async (
  itemIds: string[],
  staffKey: string,
  restaurant?: string
): Promise<HiddenItemsResponse> => {
  const res = await apiFetch(hiddenItemsPath(restaurant), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ itemIds, staffKey }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to save hidden items");
  }
  return res.json();
};

export const placeOrder = async (payload: PlaceOrderPayload): Promise<PlaceOrderResponse> => {
  let userToken: string | undefined;
  try {
    userToken = await getUserToken();
    setApiLogContext({ visitorId: userToken });
  } catch (error) {
    console.warn("Could not attach user token to order", error);
  }

  const res = await apiFetch("/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, coinEarnRate: COIN_EARN_RATE, userToken }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to place order");
  }
  return res.json();
};

export const getCustomer = async (mobile: string): Promise<CustomerInfo> => {
  const res = await apiFetch(`/customer/${mobile}`, {}, { silentStatuses: [404] });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Customer not found");
  }
  return res.json();
};

export const getOrderHistory = async (mobile: string): Promise<OrderHistoryResponse> => {
  const res = await apiFetch(`/orders/${mobile}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to fetch orders");
  }
  return res.json();
};

export interface DuplicateCheckItem {
  itemId?: string;
  quantity: number;
  restaurant?: string;
}

export const checkDuplicateOrder = async (
  items: DuplicateCheckItem[],
  mobile?: string,
  signal?: AbortSignal
): Promise<AdminOrder | null> => {
  const res = await apiFetch("/orders/duplicate-check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items, customerMobile: mobile }),
    signal,
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to check duplicate order");
  }
  const data: { order?: AdminOrder | null } = await res.json();
  return data.order ?? null;
};

export const getTodaysOrders = async (
  staffKey: string
): Promise<AdminOrdersResponse> => {
  const res = await apiFetch("/orders", {
    cache: "no-store",
    headers: { "x-staff-key": staffKey },
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to fetch orders");
  }
  return res.json();
};

export const getOrderAnalytics = async (
  staffKey: string
): Promise<OrderAnalytics> => {
  const res = await apiFetch("/orders/analytics", {
    cache: "no-store",
    headers: { "x-staff-key": staffKey },
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to fetch analytics");
  }
  return res.json();
};

export type OrderStatus = "placed" | "accepted" | "cancelled" | "delivered";

export const updateOrderStatus = async (
  orderId: string,
  staffKey: string,
  status: OrderStatus
): Promise<{ order: AdminOrder }> => {
  const res = await apiFetch(
    `/orders/${encodeURIComponent(orderId)}/status`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-staff-key": staffKey,
      },
      body: JSON.stringify({ status }),
    }
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to update order");
  }
  return res.json();
};

export const getOrderById = async (
  orderId: string,
  options: { silentNotFound?: boolean } = {}
): Promise<SingleOrderResponse> => {
  const res = await apiFetch(
    `/order/${encodeURIComponent(orderId)}`,
    {},
    options.silentNotFound ? { silentStatuses: [404] } : undefined
  );
  if (!res.ok) {
    const err = await res.json();
    throw new ApiError(err.error || "Failed to fetch order", res.status);
  }
  return res.json();
};

export const getPopularItems = async (): Promise<PopularItemsResponse> => {
  const res = await apiFetch("/orders/popular");
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to fetch popular items");
  }
  return res.json();
};

export const redeemCoinsAPI = async (
  mobileNumber: string,
  coinsToUse: number,
  orderTotal: number
): Promise<RedeemResponse> => {
  const res = await apiFetch("/redeem-coins", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mobileNumber, coinsToUse, orderTotal }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to redeem coins");
  }
  return res.json();
};

export const submitFeedback = async (
  payload: FeedbackPayload
): Promise<FeedbackResponse> => {
  const res = await apiFetch("/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, feedbackPoints: FEEDBACK_POINTS }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to submit feedback");
  }
  return res.json();
};

export const getAllFeedback = async (customerMobile?: string): Promise<FeedbackListResponse> => {
  const params = new URLSearchParams();
  if (ADMIN_MOBILE) params.set("adminMobile", ADMIN_MOBILE);
  if (customerMobile) params.set("customerMobile", customerMobile);
  const query = params.toString();
  const res = await apiFetch(`/zxcvbnm55${query ? `?${query}` : ""}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to fetch feedback");
  }
  return res.json();
};
