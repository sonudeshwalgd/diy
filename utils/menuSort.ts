import { getItemPrice, type Category } from "../data/products";

export type MenuSortId =
  | "all"
  | "available"
  | "popular"
  | "cheap"
  | "spicy"
  | "chocolate"
  | "sweet"
  | "drink"
  | "breakfast"
  | "lunch"
  | "dinner";

export type MenuTag = Exclude<
  MenuSortId,
  "all" | "available" | "popular" | "cheap"
>;

export interface MenuSortOption {
  id: MenuSortId;
  label: string;
  description: string;
  group: "Show" | "Sort" | "Taste" | "Time";
  icon: string;
  color: string;
}

export const MENU_SORT_OPTIONS: MenuSortOption[] = [
  {
    id: "all",
    label: "All items",
    description: "Default menu order",
    group: "Show",
    icon: "apps-outline",
    color: "#57534E",
  },
  {
    id: "available",
    label: "Available only",
    description: "Hide categories with everything out of stock",
    group: "Show",
    icon: "checkmark-circle-outline",
    color: "#059669",
  },
  {
    id: "popular",
    label: "Most ordered",
    description: "Sort by total quantity ordered",
    group: "Sort",
    icon: "flame-outline",
    color: "#EA580C",
  },
  {
    id: "cheap",
    label: "Cheap first",
    description: "Sort by lowest available price",
    group: "Sort",
    icon: "pricetag-outline",
    color: "#2563EB",
  },
  {
    id: "spicy",
    label: "Spicy",
    description: "Spicy burgers, fries, corn and sandwiches",
    group: "Taste",
    icon: "flame-outline",
    color: "#DC2626",
  },
  {
    id: "chocolate",
    label: "Chocolate",
    description: "Chocolate waffles, pancakes, drinks and desserts",
    group: "Taste",
    icon: "cafe-outline",
    color: "#92400E",
  },
  {
    id: "sweet",
    label: "Sweet",
    description: "Desserts, ice cream and sweet treats",
    group: "Taste",
    icon: "heart-outline",
    color: "#DB2777",
  },
  {
    id: "drink",
    label: "Drinks",
    description: "Shakes, coffee, hot chocolate and mojitos",
    group: "Taste",
    icon: "water-outline",
    color: "#0891B2",
  },
  {
    id: "breakfast",
    label: "Breakfast",
    description: "Waffles, pancakes, sandwiches and coffee",
    group: "Time",
    icon: "sunny-outline",
    color: "#D97706",
  },
  {
    id: "lunch",
    label: "Lunch",
    description: "Burgers, sandwiches, fries and corn",
    group: "Time",
    icon: "restaurant-outline",
    color: "#16A34A",
  },
  {
    id: "dinner",
    label: "Dinner",
    description: "Hearty burgers, sandwiches and sides",
    group: "Time",
    icon: "moon-outline",
    color: "#4F46E5",
  },
];

const CATEGORY_TAGS: Record<string, MenuTag[]> = {
  "strawberry-glass": ["chocolate", "sweet"],
  "strawberry-crusher": ["chocolate", "sweet", "drink"],
  waffles: ["chocolate", "sweet", "breakfast"],
  pancakes: ["chocolate", "sweet", "breakfast"],
  tiramisu: ["chocolate", "sweet", "drink"],
  churros: ["chocolate", "sweet"],
  burgers: ["spicy", "lunch", "dinner"],
  sandwiches: ["spicy", "breakfast", "lunch", "dinner"],
  "french-fries": ["spicy", "lunch", "dinner"],
  corn: ["spicy", "lunch", "dinner"],
  "cold-coffee": ["drink", "breakfast"],
  "hot-chocolate": ["chocolate", "sweet", "drink", "breakfast"],
  mojitos: ["drink"],
  "ice-cream": ["chocolate", "sweet"],
};

export function isMenuTagSort(id: MenuSortId): id is MenuTag {
  return (
    id !== "all" &&
    id !== "available" &&
    id !== "popular" &&
    id !== "cheap"
  );
}

export function getCategoryMenuTags(categoryId: string): MenuTag[] {
  return CATEGORY_TAGS[categoryId] ?? [];
}

export function categoryMatchesTag(
  category: Category,
  tag: MenuTag
): boolean {
  return getCategoryMenuTags(category.id).includes(tag);
}

export function isCategoryAvailable(
  category: Category,
  isItemDisabled: (id: string) => boolean
): boolean {
  if (category.subcategories.length === 0) return true;
  return category.subcategories.some((sub) => !isItemDisabled(sub.id));
}

export function getAvailableLowestPrice(
  category: Category,
  isItemDisabled: (id: string) => boolean
): number {
  const available = category.subcategories.filter(
    (sub) => !isItemDisabled(sub.id)
  );
  const pool = available.length > 0 ? available : category.subcategories;
  if (pool.length === 0) return 0;
  return Math.min(...pool.map((sub) => getItemPrice(sub)));
}

export function buildPopularityMap(
  items: { name: string; quantity: number }[],
  categories: Category[]
): Record<string, number> {
  const scores: Record<string, number> = {};

  for (const category of categories) {
    let score = 0;
    for (const sub of category.subcategories) {
      const subName = sub.name.toLowerCase();
      for (const item of items) {
        const orderName = item.name.toLowerCase();
        if (orderName === subName || orderName.startsWith(`${subName} ·`)) {
          score += item.quantity;
        }
      }
    }
    scores[category.id] = score;
  }

  return scores;
}
