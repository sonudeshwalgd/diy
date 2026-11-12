import type { ImageSourcePropType } from "react-native";
import strawberryGlass from "../assets/DIY_Drinks_All_Item_Images/individual-items/strawberry/strawberry-glass/product";
import strawberryBowl from "../assets/DIY_Drinks_All_Item_Images/individual-items/strawberry/strawberry-bowl/product";
import strawberryStick from "../assets/DIY_Drinks_All_Item_Images/individual-items/strawberry/strawberry-stick/product";
import strawberryShake from "../assets/DIY_Drinks_All_Item_Images/individual-items/strawberry/strawberry-shake/product";
import strawberryCrusher from "../assets/DIY_Drinks_All_Item_Images/individual-items/strawberry/strawberry-crusher/product";
import tiramisu from "../assets/DIY_Drinks_All_Item_Images/individual-items/tiramisu/product";

export interface Variant {
  id: string;
  name: string;
  price: number;
}

export interface Subcategory {
  id: string;
  name: string;
  price?: number;
  image?: ImageSourcePropType;
  variants?: Variant[];
  variantLabel?: string;
  maxOneVariant?: boolean;
}

export function getItemPrice(sub: Subcategory): number {
  return sub.price ?? sub.variants?.[0]?.price ?? 0;
}

export interface Category {
  id: string;
  name: string;
  image?: ImageSourcePropType;
  description: string;
  subcategories: Subcategory[];
}

export interface ComboFixedItem {
  id: string;
  name: string;
  categoryId: string;
  price: number;
  variantId?: string;
  image?: ImageSourcePropType;
}

export interface ComboOption {
  id: string;
  name: string;
  categoryId: string;
  price: number;
  itemId?: string;
}

export interface ComboSelectionGroup {
  id: string;
  name: string;
  required: boolean;
  minSelections: number;
  maxSelections: number;
  options: ComboOption[];
}

export interface ComboPromotion {
  originalPrice: number;
  discountAmount: number;
  finalPrice: number;
}

export interface ComboPricing {
  type: "sum-of-selected-items";
  basePrice: number | null;
  currency: string;
  promotion?: ComboPromotion;
}

export interface Combo {
  id: string;
  name: string;
  description: string;
  image?: ImageSourcePropType;
  items: ComboFixedItem[];
  selectionGroups: ComboSelectionGroup[];
  pricing: ComboPricing;
  discountRuleId?: string;
}

export interface CustomComboRule {
  id: string;
  name: string;
  appliesTo: string;
  eligibility: {
    subtotal: { operator: string; amount: number; currency: string };
  };
  discount: { type: string; amount: number; currency: string };
  calculation: string;
  stackable: boolean;
}

function calculateComboPrice(combo: Combo): number {
  const fixed = combo.items.reduce((sum, item) => sum + item.price, 0);
  const optionFloor = combo.selectionGroups.reduce((sum, group) => {
    if (group.options.length === 0) return sum;
    const cheapest = Math.min(...group.options.map((o) => o.price));
    return sum + cheapest * Math.max(group.minSelections, 1);
  }, 0);
  const base = combo.pricing.basePrice ?? 0;
  const total = fixed + optionFloor;
  return total > 0 ? total : base;
}

export function getComboOriginalPrice(combo: Combo): number {
  return combo.pricing.promotion?.originalPrice ?? calculateComboPrice(combo);
}

export function getComboStartingPrice(combo: Combo): number {
  return combo.pricing.promotion?.finalPrice ?? calculateComboPrice(combo);
}

export function getComboDiscountAmount(combo: Combo): number {
  if (combo.pricing.promotion) return combo.pricing.promotion.discountAmount;
  return Math.max(0, getComboOriginalPrice(combo) - getComboStartingPrice(combo));
}

export function getComboItemCount(combo: Combo): number {
  const groupSelections = combo.selectionGroups.reduce(
    (sum, group) => sum + Math.max(group.minSelections, 0),
    0
  );
  return combo.items.length + groupSelections;
}

export function isCustomCombo(combo: Combo): boolean {
  return combo.discountRuleId === customComboRule.id;
}

