import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  coreCategories,
  coreCombos,
  getComboStartingPrice,
  type Category,
  type Combo,
  type Subcategory,
} from "../data/products";
import { getMenuItemImage } from "../data/products_diy_chineese";
import {
  getMenu,
  type MenuResponse,
  type RestaurantInfo,
} from "../services/api";

interface MenuContextType {
  restaurants: RestaurantInfo[];
  categories: Category[];
  combos: Combo[];
  combosCategory: Category;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

const MAIN_RESTAURANT_ID = "diy-main";

const tagMain = <T extends { restaurantId?: string; restaurant?: string }>(
  item: T
): T => ({
  ...item,
  restaurantId: item.restaurantId ?? MAIN_RESTAURANT_ID,
  restaurant: item.restaurant ?? MAIN_RESTAURANT_ID,
});

const imageFor = (data: Record<string, unknown>) => {
  const imageRef = data.imageRef;
  return typeof imageRef === "string"
    ? getMenuItemImage(imageRef)
    : undefined;
};

const toCategory = (raw: Record<string, unknown>): Category => {
  const id = String(raw.id ?? "");
  const restaurantId = String(raw.restaurantId ?? MAIN_RESTAURANT_ID);
  const subcategories = Array.isArray(raw.subcategories)
    ? raw.subcategories.map((entry) => {
        const sub = entry as Record<string, unknown>;
        const subId = String(sub.id ?? "");
        return {
          ...sub,
          id: subId,
          name: String(sub.name ?? subId),
          image: imageFor(sub),
          restaurantId,
          restaurant: restaurantId,
        } as Subcategory;
      })
    : [];
  return {
    ...raw,
    id,
    name: String(raw.name ?? id),
    description: String(raw.description ?? "Fresh from our kitchen"),
    image: imageFor(raw),
    subcategories,
    restaurantId,
    restaurant: restaurantId,
  } as Category;
};

const toCombo = (raw: Record<string, unknown>): Combo => {
  const id = String(raw.id ?? "");
  const restaurantId = String(raw.restaurantId ?? MAIN_RESTAURANT_ID);
  return {
    ...raw,
    id,
    name: String(raw.name ?? id),
    description: String(raw.description ?? ""),
    image: imageFor(raw),
    restaurantId,
    restaurant: restaurantId,
  } as Combo;
};

const buildMenu = (data: MenuResponse) => {
  const staticCategories = coreCategories.map(tagMain);
  const staticCombos = coreCombos.map(tagMain);
  const dynamicCategories = data.categories.map((raw) =>
    toCategory(raw as Record<string, unknown>)
  );
  const dynamicCombos = data.combos.map((raw) =>
    toCombo(raw as Record<string, unknown>)
  );
  const categories = [...staticCategories, ...dynamicCategories];
  const combos = [...staticCombos, ...dynamicCombos];
  const combosCategory: Category = {
    id: "combos",
    name: "Combos",
    description: "Value combos & meals",
    image: coreCategories.find((category) => category.id === "combos")?.image,
    subcategories: combos.map((combo) => ({
      id: combo.id,
      name: combo.name,
      price: getComboStartingPrice(combo),
      image: combo.image,
      restaurantId: combo.restaurantId,
      restaurant: combo.restaurantId,
    })),
    restaurantId: MAIN_RESTAURANT_ID,
    restaurant: MAIN_RESTAURANT_ID,
  };
  return { categories, combos, combosCategory };
};

export function MenuProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<MenuResponse>({
    restaurants: [],
    categories: [],
    combos: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setData(await getMenu());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load menu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const menu = useMemo(() => buildMenu(data), [data]);

  return (
    <MenuContext.Provider
      value={{
        restaurants: data.restaurants,
        categories: menu.categories,
        combos: menu.combos,
        combosCategory: menu.combosCategory,
        loading,
        error,
        refresh: load,
      }}
    >
      {children}
    </MenuContext.Provider>
  );
}

export function useMenu() {
  const context = useContext(MenuContext);
  if (!context) throw new Error("useMenu must be used within MenuProvider");
  return context;
}
