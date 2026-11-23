import * as Linking from "expo-linking";
import { Alert } from "react-native";
import {
  getOrderPayment,
  type AdminOrder,
  type OrderPaymentDetails,
} from "../services/api";

const MERCHANT_NAME = "DIY Drinks";

export const isPaymentComplete = (
  payment: OrderPaymentDetails | null,
  order?: AdminOrder | null
): boolean =>
  payment?.paymentStatus === "paid" ||
  order?.paymentStatus === "paid" ||
  (payment?.payableAmount ?? Infinity) <= 0 ||
  (order?.remainingAmount !== undefined && order.remainingAmount <= 0);

export interface OutstandingBill {
  payments: OrderPaymentDetails[];
  total: number;
  vpa: string | null;
}

export const fetchOutstandingBill = async (
  orderIds: string[]
): Promise<OutstandingBill> => {
  const results = await Promise.all(
    orderIds.map(async (id) => {
      try {
        return await getOrderPayment(id);
      } catch {
        return null;
      }
    })
  );
  const payments = results.filter(
    (payment): payment is OrderPaymentDetails =>
      !!payment && !isPaymentComplete(payment)
  );
  return {
    payments,
    total: Math.round(payments.reduce((sum, item) => sum + item.payableAmount, 0) * 100) / 100,
    vpa: payments[0]?.upi.vpa ?? null,
  };
};

export const buildUpiUri = (vpa: string, amount: number, reference: string): string => {
  const params: [string, string][] = [
    ["pa", vpa],
    ["pn", MERCHANT_NAME],
    ["am", amount.toFixed(2)],
    ["cu", "INR"],
    ["tr", reference],
    ["tn", `${MERCHANT_NAME} Bill ${reference}`.slice(0, 50)],
  ];
  return `upi://pay?${params
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&")}`;
};

export const buildBillReference = (payments: OrderPaymentDetails[]): string =>
  `BILL-${payments.map((payment) => payment.orderId).join("-")}`.slice(0, 50);

export interface EntireBillPaymentResult extends OutstandingBill {
  started: boolean;
  reference: string | null;
}

export const startEntireBillPayment = async (
  orderIds: string[]
): Promise<EntireBillPaymentResult> => {
  const bill = await fetchOutstandingBill(orderIds);
  if (!bill.vpa || bill.total <= 0) {
    return { ...bill, started: false, reference: null };
  }

  const reference = buildBillReference(bill.payments);
  try {
    await Linking.openURL(buildUpiUri(bill.vpa, bill.total, reference));
    return { ...bill, started: true, reference };
  } catch {
    Alert.alert(
      "No UPI app available",
      "Open this page on a phone with a UPI app installed to pay."
    );
    return { ...bill, started: false, reference: null };
  }
};
