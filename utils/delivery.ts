export const FREE_DELIVERY_THRESHOLD = 149;
export const DELIVERY_CHARGE = 20;

export function getDeliveryCharge(subtotal: number): number {
  if (subtotal <= 0) return 0;
  return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_CHARGE;
}

export interface OrderSource {
  insideRestaurant: boolean;
  tableNumber?: string;
  counterNumber?: string;
  sourceLabel?: string;
  utmSource?: string;
}

export function parseOrderSource(
  utmSource?: string,
  fallbackTableNumber?: string
): OrderSource {
  const source = utmSource?.trim();
  const match = source?.match(/^([ct])(\d+)$/i);

  if (match) {
    const isTable = match[1].toLowerCase() === "t";
    const number = String(Number(match[2]));
    return {
      insideRestaurant: true,
      tableNumber: isTable ? number : undefined,
      counterNumber: isTable ? undefined : number,
      sourceLabel: `${isTable ? "Table" : "Counter"} ${number}`,
      utmSource: source,
    };
  }

  const fallback = fallbackTableNumber?.trim();
  if (fallback && /^\d+$/.test(fallback)) {
    return {
      insideRestaurant: true,
      tableNumber: fallback,
      sourceLabel: `Table ${fallback}`,
      utmSource: source,
    };
  }

  return { insideRestaurant: false, utmSource: source };
}

export function isInsideRestaurant(
  queryParams?: Record<string, string>
): boolean {
  return parseOrderSource(queryParams?.utm_source).insideRestaurant;
}
