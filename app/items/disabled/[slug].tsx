import { useLocalSearchParams } from "expo-router";
import { useMenu } from "../../../context/MenuContext";
import { DisabledItemsScreenView } from "../disabled";

export default function RestaurantDisabledItemsScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { restaurants } = useMenu();
  const restaurant = restaurants.find(
    (entry) => entry.slug === slug || entry.id === slug
  );
  return <DisabledItemsScreenView restaurantId={restaurant?.id ?? slug} />;
}
