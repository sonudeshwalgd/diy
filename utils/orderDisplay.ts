import type { AdminOrder, BackendOrderItem } from "../services/api";

export function formatOrderDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatOrderItems(items: BackendOrderItem[]): string {
  return items.map((item) => `${item.name} ×${item.quantity}`).join(", ");
}

export function getOrderDisplayId(order: AdminOrder): string {
  return order.orderId || `#${order._id.slice(-8).toUpperCase()}`;
}
