export interface Subcategory {
  id: string;
  name: string;
  price: number;
}

export interface Category {
  id: string;
  name: string;
  image: string;
  description: string;
  subcategories: Subcategory[];
}

export const categories: Category[] = [
  {
    id: "burgers",
    name: "Burgers",
    image: "https://loremflickr.com/400/400/burger,food",
    description: "Juicy grilled burgers",
    subcategories: [
      { id: "basic-burger", name: "Basic Burger", price: 39 },
      { id: "cheese-burger", name: "Cheese Burger", price: 59 },
    ],
  },
  {
    id: "pizza",
    name: "Pizza",
    image: "https://loremflickr.com/400/400/pizza,food",
    description: "Freshly baked pizzas",
    subcategories: [
      { id: "cheese-blast", name: "Cheese Blast", price: 99 },
      { id: "spicy-italiano", name: "Spicy Italiano", price: 149 },
      { id: "veggie-supreme", name: "Veggie Supreme", price: 199 },
    ],
  },
  {
    id: "sandwich",
    name: "Sandwich",
    image: "https://loremflickr.com/400/400/sandwich,food",
    description: "Grilled sandwiches",
    subcategories: [
      { id: "veg-grilled", name: "Veg Grilled", price: 49 },
      { id: "cheese-grilled", name: "Cheese Grilled", price: 69 },
    ],
  },
  {
    id: "french-fries",
    name: "French Fries",
    image: "https://loremflickr.com/400/400/fries,food",
    description: "Crispy fries",
    subcategories: [
      { id: "very-very-fries", name: "Very Very Fries", price: 49 },
      { id: "regular-fries", name: "Regular Fries", price: 79 },
    ],
  },
  {
    id: "cheese-balls",
    name: "Cheese Balls",
    image: "https://loremflickr.com/400/400/cheese,balls",
    description: "Cheesy snacks",
    subcategories: [
      { id: "cheese-balls-5", name: "Cheese Balls (5 Pcs)", price: 59 },
      { id: "cheese-balls-8", name: "Cheese Balls (8 Pcs)", price: 79 },
    ],
  },
  {
    id: "corn-chaat",
    name: "Corn Chaat",
    image: "https://loremflickr.com/400/400/corn,food",
    description: "Healthy corn snacks",
    subcategories: [
      { id: "classic-corn", name: "Classic Corn", price: 49 },
      { id: "masala-corn", name: "Masala Corn", price: 49 },
    ],
  },
  {
    id: "churros",
    name: "Churros",
    image: "https://loremflickr.com/400/400/churros,dessert",
    description: "Chocolate dipped churros",
    subcategories: [
      { id: "single-choco-dip", name: "Single Chocolate Dip", price: 49 },
      { id: "double-choco-dip", name: "Double Chocolate Dip", price: 69 },
    ],
  },
  {
    id: "ice-cream",
    name: "Ice Cream",
    image: "https://loremflickr.com/400/400/icecream,dessert",
    description: "Delicious ice cream",
    subcategories: [
      { id: "icecream-1", name: "1 Scoop", price: 30 },
      { id: "icecream-3", name: "3 Scoops", price: 70 },
    ],
  },
  {
    id: "waffles",
    name: "Waffles",
    image: "https://loremflickr.com/400/400/waffle,dessert",
    description: "Belgian waffles",
    subcategories: [
      { id: "single-chocolate", name: "Single Chocolate", price: 79 },
      { id: "triple-chocolate", name: "Triple Chocolate", price: 89 },
      { id: "icecream-chocolate-waffle", name: "Ice Cream Chocolate Waffle", price: 99 },
      { id: "strawberry-chocolate", name: "Strawberry Chocolate", price: 99 },
      { id: "oreo-crush-waffle", name: "Oreo Crush", price: 109 },
      { id: "gems-waffle", name: "Gems", price: 109 },
    ],
  },
  {
    id: "pancakes",
    name: "Pancakes",
    image: "https://loremflickr.com/400/400/pancake,breakfast",
    description: "Soft fluffy pancakes",
    subcategories: [
      { id: "chocolate-pancake", name: "Chocolate Pancake (8 Pcs)", price: 79 },
      { id: "chocolate-strawberry", name: "Chocolate Strawberry", price: 99 },
      { id: "oreo-crush-pancake", name: "Oreo Crush", price: 109 },
    ],
  },
  {
    id: "mojitos",
    name: "Mojitos",
    image: "https://loremflickr.com/400/400/mojito,drink",
    description: "Refreshing mojitos",
    subcategories: [
      { id: "virgin-mojito", name: "Virgin Mojito", price: 69 },
      { id: "blue-lagoon", name: "Blue Lagoon", price: 69 },
      { id: "green-apple", name: "Green Apple", price: 69 },
      { id: "watermelon", name: "Watermelon", price: 69 },
      { id: "kiwi", name: "Kiwi", price: 69 },
      { id: "orange-mint", name: "Orange Mint", price: 69 },
      { id: "strawberry", name: "Strawberry", price: 69 },
      { id: "lychee", name: "Lychee", price: 69 },
    ],
  },
  {
    id: "cold-coffee",
    name: "Cold Coffee",
    image: "https://loremflickr.com/400/400/coldcoffee,drink",
    description: "Creamy cold coffees",
    subcategories: [
      { id: "classic-cold-coffee", name: "Classic Cold Coffee", price: 69 },
      { id: "vanilla-cold-coffee", name: "Vanilla Cold Coffee", price: 79 },
      { id: "hazelnut-cold-coffee", name: "Hazelnut Cold Coffee", price: 79 },
      { id: "caramel-cold-coffee", name: "Caramel Cold Coffee", price: 79 },
      { id: "oreo-cold-coffee", name: "Oreo Cold Coffee", price: 79 },
    ],
  },
  {
    id: "coffee",
    name: "Coffee",
    image: "https://loremflickr.com/400/400/coffee,drink",
    description: "Coffee beverages",
    subcategories: [
      { id: "cold-coffee-drink", name: "Cold Coffee", price: 69 },
      { id: "ice-cream-cold-coffee", name: "Ice Cream Cold Coffee", price: 89 },
    ],
  },
  {
    id: "kulhar-chai",
    name: "Kulhar Chai",
    image: "https://loremflickr.com/400/400/chai,tea",
    description: "Traditional kulhar tea",
    subcategories: [
      { id: "kulhar-chai", name: "Kulhar Chai", price: 29 },
    ],
  },
  {
    id: "combos",
    name: "Combos",
    image: "https://loremflickr.com/400/400/food,combo",
    description: "Best value combos",
    subcategories: [
      { id: "burger-combo", name: "Burger + Fries + Cold Coffee", price: 129 },
      { id: "pizza-combo", name: "Pizza + Mojito", price: 149 },
      { id: "waffle-combo", name: "Waffle + Cold Coffee", price: 129 },
      { id: "sandwich-combo", name: "Sandwich + Fries + Cold Coffee", price: 129 },
      { id: "cheese-balls-combo", name: "Cheese Balls (5 Pcs) + Mojito", price: 119 },
      { id: "dessert-combo", name: "Churros + Ice Cream (1 Scoop)", price: 99 },
    ],
  },
  {
    id: "addons",
    name: "Add-ons",
    image: "https://loremflickr.com/400/400/topping,cheese",
    description: "Extra toppings",
    subcategories: [
      { id: "extra-cheese", name: "Extra Cheese", price: 20 },
      { id: "extra-mayo", name: "Extra Mayo", price: 10 },
      { id: "extra-chocolate", name: "Extra Chocolate", price: 10 },
      { id: "extra-icecream", name: "Extra Ice Cream Scoop", price: 20 },
    ],
  },
];