export function getDefaultComboSelections(
  combo: Combo,
  unavailableOptionIds?: ReadonlySet<string>
): Record<string, string[]> {
  const selections: Record<string, string[]> = {};
  for (const group of combo.selectionGroups) {
    const defaultOption =
      group.options.find((option) => !unavailableOptionIds?.has(option.id)) ??
      group.options[0];
    selections[group.id] =
      group.required && group.maxSelections === 1 && defaultOption
        ? [defaultOption.id]
        : [];
  }
  return selections;
}

export function buildComboCartItem(
  combo: Combo,
  selections: Record<string, string[]>
): Subcategory | null {
  if (isCustomCombo(combo)) return null;

  const selectedOptions: ComboOption[] = [];
  for (const group of combo.selectionGroups) {
    for (const id of selections[group.id] ?? []) {
      const option = group.options.find((o) => o.id === id);
      if (option) selectedOptions.push(option);
    }
  }

  const subtotal =
    combo.items.reduce((sum, item) => sum + item.price, 0) +
    selectedOptions.reduce((sum, o) => sum + o.price, 0);
  const total = Math.max(0, subtotal - getComboDiscountAmount(combo));
  const signature = selectedOptions.map((o) => o.id).sort().join(",");
  const labels = selectedOptions.map((o) => o.name);
  const name =
    labels.length > 0
      ? `${combo.name} (${labels.join(", ")})`
      : combo.name;

  return {
    id: `combo:${combo.id}:${signature}`,
    name,
    price: total,
    image: combo.image,
  };
}

