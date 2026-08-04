export interface Subcategory {
  id: string;
  name: string;
  price: number;
  image?: string;
}

export interface Category {
  id: string;
  name: string;
  image?: string;
  description: string;
  subcategories: Subcategory[];
}

export interface ComboItem {
  id: string;
  name: string;
  image?: string;
}

export interface Combo {
  id: string;
  name: string;
  description: string;
  totalPrice: number;
  image?: string;
  subItems: ComboItem[];
}

export const categories: Category[] = [
  {
    id: "waffles",
    name: "Waffles",
    image: "https://loremflickr.com/400/300/waffle,food",
    description: "Crispy waffles with delicious toppings",
    subcategories: [
      {
        id: "single-chocolate",
        name: "Single Chocolate",
        price: 79,
        image: "https://loremflickr.com/400/300/waffle,chocolate",
      },
      {
        id: "triple-chocolate",
        name: "Triple Chocolate",
        price: 89,
        image: "https://loremflickr.com/400/300/waffle,chocolate",
      },
      {
        id: "strawberry-chocolate",
        name: "Strawberry Chocolate",
        price: 99,
        image: "https://loremflickr.com/400/300/waffle,strawberry",
      },
      {
        id: "ice-cream-chocolate",
        name: "Ice Cream Chocolate",
        price: 110,
        image: "https://loremflickr.com/400/300/waffle,icecream",
      },
      {
        id: "oreo-crush-chocolate",
        name: "Oreo Crush Chocolate",
        price: 110,
        image: "https://loremflickr.com/400/300/waffle,oreo",
      },
    ],
  },
  {
    id: "mini-pancakes",
    name: "Mini Pancakes",
    image: "https://loremflickr.com/400/300/pancake,food",
    description: "Soft mini pancakes with chocolate toppings",
    subcategories: [
      {
        id: "chocolate-8pcs",
        name: "Chocolate (8 pcs)",
        price: 79,
        image: "https://loremflickr.com/400/300/pancake,chocolate",
      },
      {
        id: "chocolate-11pcs",
        name: "Chocolate (11 pcs)",
        price: 99,
        image: "https://loremflickr.com/400/300/pancake,chocolate",
      },
      {
        id: "chocolate-strawberry-11pcs",
        name: "Chocolate Strawberry (11 pcs)",
        price: 110,
        image: "https://loremflickr.com/400/300/pancake,strawberry",
      },
      {
        id: "oreo-crush-11pcs",
        name: "Oreo Crush (11 pcs)",
        price: 110,
        image: "https://loremflickr.com/400/300/pancake,oreo",
      },
      {
        id: "ice-cream-chocolate-11pcs",
        name: "Ice Cream Chocolate (11 pcs)",
        price: 119,
        image: "https://loremflickr.com/400/300/pancake,icecream",
      },
    ],
  },
  {
    id: "churros",
    name: "Churros",
    image: "https://loremflickr.com/400/300/churros,food",
    description: "Fresh churros with chocolate dip",
    subcategories: [
      {
        id: "single-chocolate-dip",
        name: "Single Chocolate Dip",
        price: 49,
        image: "https://loremflickr.com/400/300/churros,chocolate",
      },
      {
        id: "double-chocolate-dip",
        name: "Double Chocolate Dip",
        price: 59,
        image: "https://loremflickr.com/400/300/churros,chocolate",
      },
    ],
  },
  {
    id: "chocolate-strawberry",
    name: "Chocolate Strawberry",
    image: "https://loremflickr.com/400/300/strawberry,chocolate",
    description: "Fresh strawberries dipped in chocolate",
    subcategories: [
      {
        id: "chocolate-strawberry-stick",
        name: "Chocolate Strawberry Stick (4 Fresh Strawberries)",
        price: 49,
        image: "https://loremflickr.com/400/300/strawberry,chocolate",
      },
      {
        id: "chocolate-strawberry-glass",
        name: "Chocolate Strawberry Glass",
        price: 79,
        image: "https://loremflickr.com/400/300/strawberry,glass",
      },
      {
        id: "chocolate-strawberry-bowl",
        name: "Chocolate Strawberry Bowl",
        price: 110,
        image: "https://loremflickr.com/400/300/strawberry,bowl",
      },
    ],
  },
  {
    id: "burgers",
    name: "Burgers",
    image: "https://loremflickr.com/400/300/burger,food",
    description: "Juicy grilled burgers",
    subcategories: [
      {
        id: "basic-burger",
        name: "Basic Burger",
        price: 39,
        image: "https://loremflickr.com/400/300/burger",
      },
      {
        id: "cheese-burger",
        name: "Cheese Burger",
        price: 59,
        image: "https://loremflickr.com/400/300/cheeseburger",
      },
    ],
  },
  {
    id: "sandwiches",
    name: "Sandwiches",
    image: "https://loremflickr.com/400/300/sandwich,food",
    description: "Fresh grilled sandwiches",
    subcategories: [
      {
        id: "veg-grilled-sandwich",
        name: "Veg Grilled Sandwich",
        price: 49,
        image: "https://loremflickr.com/400/300/sandwich,veg",
      },
      {
        id: "cheese-grilled-sandwich",
        name: "Cheese Grilled Sandwich",
        price: 69,
        image: "https://loremflickr.com/400/300/grilled,sandwich",
      },
    ],
  },
  {
    id: "corn",
    name: "Corn",
    image: "https://loremflickr.com/400/300/corn,food",
    description: "Hot and flavorful corn",
    subcategories: [
      {
        id: "classic-corn",
        name: "Classic Corn",
        price: 49,
        image: "https://loremflickr.com/400/300/corn",
      },
      {
        id: "masala-corn",
        name: "Masala Corn",
        price: 59,
        image: "https://loremflickr.com/400/300/corn,masala",
      },
      {
        id: "corn-chaat",
        name: "Corn Chaat",
        price: 79,
        image: "https://loremflickr.com/400/300/corn,chaat",
      },
    ],
  },
  {
    id: "cheese-balls",
    name: "Cheese Balls",
    image: "https://loremflickr.com/400/300/cheese,ball",
    description: "Crispy cheese balls",
    subcategories: [
      {
        id: "5-cheese-balls",
        name: "5 Cheese Balls",
        price: 59,
        image: "https://loremflickr.com/400/300/cheese,ball",
      },
      {
        id: "8-cheese-balls",
        name: "8 Cheese Balls",
        price: 89,
        image: "https://loremflickr.com/400/300/cheese,ball",
      },
    ],
  },
  {
    id: "french-fries",
    name: "French Fries",
    image: "https://loremflickr.com/400/300/fries,food",
    description: "Crispy golden fries",
    subcategories: [
      {
        id: "regular-fries",
        name: "Regular Fries",
        price: 39,
        image: "https://loremflickr.com/400/300/fries",
      },
      {
        id: "peri-peri-fries",
        name: "Peri-Peri Fries",
        price: 49,
        image: "https://loremflickr.com/400/300/fries,spicy",
      },
    ],
  },

  {
    id: "cold-coffee",
    name: "Cold Coffee",
    image: "https://loremflickr.com/400/300/cold,coffee",
    description: "Refreshing cold drinks",
    subcategories: [
      {
        id: "classic-cold-coffee",
        name: "Classic Cold Coffee",
        price: 69,
        image: "https://loremflickr.com/400/300/cold,coffee",
      },
    ],
  },
  {
    id: "mohitos",
    name: "Mojitos",
    image: "https://loremflickr.com/400/300/mojito,drink",
    description: "Mojito drinks",
    subcategories: [
      {
        id: "hazelnut-mojito",
        name: "Hazelnut Mojito",
        price: 69,
        image: "https://loremflickr.com/400/300/mojito",
      },
      {
        id: "spicy-mango-mojito",
        name: "Spicy Mango Mojito",
        price: 69,
        image: "https://loremflickr.com/400/300/mojito,mango",
      },
      {
        id: "green-apple-mojito",
        name: "Green Apple Mojito",
        price: 69,
        image: "https://loremflickr.com/400/300/mojito,apple",
      },
      {
        id: "watermelon-mojito",
        name: "Watermelon Mojito",
        price: 69,
        image: "https://loremflickr.com/400/300/mojito,watermelon",
      },
      {
        id: "lemon-iced-tea-mojito",
        name: "Lemon Iced Tea Mojito",
        price: 69,
        image: "https://loremflickr.com/400/300/mojito,lemon",
      },
      {
        id: "blue-curacao-mojito",
        name: "Blue Curacao Mojito",
        price: 69,
        image: "https://loremflickr.com/400/300/mojito,blue",
      },
    ],
  },
  {
    id: "hot-beverages",
    name: "Hot Beverages",
    image: "https://loremflickr.com/400/300/tea,food",
    description: "Freshly brewed hot drinks",
    subcategories: [
      {
        id: "hot-coffee",
        name: "Hot Coffee",
        price: 29,
        image: "https://loremflickr.com/400/300/coffee,hot",
      },
      {
        id: "kulhad-chai",
        name: "Kulhad Chai",
        price: 20,
        image: "https://loremflickr.com/400/300/chai,tea",
      },
      {
        id: "regular-tea",
        name: "Regular Tea",
        price: 15,
        image: "https://loremflickr.com/400/300/tea",
      },
    ],
  },
];

