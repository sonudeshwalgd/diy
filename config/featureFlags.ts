export const featureFlags = {
  categoryCard: {
    showDescription: false,
  },
} as const;

export type FeatureFlagKey = "categoryCard.showDescription";

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