const categoriesBase: Category[] = [

{
  id: "strawberry-glass",
  name: "Strawberry Chocolate Glass",
  image: strawberryGlass.image,
  description: "Chocolate strawberry glass, bowl and stick treats made with real strawberries",
  subcategories: [strawberryGlass, strawberryBowl, strawberryStick],
},

{
  id: "strawberry-crusher",
  name: "Strawberry Chocolate Crusher",
  image: strawberryCrusher.image,
  description: "Chocolate strawberry shakes and crushers made with real strawberries",
  subcategories: [strawberryShake, strawberryCrusher],
},

{
  id: "waffles",
  name: "Waffles",
  image: require("../assets/DIY_Drinks_All_Item_Images/existing-grouped-photos/chocolate-and-oreo-waffles.webp"),
  description: "Crispy waffles with delicious toppings",
  subcategories: [
    {
      id: "single-chocolate",
      name: "Single Chocolate Waffle",
      price: 79,
      image: require("../assets/DIY_Drinks_All_Item_Images/individual-items/waffles/single-chocolate-waffle.webp"),
    },
    {
      id: "double-chocolate",
      name: "Double Chocolate Waffle",
      price: 89,
      image: require("../assets/DIY_Drinks_All_Item_Images/individual-items/waffles/double-chocolate-waffle.webp"),
    },
    {
      id: "triple-chocolate",
      name: "Triple Chocolate Waffle",
      price: 99,
      image: require("../assets/DIY_Drinks_All_Item_Images/individual-items/waffles/triple-chocolate-waffle.webp"),
    },
    {
      id: "oreo-crush",
      name: "Oreo Crush",
      price: 119,
      image: require("../assets/DIY_Drinks_All_Item_Images/individual-items/waffles/oreo-crush-waffle.webp"),
    },
    {
      id: "strawberry-filling",
      name: "Strawberry Filling Waffle",
      price: 119,
      image: require("../assets/DIY_Drinks_All_Item_Images/individual-items/waffles/strawberry-filling-waffle.webp"),
    },
    {
      id: "nutella",
      name: "Nutella Waffle",
      price: 169,
      image: require("../assets/DIY_Drinks_All_Item_Images/individual-items/waffles/nutella-waffle.webp"),
    },
    {
      id: "kunafa",
      name: "Kunafa Waffle",
      price: 179,
      image: require("../assets/DIY_Drinks_All_Item_Images/individual-items/waffles/kunafa-waffle.webp"),
    },
    {
      id: "peanut-butter",
      name: "Peanut Butter Waffle",
      price: 169,
      image: require("../assets/DIY_Drinks_All_Item_Images/individual-items/waffles/peanut-butter-waffle.webp"),
    },
    {
      id: "biscoff",
      name: "Biscoff Waffle",
      price: 169,
      image: require("../assets/DIY_Drinks_All_Item_Images/individual-items/waffles/biscoff-waffle.webp"),
    },
    {
      id: "kitkat",
      name: "KitKat Waffle",
      price: 119,
      image: require("../assets/DIY_Drinks_All_Item_Images/individual-items/waffles/kitkat-waffle.webp"),
    },
    {
      id: "ice-cream-chocolate-inside",
      name: "Ice Cream Chocolate Waffle - Ice Cream Inside",
      price: 120,
      image: require("../assets/DIY_Drinks_All_Item_Images/individual-items/waffles/ice-cream-chocolate-waffle-ice-cream-inside.webp"),
      variantLabel: "Choose flavours & quantity",
      variants: [
        { id: "vanilla", name: "Vanilla", price: 120 },
        { id: "chocolate", name: "Chocolate", price: 120 },
      ],
    },
    {
      id: "ice-cream-chocolate-outside",
      name: "Ice Cream Chocolate Waffle - Ice Cream Outside",
      price: 130,
      image: require("../assets/DIY_Drinks_All_Item_Images/individual-items/waffles/ice-cream-chocolate-waffle-ice-cream-outside.webp"),
      variantLabel: "Choose flavours & quantity",
      variants: [
        { id: "vanilla", name: "Vanilla", price: 130 },
        { id: "chocolate", name: "Chocolate", price: 130 },
      ],
    },
  ],
}
,

{
  id: "corn",
  name: "Corn",
  image: require("../assets/DIY_Drinks_All_Item_Images/individual-items/corn/corn-chaat.webp"),
  description: "Delicious corn snacks with flavorful toppings",
  subcategories: [
    {
      id: "salty-corn",
      name: "Salty Corn",
      price: 70,
      image: require("../assets/DIY_Drinks_All_Item_Images/individual-items/corn/salty-corn.webp"),
    },
    {
      id: "masala-corn",
      name: "Masala Corn",
      price: 70,
      image: require("../assets/DIY_Drinks_All_Item_Images/individual-items/corn/masala-corn.webp"),
    },
    {
      id: "corn-chaat",
      name: "Corn Chaat",
      price: 80,
      image: require("../assets/DIY_Drinks_All_Item_Images/individual-items/corn/corn-chaat.webp"),
    },
  ],
},

{
  id: "burgers",
  name: "Burgers",
  image: require("../assets/DIY_Drinks_All_Item_Images/individual-items/burgers/cheese-burger.webp"),
  description: "Juicy and delicious burgers with tasty fillings",
  subcategories: [
    {
      id: "grilled-burger",
      name: "Grilled Burger",
      price: 39,
      image: require("../assets/DIY_Drinks_All_Item_Images/individual-items/burgers/grilled-burger.webp"),
    },
    {
      id: "tandoori-burger",
      name: "Tandoori Burger",
      price: 49,
      image: require("../assets/DIY_Drinks_All_Item_Images/individual-items/burgers/tandoori-burger.webp"),
    },
    {
      id: "cheese-burger",
      name: "Cheese Burger",
      price: 69,
      image: require("../assets/DIY_Drinks_All_Item_Images/individual-items/burgers/cheese-burger.webp"),
    },
    {
      id: "paneer-burger",
      name: "Paneer Burger",
      price: 69,
      image: require("../assets/DIY_Drinks_All_Item_Images/individual-items/burgers/paneer-burger.webp"),
    },
    {
      id: "cheesy-paneer-burger",
      name: "Cheesy Paneer Burger",
      price: 79,
      image: require("../assets/DIY_Drinks_All_Item_Images/individual-items/burgers/cheesy-paneer-burger.webp"),
    },
  ],
},

{
  id: "sandwiches",
  name: "Sandwiches",
  image: require("../assets/DIY_Drinks_All_Item_Images/individual-items/sandwiches/grilled-sandwich.webp"),
  description: "Freshly grilled sandwiches with delicious fillings",
  subcategories: [
    {
      id: "grilled-sandwich",
      name: "Grilled Sandwich",
      price: 59,
      image: require("../assets/DIY_Drinks_All_Item_Images/individual-items/sandwiches/grilled-sandwich.webp"),
    },
    {
      id: "cheese-sandwich",
      name: "Cheese Sandwich",
      price: 79,
      image: require("../assets/DIY_Drinks_All_Item_Images/individual-items/sandwiches/cheese-sandwich.webp"),
    },
    {
      id: "paneer-sandwich",
      name: "Paneer Sandwich",
      price: 79,
      image: require("../assets/DIY_Drinks_All_Item_Images/individual-items/sandwiches/paneer-sandwich.webp"),
    },
    {
      id: "cheesy-paneer-sandwich",
      name: "Cheesy Paneer Sandwich",
      price: 89,
      image: require("../assets/DIY_Drinks_All_Item_Images/individual-items/sandwiches/cheesy-paneer-sandwich.webp"),
    },
  ],
},


{
  "id": "pancakes",
  "name": "Pancakes",
  "image": require("../assets/DIY_Drinks_All_Item_Images/individual-items/pancakes/choco-chips-pancake.webp"),
  "description": "Soft and delicious pancakes with tasty toppings",
  "subcategories": [
    {
      "id": "choco-chips",
      "name": "Choco Chips Pancake",
      "image": require("../assets/DIY_Drinks_All_Item_Images/individual-items/pancakes/choco-chips-pancake.webp"),
      "variants": [
        {
          "id": "8-pcs",
          "name": "8 Pcs",
          "price": 89
        },
        {
          "id": "14-pcs",
          "name": "14 Pcs",
          "price": 119
        }
      ]
    },
    {
      "id": "oreo",
      "name": "Oreo Pancake",
      "image": require("../assets/DIY_Drinks_All_Item_Images/individual-items/pancakes/oreo-pancake.webp"),
      "variants": [
        {
          "id": "8-pcs",
          "name": "8 Pcs",
          "price": 99
        },
        {
          "id": "14-pcs",
          "name": "14 Pcs",
          "price": 129
        }
      ]
    },
    {
      "id": "dry-fruit",
      "name": "Dry Fruit Pancake",
      "image": require("../assets/DIY_Drinks_All_Item_Images/individual-items/pancakes/dry-fruit-pancake.webp"),
      "variants": [
        {
          "id": "8-pcs",
          "name": "8 Pcs",
          "price": 119
        },
        {
          "id": "14-pcs",
          "name": "14 Pcs",
          "price": 149
        }
      ]
    },
    {
      "id": "strawberry-filling",
      "name": "Strawberry Filling Pancake",
      "image": require("../assets/DIY_Drinks_All_Item_Images/individual-items/pancakes/strawberry-filling-pancake.webp"),
      "variants": [
        {
          "id": "8-pcs",
          "name": "8 Pcs",
          "price": 119
        },
        {
          "id": "14-pcs",
          "name": "14 Pcs",
          "price": 139
        }
      ]
    },
    {
      "id": "biscoff",
      "name": "Biscoff Pancake",
      "image": require("../assets/DIY_Drinks_All_Item_Images/individual-items/pancakes/biscoff-pancake.webp"),
      "variants": [
        {
          "id": "8-pcs",
          "name": "8 Pcs",
          "price": 119
        },
        {
          "id": "14-pcs",
          "name": "14 Pcs",
          "price": 139
        }
      ]
    },
    {
      "id": "ice-cream",
      "name": "Ice Cream Pancake",
      "image": require("../assets/DIY_Drinks_All_Item_Images/individual-items/pancakes/ice-cream-pancake.webp"),
      "variantLabel": "Choose flavours, sizes & quantity",
      "variants": [
        {
          "id": "vanilla-8-pcs",
          "name": "Vanilla · 8 Pcs",
          "price": 119
        },
        {
          "id": "vanilla-14-pcs",
          "name": "Vanilla · 14 Pcs",
          "price": 149
        },
        {
          "id": "chocolate-8-pcs",
          "name": "Chocolate · 8 Pcs",
          "price": 119
        },
        {
          "id": "chocolate-14-pcs",
          "name": "Chocolate · 14 Pcs",
          "price": 149
        }
      ]
    }
  ]
},

{
  id: "tiramisu",
  name: "Tiramisu",
  image: tiramisu.image,
  description: "Classic Italian coffee dessert",
  subcategories: [tiramisu],
},

{
  id: "churros",
  name: "Churros",
  image: require("../assets/DIY_Drinks_All_Item_Images/individual-items/churros/double-dip-churros.webp"),
  description: "Crispy churros with delicious chocolate dips",
  subcategories: [
    {
      id: "single-dip-churros",
      name: "Single Dip Churros",
      price: 59,
      image: require("../assets/DIY_Drinks_All_Item_Images/individual-items/churros/single-dip-churros.webp"),
    },
    {
      id: "double-dip-churros",
      name: "Double Dip Churros",
      price: 69,
      image: require("../assets/DIY_Drinks_All_Item_Images/individual-items/churros/double-dip-churros.webp"),
    },
  ],
},

{
  id: "french-fries",
  name: "French Fries",
  image: require("../assets/DIY_Drinks_All_Item_Images/individual-items/french-fries/peri-peri-french-fries.webp"),
  description: "Crispy and delicious French fries",
  subcategories: [
    {
      id: "salty-french-fries",
      name: "Salty French Fries",
      price: 49,
      image: require("../assets/DIY_Drinks_All_Item_Images/individual-items/french-fries/salty-french-fries.webp"),
    },
    {
      id: "peri-peri-french-fries",
      name: "Peri Peri French Fries",
      price: 59,
      image: require("../assets/DIY_Drinks_All_Item_Images/individual-items/french-fries/peri-peri-french-fries.webp"),
    },
  ],
},

{
  id: "cold-coffee",
  name: "Cold Coffee",
  image: require("../assets/DIY_Drinks_All_Item_Images/existing-grouped-photos/cold-coffee-options.webp"),
  description: "Refreshing and creamy cold coffee",
  subcategories: [
    {
      id: "basic-cold-coffee",
      name: "Basic Cold Coffee",
      price: 79,
      image: require("../assets/DIY_Drinks_All_Item_Images/individual-items/cold-coffee/basic-cold-coffee.webp"),
    },
    {
      id: "ice-cream-cold-coffee",
      name: "Ice Cream Cold Coffee",
      price: 99,
      image: require("../assets/DIY_Drinks_All_Item_Images/individual-items/cold-coffee/ice-cream-cold-coffee.webp"),
    },
  ],
},

{
  id: "hot-chocolate",
  name: "Hot Chocolate",
  image: require("../assets/DIY_Drinks_All_Item_Images/individual-items/hot-chocolate/hot-chocolate.webp"),
  description: "Hot and comforting chocolate",
  subcategories: [
    {
      id: "hot-chocolate-coffee",
      name: "Hot Chocolate",
      price: 79,
      image: require("../assets/DIY_Drinks_All_Item_Images/individual-items/hot-chocolate/hot-chocolate.webp"),
    },
  ],
},

{
  id: "mojitos",
  name: "Mojitos",
  image: require("../assets/DIY_Drinks_All_Item_Images/existing-grouped-photos/mojito-options.webp"),
  description: "Refreshing fruity and flavorful mojitos",
  subcategories: [
    {
      id: "green-apple",
      name: "Green Apple Mojito",
      price: 69,
      image: require("../assets/DIY_Drinks_All_Item_Images/individual-items/mojitos/green-apple-mojito.webp"),
    },
    {
      id: "lemon-ice",
      name: "Lemon Ice Mojito",
      price: 69,
      image: require("../assets/DIY_Drinks_All_Item_Images/individual-items/mojitos/lemon-ice-mojito.webp"),
    },
    {
      id: "watermelon",
      name: "Watermelon Mojito",
      price: 69,
      image: require("../assets/DIY_Drinks_All_Item_Images/individual-items/mojitos/watermelon-mojito.webp"),
    },
    {
      id: "kiwi",
      name: "Kiwi Mojito",
      price: 69,
      image: require("../assets/DIY_Drinks_All_Item_Images/individual-items/mojitos/kiwi-mojito.webp"),
    },
    {
      id: "blue-cocoa-cone",
      name: "Blue Kurako",
      price: 69,
      image: require("../assets/DIY_Drinks_All_Item_Images/individual-items/mojitos/blue-cocoa-cone-mojito.webp"),
    },
    {
      id: "chili-guava",
      name: "Chili Guava Mojito",
      price: 69,
      image: require("../assets/DIY_Drinks_All_Item_Images/individual-items/mojitos/chili-guava-mojito.webp"),
    },
    {
      id: "peach",
      name: "Peach Mojito",
      price: 69,
      image: require("../assets/DIY_Drinks_All_Item_Images/individual-items/mojitos/peach-mojito.webp"),
    },
  ],
},

{
  id: "ice-cream",
  name: "DIY Ice Cream",
  image: require("../assets/DIY_Drinks_All_Item_Images/individual-items/ice-cream/double-delight.webp"),
  description: "Cone, Double Delight & Dry Fruit",
  subcategories: [
    {
      id: "ice-cream-cone",
      name: "Cone",
      price: 30,
      image: require("../assets/DIY_Drinks_All_Item_Images/individual-items/ice-cream/cone.webp"),
    },
    {
      id: "ice-cream-double-delight",
      name: "Double Delight",
      price: 60,
      image: require("../assets/DIY_Drinks_All_Item_Images/individual-items/ice-cream/double-delight.webp"),
    },
    {
      id: "ice-cream-dry-fruit",
      name: "Dry Fruit",
      price: 80,
      image: require("../assets/DIY_Drinks_All_Item_Images/individual-items/ice-cream/dry-fruit.webp"),
    },
  ],
},



];

