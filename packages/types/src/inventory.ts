export interface InventoryItem {
  _id?: string;
  name: string;
  category: string;
  currentStock: number;
  minStockAlert: number;
  unit: string;
  costPrice: number;
  supplier?: string;
  lastRestocked?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryTransaction {
  _id?: string;
  inventoryItem: string | InventoryItem;
  type: "restock" | "consume" | "spoilage" | "adjustment";
  quantity: number;
  note?: string;
  performedBy: string;
  createdAt?: string;
}

export interface RecipeIngredient {
  inventoryItem: string | InventoryItem;
  quantity: number;
}

export interface Recipe {
  _id?: string;
  menuItem: string;
  ingredients: RecipeIngredient[];
}
