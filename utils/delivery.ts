export const FREE_DELIVERY_THRESHOLD = 149;
export const DELIVERY_CHARGE = 20;

export function getDeliveryCharge(subtotal: number): number {
  if (subtotal <= 0) return 0;
  return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE;
}
