export const featureFlags = {
  categoryCard: {
    showDescription: false,
  },
  menu: {
    includeDiyChinese: true,
    showOrderHistory: true,
    showRateUs: true,
    showWifi: true,
    showFeedback: true,
  },
} as const;

export type FeatureFlagKey =
  | "categoryCard.showDescription"
  | "menu.includeDiyChinese"
  | "menu.showOrderHistory"
  | "menu.showRateUs"
  | "menu.showWifi"
  | "menu.showFeedback";

export function isFeatureEnabled(key: FeatureFlagKey): boolean {
  return key
    .split(".")
    .reduce<unknown>(
      (value, segment) =>
        value && typeof value === "object"
          ? (value as Record<string, unknown>)[segment]
          : undefined,
      featureFlags
    ) === true;
}
