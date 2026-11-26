import type { ImageSourcePropType } from "react-native";

const LEGACY_SCOPED_PREFIX = "diy_chineese--";

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

export const getMenuItemImage = (
  itemId: string
): ImageSourcePropType | undefined => {
  const legacyId = itemId.startsWith(LEGACY_SCOPED_PREFIX)
    ? itemId.slice(LEGACY_SCOPED_PREFIX.length)
    : itemId;
  return itemImages[itemId] ?? itemImages[legacyId];
};
