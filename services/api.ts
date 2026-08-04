const API_BASE = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5001/api";
const ADMIN_MOBILE = process.env.EXPO_PUBLIC_ADMIN_MOBILE || "";
export const COIN_EARN_RATE = Number(process.env.EXPO_PUBLIC_COIN_EARN_RATE || 5);
export const FEEDBACK_POINTS = Number(process.env.EXPO_PUBLIC_FEEDBACK_POINTS || 5);

export interface BackendOrderItem {
  name: string;
  price: number;
  quantity: number;
}

export interface PlaceOrderPayload {
  customerMobile?: string;
  customerName?: string;
  items: BackendOrderItem[];
  totalAmount: number;
  coinsUsed: number;
  paymentMethod?: string;
  whatsappMessage?: string;
  coinEarnRate?: number;
}

export interface PlaceOrderResponse {
  order: {
    _id: string;
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
}

export interface CustomerInfo {
  mobileNumber: string;
  totalCoins: number;
  totalOrders: number;
  lifetimeSpent: number;
}

export interface OrderHistoryOrder {
  _id: string;
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

export interface SingleOrderResponse {
  order: OrderHistoryOrder;
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

export const placeOrder = async (payload: PlaceOrderPayload): Promise<PlaceOrderResponse> => {
  const res = await fetch(`${API_BASE}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, coinEarnRate: COIN_EARN_RATE }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to place order");
  }
  return res.json();
};

export const getCustomer = async (mobile: string): Promise<CustomerInfo> => {
  const res = await fetch(`${API_BASE}/customer/${mobile}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Customer not found");
  }
  return res.json();
};

export const getOrderHistory = async (mobile: string): Promise<OrderHistoryResponse> => {
  const res = await fetch(`${API_BASE}/orders/${mobile}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to fetch orders");
  }
  return res.json();
};

export const getOrderById = async (orderId: string): Promise<SingleOrderResponse> => {
  const res = await fetch(`${API_BASE}/order/${orderId}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to fetch order");
  }
  return res.json();
};

export const redeemCoinsAPI = async (
  mobileNumber: string,
  coinsToUse: number,
  orderTotal: number
): Promise<RedeemResponse> => {
  const res = await fetch(`${API_BASE}/redeem-coins`, {
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
  const res = await fetch(`${API_BASE}/feedback`, {
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
  const res = await fetch(`${API_BASE}/zxcvbnm55${query ? `?${query}` : ""}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to fetch feedback");
  }
  return res.json();
};
