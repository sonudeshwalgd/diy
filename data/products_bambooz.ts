import type { ImageSourcePropType } from "react-native";
import type {
  Category,
  Combo,
  ComboOption,
  Subcategory,
  Variant,
} from "./products";
import bamboozMenuJson from "./products_bambooz.json";

export const BAMBOOZ_RESTAURANT = "bambooz";
const SCOPED_PREFIX = `${BAMBOOZ_RESTAURANT}--`;

const itemImages: Record<string, ImageSourcePropType> = {
  "veg-steamed-momos": require("../assets/bamboocza_ivory_food_images/momos/veg-steamed-momos.jpg"),
  "veg-fried-momos": require("../assets/bamboocza_ivory_food_images/momos/veg-fried-momos.jpg"),
  "paneer-steamed-momos": require("../assets/bamboocza_ivory_food_images/momos/paneer-steamed-momos.jpg"),
  "veg-spring-roll": require("../assets/bamboocza_ivory_food_images/spring-rolls/veg-spring-roll.jpg"),
  "paneer-spring-roll": require("../assets/bamboocza_ivory_food_images/spring-rolls/paneer-spring-roll.jpg"),
  "classic-masala-maggi": require("../assets/bamboocza_ivory_food_images/maggi/classic-masala-maggi.jpg"),
  "veg-loaded-maggi": require("../assets/bamboocza_ivory_food_images/maggi/veg-loaded-maggi.jpg"),
  "cheese-maggi": require("../assets/bamboocza_ivory_food_images/maggi/cheese-maggi.jpg"),
  "peri-peri-maggi": require("../assets/bamboocza_ivory_food_images/maggi/peri-peri-maggi.jpg"),
  "veg-grilled-sandwich": require("../assets/bamboocza_ivory_food_images/sandwiches/veg-grilled-sandwich.jpg"),
  "cheese-corn-sandwich": require("../assets/bamboocza_ivory_food_images/sandwiches/cheese-corn-sandwich.jpg"),
  "paneer-tikka-sandwich": require("../assets/bamboocza_ivory_food_images/sandwiches/paneer-tikka-sandwich.jpg"),
  "rajma-chawal": require("../assets/bamboocza_ivory_food_images/chawal-meals/rajma-chawal.jpg"),
  "kadhi-chawal": require("../assets/bamboocza_ivory_food_images/chawal-meals/kadhi-chawal.jpg"),
  "red-sauce-pasta": require("../assets/bamboocza_ivory_food_images/pasta/red-sauce-pasta.jpg"),
  "white-sauce-pasta": require("../assets/bamboocza_ivory_food_images/pasta/white-sauce-pasta.jpg"),
  "aloo-paratha": require("../assets/bamboocza_ivory_food_images/parathas/aloo-paratha.jpg"),
  "aloo-pyaz-paratha": require("../assets/bamboocza_ivory_food_images/parathas/aloo-pyaz-paratha.jpg"),
  "paneer-paratha": require("../assets/bamboocza_ivory_food_images/parathas/paneer-paratha.jpg"),
  "hakka-noodles": require("../assets/bamboocza_ivory_food_images/noodles-rice/hakka-noodles.jpg"),
  "schezwan-noodles": require("../assets/bamboocza_ivory_food_images/noodles-rice/schezwan-noodles.jpg"),
  "chilli-garlic-noodles": require("../assets/bamboocza_ivory_food_images/noodles-rice/chilli-garlic-noodles.jpg"),
  "veg-fried-rice": require("../assets/bamboocza_ivory_food_images/noodles-rice/veg-fried-rice.jpg"),
  "egg-fried-rice": require("../assets/bamboocza_ivory_food_images/noodles-rice/egg-fried-rice.jpg"),
  chai: require("../assets/bamboocza_ivory_food_images/chai-coffee/chai.jpg"),
  "masala-adrak-chai": require("../assets/bamboocza_ivory_food_images/chai-coffee/masala-adrak-chai.jpg"),
  "hot-coffee": require("../assets/bamboocza_ivory_food_images/chai-coffee/hot-coffee.jpg"),
  "classic-cold-coffee": require("../assets/bamboocza_ivory_food_images/cold-coffee/classic-cold-coffee.jpg"),
  "ice-cream-cold-coffee": require("../assets/bamboocza_ivory_food_images/cold-coffee/ice-cream-cold-coffee.jpg"),
  "hazelnut-cold-coffee": require("../assets/bamboocza_ivory_food_images/cold-coffee/hazelnut-cold-coffee.jpg"),
  "chocolate-cold-coffee": require("../assets/bamboocza_ivory_food_images/cold-coffee/chocolate-cold-coffee.jpg"),
  "oreo-cold-coffee": require("../assets/bamboocza_ivory_food_images/cold-coffee/oreo-cold-coffee.jpg"),
  "dry-wai-wai": require("../assets/bamboocza_ivory_food_images/laphing/dry-wai-wai.jpg"),
  "soya-laphing": require("../assets/bamboocza_ivory_food_images/laphing/soya-laphing.jpg"),
  "chai-paratha-combo": require("../assets/bamboocza_ivory_food_images/bamboocza-combos/chai-paratha-combo.jpg"),
  "momos-chai-combo": require("../assets/bamboocza_ivory_food_images/bamboocza-combos/momos-chai-combo.jpg"),
  "maggi-cold-coffee-combo": require("../assets/bamboocza_ivory_food_images/bamboocza-combos/maggi-cold-coffee-combo.jpg"),
  "momos-cold-coffee-combo": require("../assets/bamboocza_ivory_food_images/bamboocza-combos/momos-cold-coffee-combo.jpg"),
  "fried-rice-momos-combo": require("../assets/bamboocza_ivory_food_images/bamboocza-combos/fried-rice-momos-combo.jpg"),
  "fried-rice-cold-coffee-combo": require("../assets/bamboocza_ivory_food_images/bamboocza-combos/fried-rice-cold-coffee-combo.jpg"),
  "gang-platter-for-4": require("../assets/bamboocza_ivory_food_images/special-combos/gang-platter-for-4.jpg"),
};