const CATEGORY_ORDER = [
  "strawberry-glass",
  "strawberry-crusher",
  "waffles",
  "pancakes",
  "tiramisu",
  "churros",
  "burgers",
  "sandwiches",
  "french-fries",
  "corn",
  "cold-coffee",
  "hot-chocolate",
  "mojitos",
  "ice-cream",
];

export const categories: Category[] = [...categoriesBase].sort(
  (a, b) => CATEGORY_ORDER.indexOf(a.id) - CATEGORY_ORDER.indexOf(b.id)
);

const combosBase: Combo[] = [
  {
    id: "dessert-treat",
    name: "Dessert Treat",
    description: "Chocolate waffle & pancake with a drink",
    image: require("../assets/DIY_Drinks_All_Item_Images/combos/dessert-treat.webp"),
    items: [
      {
        id: "triple-chocolate",
        name: "Triple Chocolate Waffle",
        categoryId: "waffles",
        price: 99,
      },
      {
        id: "choco-chips",
        name: "Choco Chips Pancake - 14 Pcs",
        categoryId: "pancakes",
        price: 119,
        variantId: "14-pcs",
      },
    ],
    selectionGroups: [
      {
        id: "drink-choice",
        name: "Choose 1 Drink",
        required: true,
        minSelections: 1,
        maxSelections: 1,
        options: [
          {
            id: "basic-cold-coffee",
            name: "Basic Cold Coffee",
            categoryId: "cold-coffee",
            price: 79,
          },
          {
            id: "hot-chocolate-drink",
            name: "Hot Chocolate",
            categoryId: "hot-chocolate",
            price: 79,
          },
        ],
      },
    ],
    pricing: {
      type: "sum-of-selected-items",
      basePrice: null,
      currency: "INR",
    },
  },
  {
    id: "student-treat-favorite",
    name: "Student Favorite",
    description: "Pancake & burger with a drink",
    image: require("../assets/DIY_Drinks_All_Item_Images/combos/student-treat-favorite.webp"),
    items: [
      {
        id: "choco-chips",
        name: "Choco Chips Pancake - 8 Pcs",
        categoryId: "pancakes",
        price: 89,
        variantId: "8-pcs",
      },
      {
        id: "cheese-burger",
        name: "Cheese Burger",
        categoryId: "burgers",
        price: 69,
      },
    ],
    selectionGroups: [
      {
        id: "drink-choice",
        name: "Choose 1 Drink",
        required: true,
        minSelections: 1,
        maxSelections: 1,
        options: [
          {
            id: "basic-cold-coffee",
            name: "Basic Cold Coffee",
            categoryId: "cold-coffee",
            price: 79,
          },
          {
            id: "hot-chocolate-drink",
            name: "Hot Chocolate",
            categoryId: "hot-chocolate",
            price: 79,
          },
        ],
      },
    ],
    pricing: {
      type: "sum-of-selected-items",
      basePrice: null,
      currency: "INR",
    },
  },
  {
    id: "burger-fest",
    name: "Burger Fest",
    description: "Burger & fries with a drink",
    image: require("../assets/DIY_Drinks_All_Item_Images/combos/burger-fest.webp"),
    items: [
      {
        id: "cheese-burger",
        name: "Cheese Burger",
        categoryId: "burgers",
        price: 69,
      },
      {
        id: "peri-peri-french-fries",
        name: "Peri Peri French Fries",
        categoryId: "french-fries",
        price: 59,
      },
    ],
    selectionGroups: [
      {
        id: "drink-choice",
        name: "Choose 1 Drink",
        required: true,
        minSelections: 1,
        maxSelections: 1,
        options: [
          {
            id: "basic-cold-coffee",
            name: "Basic Cold Coffee",
            categoryId: "cold-coffee",
            price: 79,
          },
          {
            id: "hot-chocolate-drink",
            name: "Hot Chocolate",
            categoryId: "hot-chocolate",
            price: 79,
          },
        ],
      },
    ],
    pricing: {
      type: "sum-of-selected-items",
      basePrice: null,
      currency: "INR",
    },
  },
  {
    id: "full-meal",
    name: "Full Meal",
    description: "Burger, sandwich & pancake with a drink",
    image: require("../assets/DIY_Drinks_All_Item_Images/combos/full-meal.webp"),
    items: [
      {
        id: "cheese-burger",
        name: "Cheese Burger",
        categoryId: "burgers",
        price: 69,
      },
      {
        id: "grilled-sandwich",
        name: "Grilled Sandwich - 4 Pcs",
        categoryId: "sandwiches",
        price: 59,
      },
      {
        id: "choco-chips",
        name: "Choco Chips Pancake - 14 Pcs",
        categoryId: "pancakes",
        price: 119,
        variantId: "14-pcs",
      },
    ],
    selectionGroups: [
      {
        id: "drink-choice",
        name: "Choose 1 Drink",
        required: true,
        minSelections: 1,
        maxSelections: 1,
        options: [
          {
            id: "basic-cold-coffee",
            name: "Basic Cold Coffee",
            categoryId: "cold-coffee",
            price: 79,
          },
          {
            id: "hot-chocolate-drink",
            name: "Hot Chocolate",
            categoryId: "hot-chocolate",
            price: 79,
          },
        ],
      },
    ],
    pricing: {
      type: "sum-of-selected-items",
      basePrice: null,
      currency: "INR",
    },
  },
  {
    id: "sandwich-meal",
    name: "Sandwich Meal",
    description: "Cheesy paneer sandwich & fries with a drink",
    image: require("../assets/DIY_Drinks_All_Item_Images/combos/sandwich-meal.webp"),
    items: [
      {
        id: "cheesy-paneer-sandwich",
        name: "Cheesy Paneer Sandwich",
        categoryId: "sandwiches",
        price: 89,
      },
      {
        id: "peri-peri-french-fries",
        name: "Peri Peri French Fries",
        categoryId: "french-fries",
        price: 59,
      },
    ],
    selectionGroups: [
      {
        id: "drink-choice",
        name: "Choose 1 Drink",
        required: true,
        minSelections: 1,
        maxSelections: 1,
        options: [
          {
            id: "basic-cold-coffee",
            name: "Basic Cold Coffee",
            categoryId: "cold-coffee",
            price: 79,
          },
          {
            id: "hot-chocolate-drink",
            name: "Hot Chocolate",
            categoryId: "hot-chocolate",
            price: 79,
          },
        ],
      },
    ],
    pricing: {
      type: "sum-of-selected-items",
      basePrice: null,
      currency: "INR",
    },
  },
  {
    id: "triple-chocolate-combo",
    name: "Triple Chocolate Combo",
    description: "Chocolate waffle & fries with a drink",
    image: require("../assets/DIY_Drinks_All_Item_Images/combos/triple-chocolate-combo.webp"),
    items: [
      {
        id: "triple-chocolate",
        name: "Triple Chocolate Waffle",
        categoryId: "waffles",
        price: 99,
      },
      {
        id: "peri-peri-french-fries",
        name: "Peri Peri French Fries",
        categoryId: "french-fries",
        price: 59,
      },
    ],
    selectionGroups: [
      {
        id: "drink-choice",
        name: "Choose 1 Drink",
        required: true,
        minSelections: 1,
        maxSelections: 1,
        options: [
          {
            id: "basic-cold-coffee",
            name: "Basic Cold Coffee",
            categoryId: "cold-coffee",
            price: 79,
          },
          {
            id: "hot-chocolate-drink",
            name: "Hot Chocolate",
            categoryId: "hot-chocolate",
            price: 79,
          },
        ],
      },
    ],
    pricing: {
      type: "sum-of-selected-items",
      basePrice: null,
      currency: "INR",
    },
  },
  {
    id: "oreo-combo",
    name: "Oreo Combo",
    description: "Oreo waffle & Oreo pancake with a drink",
    image: require("../assets/DIY_Drinks_All_Item_Images/combos/oreo-combo.webp"),
    items: [
      {
        id: "oreo-crush",
        name: "Oreo Crush Waffle",
        categoryId: "waffles",
        price: 119,
      },
      {
        id: "oreo",
        name: "Oreo Pancake - 8 Pcs",
        categoryId: "pancakes",
        price: 99,
        variantId: "8-pcs",
      },
    ],
    selectionGroups: [
      {
        id: "drink-choice",
        name: "Choose 1 Drink",
        required: true,
        minSelections: 1,
        maxSelections: 1,
        options: [
          {
            id: "basic-cold-coffee",
            name: "Basic Cold Coffee",
            categoryId: "cold-coffee",
            price: 79,
          },
          {
            id: "hot-chocolate-drink",
            name: "Hot Chocolate",
            categoryId: "hot-chocolate",
            price: 79,
          },
        ],
      },
    ],
    pricing: {
      type: "sum-of-selected-items",
      basePrice: null,
      currency: "INR",
    },
  },
  // {
  //   id: "custom-combo",
  //   name: "Custom Combo",
  //   description: "Choose eligible items to build your own combo",
  //   image: require("../assets/DIY_Drinks_All_Item_Images/combos/full-meal.webp"),
  //   items: [],
  //   selectionGroups: [],
  //   pricing: {
  //     type: "sum-of-selected-items",
  //     basePrice: 0,
  //     currency: "INR",
  //   },
  //   discountRuleId: "custom-combo-discount",
  // },
];

