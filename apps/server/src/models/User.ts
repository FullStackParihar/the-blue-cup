import mongoose, { Schema } from "mongoose";
import type { User as UserType } from "@the-blue-cup/types";

const userSchema = new Schema<UserDoc>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "staff", "customer"],
      default: "customer",
    },
    name: {
      type: String,
    },
    phone: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export interface UserDoc extends mongoose.Document {
  email: string;
  password?: string;
  role: "admin" | "staff" | "customer";
  name?: string;
  phone?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const User = mongoose.model<UserDoc>("User", userSchema);
export default User;
