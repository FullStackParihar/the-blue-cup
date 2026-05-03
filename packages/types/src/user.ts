// ==========================================
// User Types
// ==========================================

export type UserRole = "admin" | "staff";

export interface User {
  _id?: string;
  email: string;
  password?: string;
  role: UserRole;
  createdAt?: Date;
  updatedAt?: Date;
}