const COMBO_PROMOTIONS: Record<string, ComboPromotion> = {
  "dessert-treat": {
    originalPrice: 297,
    discountAmount: 20,
    finalPrice: 277,
  },
  "oreo-combo": {
    originalPrice: 297,
    discountAmount: 20,
    finalPrice: 277,
  },
  "full-meal": {
    originalPrice: 326,
    discountAmount: 25,
    finalPrice: 301,
  },
  "burger-fest": {
    originalPrice: 207,
    discountAmount: 20,
    finalPrice: 187,
  },
  "sandwich-meal": {
    originalPrice: 227,
    discountAmount: 20,
    finalPrice: 207,
  },
  "student-treat-favorite": {
    originalPrice: 237,
    discountAmount: 20,
    finalPrice: 217,
  },
  "triple-chocolate-combo": {
    originalPrice: 237,
    discountAmount: 20,
    finalPrice: 217,
  },
};

const COMBO_ORDER = [
  "dessert-treat",
  "oreo-combo",
  "full-meal",
  "burger-fest",
  "sandwich-meal",
  "student-treat-favorite",
  "triple-chocolate-combo",
];

export const combos: Combo[] = combosBase
  .map((combo) => {
    const promotion = COMBO_PROMOTIONS[combo.id];
    return promotion
      ? { ...combo, pricing: { ...combo.pricing, promotion } }
      : combo;
  })
  .sort((a, b) => COMBO_ORDER.indexOf(a.id) - COMBO_ORDER.indexOf(b.id));

export const customComboRule: CustomComboRule = {
  id: "custom-combo-discount",
  name: "Custom Combo Discount",
  appliesTo: "custom-combo",
  eligibility: {
    subtotal: {
      operator: "greater-than-or-equal",
      amount: 220,
      currency: "INR",
    },
  },
  discount: {
    type: "fixed-amount",
    amount: 20,
    currency: "INR",
  },
  calculation: "finalPrice = subtotal >= 220 ? subtotal - 20 : subtotal",
  stackable: false,
};

export const combosCategory: Category = {
  id: "combos",
  name: "Combos",
  image: require("../assets/DIY_Drinks_All_Item_Images/combos/full-meal.webp"),
  description: "Value combos & meals",
  subcategories: combos.map((c) => ({
    id: c.id,
    name: c.name,
    price: getComboStartingPrice(c),
    image: c.image,
  })),
};


