export const featureFlags = {
  categoryCard: {
    showDescription: false,
  },
  menu: {
    includeDiyChinese: true,
  },
} as const;

export type FeatureFlagKey = "categoryCard.showDescription" | "menu.includeDiyChinese";

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