export const combos: Combo[] = [
  {
    id: "burger-feast-combo",
    name: "Burger Feast",
    description: "Most Loved Combo",
    totalPrice: 167,
    image: "https://loremflickr.com/400/300/combo,burger",
    subItems: [
      {
        id: "cheese-burger",
        name: "Cheese Burger",
        image: "https://loremflickr.com/400/300/cheeseburger",
      },
      {
        id: "peri-peri-fries",
        name: "Peri-Peri Fries",
        image: "https://loremflickr.com/400/300/fries,spicy",
      },
      {
        id: "cold-coffee",
        name: "Cold Coffee",
        image: "https://loremflickr.com/400/300/cold,coffee",
      },
    ],
  },
  {
    id: "ultimate-waffle-combo",
    name: "Ultimate Waffle Combo",
    description: "Most Loved Combo",
    totalPrice: 208,
    image: "https://loremflickr.com/400/300/combo,waffle",
    subItems: [
      {
        id: "oreo-crush-chocolate-waffle",
        name: "Oreo Crush Chocolate Waffle",
        image: "https://loremflickr.com/400/300/waffle,oreo",
      },
      {
        id: "regular-fries",
        name: "Regular Fries",
        image: "https://loremflickr.com/400/300/fries",
      },
      {
        id: "cold-coffee",
        name: "Cold Coffee",
        image: "https://loremflickr.com/400/300/cold,coffee",
      },
    ],
  },
  {
    id: "power-combo",
    name: "Power Combo",
    description: "Customer Favorite",
    totalPrice: 177,
    image: "https://loremflickr.com/400/300/combo,power",
    subItems: [
      {
        id: "cheese-burger",
        name: "Cheese Burger",
        image: "https://loremflickr.com/400/300/cheeseburger",
      },
      {
        id: "5-cheese-balls",
        name: "5 Cheese Balls",
        image: "https://loremflickr.com/400/300/cheese,ball",
      },
      {
        id: "cold-coffee",
        name: "Cold Coffee",
        image: "https://loremflickr.com/400/300/cold,coffee",
      },
    ],
  },
  {
    id: "chocolate-strawberry-combo",
    name: "Chocolate Strawberry Combo",
    description: "Customer Favorite",
    totalPrice: 208,
    image: "https://loremflickr.com/400/300/combo,strawberry",
    subItems: [
      {
        id: "chocolate-strawberry-bowl",
        name: "Chocolate Strawberry Bowl",
        image: "https://loremflickr.com/400/300/strawberry,bowl",
      },
      {
        id: "regular-fries",
        name: "Regular Fries",
        image: "https://loremflickr.com/400/300/fries",
      },
      {
        id: "cold-coffee",
        name: "Cold Coffee",
        image: "https://loremflickr.com/400/300/cold,coffee",
      },
    ],
  },
  {
    id: "sandwich-meal",
    name: "Sandwich Meal",
    description: "Best Value Meal",
    totalPrice: 157,
    image: "https://loremflickr.com/400/300/combo,sandwich",
    subItems: [
      {
        id: "cheese-grilled-sandwich",
        name: "Cheese Grilled Sandwich",
        image: "https://loremflickr.com/400/300/grilled,sandwich",
      },
      {
        id: "regular-fries",
        name: "Regular Fries",
        image: "https://loremflickr.com/400/300/fries",
      },
      {
        id: "cold-coffee",
        name: "Cold Coffee",
        image: "https://loremflickr.com/400/300/cold,coffee",
      },
    ],
  },
  {
    id: "cheese-ball-meal",
    name: "Cheese Ball Meal",
    description: "Best Value Meal",
    totalPrice: 187,
    image: "https://loremflickr.com/400/300/combo,cheese",
    subItems: [
      {
        id: "8-cheese-balls",
        name: "8 Cheese Balls",
        image: "https://loremflickr.com/400/300/cheese,ball",
      },
      {
        id: "peri-peri-fries",
        name: "Peri-Peri Fries",
        image: "https://loremflickr.com/400/300/fries,spicy",
      },
      {
        id: "cold-coffee",
        name: "Cold Coffee",
        image: "https://loremflickr.com/400/300/cold,coffee",
      },
    ],
  },
  {
    id: "corn-snack-combo",
    name: "Corn Snack Combo",
    description: "Best Value Meal",
    totalPrice: 157,
    image: "https://loremflickr.com/400/300/combo,corn",
    subItems: [
      {
        id: "masala-corn",
        name: "Masala Corn",
        image: "https://loremflickr.com/400/300/corn,masala",
      },
      {
        id: "regular-fries",
        name: "Regular Fries",
        image: "https://loremflickr.com/400/300/fries",
      },
      {
        id: "mojito",
        name: "Mojito",
        image: "https://loremflickr.com/400/300/mojito",
      },
    ],
  },
];

