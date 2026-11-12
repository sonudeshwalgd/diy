import { categories, type Combo, type ComboOption } from "../data/products";

export interface ComboAvailability {
  outOfStock: boolean;
  fixedItemIds: string[];
  unavailableOptionIds: Set<string>;
  unavailableGroupIds: Set<string>;
}

function normalizeName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function resolveComboOptionItemId(option: ComboOption): string {
  if (option.itemId) return option.itemId;

  const category = categories.find((item) => item.id === option.categoryId);
  if (!category) return option.id;

  if (category.subcategories.some((sub) => sub.id === option.id)) {
    return option.id;
  }

  const byName = category.subcategories.find(
    (sub) => normalizeName(sub.name) === normalizeName(option.name)
  );
  if (byName) return byName.id;

  if (category.subcategories.length === 1) {
    return category.subcategories[0].id;
  }

  return option.id;
}

export function getComboAvailability(
  combo: Combo,
  isItemDisabled: (id: string) => boolean,
  isDirectlyDisabled: boolean
): ComboAvailability {
  const fixedItemIds = combo.items
    .filter((item) => isItemDisabled(item.id))
    .map((item) => item.id);

  const unavailableOptionIds = new Set<string>();
  const unavailableGroupIds = new Set<string>();

  for (const group of combo.selectionGroups) {
    if (group.options.length === 0) continue;

    let availableCount = 0;
    for (const option of group.options) {
      if (isItemDisabled(resolveComboOptionItemId(option))) {
        unavailableOptionIds.add(option.id);
      } else {
        availableCount += 1;
      }
    }

    if (availableCount === 0) {
      unavailableGroupIds.add(group.id);
    }
  }

  return {
    outOfStock:
      isDirectlyDisabled ||
      fixedItemIds.length > 0 ||
      unavailableGroupIds.size > 0,
    fixedItemIds,
    unavailableOptionIds,
    unavailableGroupIds,
  };
}
