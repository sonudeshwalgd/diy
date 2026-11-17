export const FREE_DELIVERY_THRESHOLD = 149;
export const DELIVERY_CHARGE = 20;

export function getDeliveryCharge(subtotal: number): number {
  if (subtotal <= 0) return 0;
  return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE;
}

export function isInsideRestaurant(
  queryParams?: Record<string, string>
): boolean {
  const source = queryParams?.utm_source?.trim().toLowerCase();
  return !!source && /^[ct]\d+$/.test(source);
}