export const combosCategory: Category = {
  id: "combos",
  name: "Combos",
  image: "https://loremflickr.com/400/300/combo,meal",
  description: "Value combos & meals",
  subcategories: combos.map((c) => ({
    id: c.id,
    name: c.name,
    price: c.totalPrice,
    image: c.image,
  })),
};

export interface IceCreamFlavour {
  id: string;
  name: string;
  image?: string;
}

export interface IceCreamItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  scoopLimit: number;
  flavours: IceCreamFlavour[];
}

const iceCreamFlavourOptions: IceCreamFlavour[] = [
  {
    id: "chocolate",
    name: "Chocolate",
    image: "https://loremflickr.com/400/300/icecream,chocolate",
  },
  {
    id: "vanilla",
    name: "Vanilla",
    image: "https://loremflickr.com/400/300/icecream,vanilla",
  },
  {
    id: "mango",
    name: "Mango",
    image: "https://loremflickr.com/400/300/icecream,mango",
  },
  {
    id: "strawberry",
    name: "Strawberry",
    image: "https://loremflickr.com/400/300/icecream,strawberry",
  },
  {
    id: "black-currant",
    name: "Black Currant",
    image: "https://loremflickr.com/400/300/icecream,blackcurrant",
  },
  {
    id: "kesar-pista",
    name: "Kesar Pista",
    image: "https://loremflickr.com/400/300/icecream,pistachio",
  },
  {
    id: "tutti-frutti",
    name: "Tutti Frutti",
    image: "https://loremflickr.com/400/300/icecream,tuttifrutti",
  },
  {
    id: "fruit-nut",
    name: "Fruit & Nut",
    image: "https://loremflickr.com/400/300/icecream,fruitnut",
  },
  {
    id: "cassata",
    name: "Cassata",
    image: "https://loremflickr.com/400/300/icecream,cassata",
  },
];

export const iceCreams: IceCreamItem[] = [
  {
    id: "cone-classic",
    name: "Cone Classic (1 Scoop)",
    description: "Choose any flavour",
    price: 30,
    scoopLimit: 1,
    image: "https://loremflickr.com/400/300/icecream,cone",
    flavours: iceCreamFlavourOptions,
  },
  {
    id: "double-delight",
    name: "Double Delight (2 Scoops)",
    description: "Choose any 2 flavours",
    price: 60,
    scoopLimit: 2,
    image: "https://loremflickr.com/400/300/icecream,scoop",
    flavours: iceCreamFlavourOptions,
  },
  {
    id: "triple-treat",
    name: "Triple Treat (3 Scoops)",
    description: "Choose any 3 flavours",
    price: 80,
    scoopLimit: 3,
    image: "https://loremflickr.com/400/300/icecream,triple",
    flavours: iceCreamFlavourOptions,
  },
];

export const iceCreamCategory: Category = {
  id: "ice-cream",
  name: "Ice Cream",
  image: "https://loremflickr.com/400/300/icecream,cone",
  description: "Ice creams & scoops",
  subcategories: [],
};
