import type { AdminOrder, BackendOrderItem } from "../services/api";

export const LATE_ORDER_AFTER_MS = 10 * 60 * 1000;

export function getOrderElapsedMs(createdAt: string, now = Date.now()): number {
  const placedAt = Date.parse(createdAt);
  if (!Number.isFinite(placedAt)) return 0;
  return Math.max(0, now - placedAt);
}

export function formatOrderDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return "<1 min";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest > 0 ? `${hours}h ${rest} min` : `${hours}h`;
}

export function isLateOrder(order: AdminOrder, elapsedMs: number): boolean {
  if (order.orderStatus !== "placed" && order.orderStatus !== "accepted") return false;
  return elapsedMs >= LATE_ORDER_AFTER_MS;
}

export function orderProgressColor(elapsedMs: number): string {
  if (elapsedMs >= LATE_ORDER_AFTER_MS) return "#EF4444";
  if (elapsedMs >= LATE_ORDER_AFTER_MS / 2) return "#F59E0B";
  return "#10B981";
}

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
