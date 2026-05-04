// ==========================================
// Menu Item Types
// ==========================================

export interface MenuItem {
  _id?: string;
  name: string;
  description: string;
  price: number;
  category: MenuCategory;
  image?: string;
  isAvailable: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type MenuCategory =
  | "Tea"
  | "Coffee"
  | "Ice Tea"
  | "Mocktails"
  | "Shakes"
  | "Breads"
  | "Burger"
  | "Pav & Fries"
  | "Sandwich"
  | "Pasta"
  | "Pizza"
  | "Cafe Special"
  | "Momo"
  | "Maggi"
  | "Rolls"
  | "Dessert"
  | "Pastry"
  | "Beverage";

export const MENU_CATEGORIES: MenuCategory[] = [
  "Tea",
  "Coffee",
  "Ice Tea",
  "Mocktails",
  "Shakes",
  "Breads",
  "Burger",
  "Pav & Fries",
  "Sandwich",
  "Pasta",
  "Pizza",
  "Cafe Special",
  "Momo",
  "Maggi",
  "Rolls",
  "Dessert",
  "Pastry",
  "Beverage",
];
