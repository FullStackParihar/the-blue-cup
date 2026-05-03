# 🏛️ PROJECT BLUEPRINT (v2): The Blue Cup Cafe - Real-Time Ordering System (Modern TS Stack)

---

## 1. 🚀 System Architecture (Modernized)

### 🧠 Core Stack (Type-Safe)

* **Frontend:** React + Vite + TypeScript
* **Backend:** Node.js + Express + TypeScript
* **Database:** MongoDB + Mongoose (with TS types)
* **State Management:** Zustand (lightweight + TS friendly)
* **Real-Time Engine:** Socket.io
* **Styling:** Tailwind CSS + Framer Motion
* **Auth:** JWT (HTTP-only cookies)

---

### 📦 Monorepo Setup

Use modern tooling:

* **Package Manager:** pnpm (recommended)
* **Monorepo Tool:** TurboRepo

```
apps/
  client/   (React + Vite + TS)
  server/   (Express + TS)
packages/
  ui/       (shared components)
  types/    (shared TS types)
```

---

## 2. ⚙️ TypeScript Configuration

### Root `tsconfig.json`

```json id="ts-root"
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Node",
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@types/*": ["packages/types/*"]
    }
  }
}
```

---

### Backend `tsconfig.json`

```json id="ts-backend"
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "esModuleInterop": true
  },
  "include": ["src"]
}
```

---

### Frontend `tsconfig.json`

```json id="ts-frontend"
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "types": ["vite/client"]
  }
}
```

---

## 3. 🎨 Tailwind Design System (Same Theme, Better Structure)

Add to `tailwind.config.ts`:

```ts id="tailwind-config"
export default {
  theme: {
    extend: {
      colors: {
        "primary-navy": "#1A2B4C",
        "antique-cream": "#FDFBF7",
        "accent-gold": "#D4AF37",
        "alert-red": "#E63946"
      },
      fontFamily: {
        heading: ["Playfair Display", "serif"],
        body: ["Inter", "sans-serif"]
      }
    }
  }
}
```

---

## 4. 🗄️ Database Schema (Typed Mongoose)

### Shared Types (`packages/types/order.ts`)

```ts id="types-order"
export interface OrderItem {
  menuItem: string;
  quantity: number;
  customization?: string;
}

export type OrderStatus =
  | "Pending"
  | "Preparing"
  | "Ready"
  | "Completed"
  | "Cancelled";

export interface Order {
  tableNumber: number;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: Date;
}
```

---

### Mongoose Model (Type-Safe)

```ts id="mongoose-order"
import mongoose, { Schema, Document } from "mongoose";

interface OrderDoc extends Document {
  tableNumber: number;
  items: {
    menuItem: mongoose.Types.ObjectId;
    quantity: number;
    customization?: string;
  }[];
  totalAmount: number;
  status: string;
  createdAt: Date;
}

const OrderSchema = new Schema<OrderDoc>({
  tableNumber: { type: Number, required: true },
  items: [
    {
      menuItem: { type: Schema.Types.ObjectId, ref: "MenuItem" },
      quantity: { type: Number, required: true },
      customization: String
    }
  ],
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ["Pending", "Preparing", "Ready", "Completed", "Cancelled"],
    default: "Pending"
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<OrderDoc>("Order", OrderSchema);
```

---

## 5. 🔌 Real-Time (Typed Socket.io)

### Server

```ts id="socket-server"
io.on("connection", (socket) => {
  socket.on("joinAdminRoom", () => {
    socket.join("admin-dashboard");
  });
});

export const emitNewOrder = (order: any) => {
  io.to("admin-dashboard").emit("newOrderAlert", order);
};
```

---

### Client Hook

```ts id="socket-client"
import { io } from "socket.io-client";

export const socket = io("http://localhost:5000");

export const useAdminSocket = () => {
  socket.emit("joinAdminRoom");

  socket.on("newOrderAlert", (data) => {
    console.log("New Order:", data);
  });
};
```

---

## 6. 🧠 State Management (Zustand + TS)

```ts id="zustand-store"
import { create } from "zustand";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
}

export const useCartStore = create<CartStore>((set) => ({
  items: [],
  addItem: (item) =>
    set((state) => ({
      items: [...state.items, item]
    }))
}));
```

---

## 7. 📊 Modern Enhancements (Highly Recommended)

### Replace/Upgrade:

* ❌ Axios → ✅ native `fetch` + React Query (TanStack Query)
* ❌ Manual forms → ✅ React Hook Form + Zod validation
* ❌ Basic auth → ✅ Access + Refresh Token strategy

---

## 8. 🧪 Dev Tooling

* ESLint + Prettier
* Husky (pre-commit hooks)
* ts-node-dev (backend dev)
* vite (frontend dev)

---

## 9. 🚀 Updated Execution Plan

### Phase 1

* Setup TurboRepo + pnpm workspace
* Initialize TS configs

### Phase 2

* Setup Express with TS
* MongoDB connection
* Typed models

### Phase 3

* React UI (Vite + TS)
* Zustand store
* Menu + Cart

### Phase 4

* Socket.io integration
* Admin dashboard (real-time)

### Phase 5

* Checkout + API integration

### Phase 6

* Analytics + charts

---

## ✅ Final Result

A **production-grade, modern TypeScript full-stack system** with:

* Full type safety (frontend + backend)
* Real-time ordering (Socket.io)
* Scalable monorepo architecture
* Clean UI system (Tailwind + Motion)

---
