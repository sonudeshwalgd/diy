const API_BASE = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5001/api";

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
}

export interface OrderHistoryResponse {
  customer: CustomerInfo;
  orders: OrderHistoryOrder[];
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
}

export interface FeedbackResponse {
  feedback: {
    _id: string;
    orderId?: string;
    customerMobile?: string;
    rating: number;
    message: string;
    anonymous: boolean;
    createdAt: string;
  };
}

export const placeOrder = async (payload: PlaceOrderPayload): Promise<PlaceOrderResponse> => {
  const res = await fetch(`${API_BASE}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
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
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to submit feedback");
  }
  return res.json();
};