interface BamboozVariantInput {
  quantity: string;
  price: number;
}

interface BamboozItemInput {
  id: string;
  name: string;
  price?: number;
  quantity?: string;
  includes?: string[];
  variants?: BamboozVariantInput[];
}

interface BamboozSubcategoryInput {
  name: string;
  items: BamboozItemInput[];
}

interface BamboozCategoryInput {
  id: string;
  name: string;
  description?: string;
  subcategories: BamboozSubcategoryInput[];
}

interface BamboozMenuInput {
  menu: BamboozCategoryInput[];
}

const menu = bamboozMenuJson as BamboozMenuInput;

export const getBamboozItemImage = (
  itemId: string
): ImageSourcePropType | undefined => {
  const rawId = itemId.startsWith(SCOPED_PREFIX)
    ? itemId.slice(SCOPED_PREFIX.length)
    : itemId;
  return itemImages[itemId] ?? itemImages[rawId];
};

const slug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "default";

const scopedId = (id: string) => `${SCOPED_PREFIX}${id}`;

const toVariants = (variants: BamboozVariantInput[]): Variant[] =>
  variants.map((variant) => ({
    id: slug(variant.quantity),
    name: variant.quantity,
    price: variant.price,
  }));

const toSubcategory = (item: BamboozItemInput): Subcategory => ({
  id: scopedId(item.id),
  name: item.name,
  image: getBamboozItemImage(item.id),
  price: item.price,
  variants: item.variants ? toVariants(item.variants) : undefined,
  variantLabel: item.variants ? "Quantity" : undefined,
  maxOneVariant: item.variants ? true : undefined,
  quantity: item.quantity,
  includes: item.includes,
  restaurant: BAMBOOZ_RESTAURANT,
});

interface RegularMealOptionTarget {
  itemId: string;
  categoryId: string;
}

const regularMealOptionTargets: Record<string, RegularMealOptionTarget> = {
  "chai-paratha-combo": { itemId: "chai", categoryId: "chai-coffee" },
  "momos-chai-combo": {
    itemId: "veg-steamed-momos",
    categoryId: "momos",
  },
  "maggi-cold-coffee-combo": {
    itemId: "classic-masala-maggi",
    categoryId: "maggi",
  },
  "momos-cold-coffee-combo": {
    itemId: "veg-steamed-momos",
    categoryId: "momos",
  },
  "fried-rice-momos-combo": {
    itemId: "veg-fried-rice",
    categoryId: "noodles-rice",
  },
  "fried-rice-cold-coffee-combo": {
    itemId: "veg-fried-rice",
    categoryId: "noodles-rice",
  },
};

const regularMealsCategory = menu.menu.find(
  (category) => category.id === "bamboocza-combos"
);
const regularMealItems =
  regularMealsCategory?.subcategories.flatMap((subcategory) => subcategory.items) ?? [];

const toRegularMealOption = (item: BamboozItemInput): ComboOption => {
  const target = regularMealOptionTargets[item.id] ?? {
    itemId: item.id,
    categoryId: "bamboocza-combos",
  };
  return {
    id: scopedId(item.id),
    name: item.name,
    categoryId: scopedId(target.categoryId),
    itemId: scopedId(target.itemId),
    price: item.price ?? 0,
  };
};

export const bamboozCombos: Combo[] = regularMealsCategory
  ? [
      {
        id: scopedId("regular-meal"),
        restaurant: BAMBOOZ_RESTAURANT,
        name: regularMealsCategory.name,
        description: `Choose from ${regularMealItems.length} regular meals`,
        image: getBamboozItemImage(regularMealItems[0]?.id ?? ""),
        items: [],
        selectionGroups: [
          {
            id: scopedId("regular-meal-choice"),
            name: "Choose your meal",
            required: true,
            minSelections: 1,
            maxSelections: 1,
            options: regularMealItems.map(toRegularMealOption),
          },
        ],
        pricing: {
          type: "sum-of-selected-items",
          basePrice: null,
          currency: "INR",
        },
      },
    ]
  : [];

const hiddenCategoryIds = new Set([
  "bamboocza-combos",
  "cold-coffee",
  "sandwiches",
  "special-combos",
]);

export const bamboozCategories: Category[] = menu.menu
  .filter((category) => !hiddenCategoryIds.has(category.id))
  .map((category) => {
    const subcategories = category.subcategories.flatMap((subcategory) =>
      subcategory.items.map(toSubcategory)
    );
    return {
      id: scopedId(category.id),
      name: category.name,
      image: subcategories.find((subcategory) => subcategory.image)?.image,
      description: category.description ?? "Bambooz kitchen",
      restaurant: BAMBOOZ_RESTAURANT,
      subcategories,
    };
  });

export function isBamboozItem(subcategory: Subcategory): boolean {
  return (
    subcategory.restaurant === BAMBOOZ_RESTAURANT ||
    subcategory.id.startsWith(`${BAMBOOZ_RESTAURANT}--`)
  );
}
