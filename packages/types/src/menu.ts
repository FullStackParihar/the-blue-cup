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

export type MenuCategory = string;

export const MENU_CATEGORIES: string[] = [
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
  "Frappes",
  "Hot Chocolate",
  "OTC",
];
