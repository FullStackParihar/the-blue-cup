# ☕ The Blue Cup - Cafe Management System

Welcome to **The Blue Cup**, a fully functional, real-time, and dynamic cafe management system. This application is built as a robust MERN-stack monorepo, designed to seamlessly bridge the customer ordering experience with advanced administrative management.

## 🌟 Key Features

### 🚀 Customer Experience
*   **QR-Code Ready Navigation:** Customers can scan a table's QR code (e.g., `/?table=5`) to automatically lock their table number into the system.
*   **Dynamic Menu:** Browse beautifully categorized, database-driven menu items with high-quality descriptions and pricing.
*   **Smart Cart System:** Fully persistent cart state (via Zustand local storage) to ensure items aren't lost if the page refreshes.
*   **Real-Time Order Tracking:** Watch the status of an order dynamically change (Pending -> Preparing -> Ready -> Completed) via Socket.io.
*   **🛎️ Call Waiter System:** A floating bell icon allows customers to summon a waiter. This instantly pings the admin dashboard in real-time.
*   **🧾 PDF Invoicing:** Customers can download a professional, itemized PDF receipt once their order is marked as "Completed".

### 👑 Admin Dashboard
*   **Kanban Order Management:** Click-to-move orders through the kitchen pipeline seamlessly.
*   **Real-Time Notifications:** Instantly receive alerts for new orders, status updates, and "Call Waiter" requests.
*   **Menu Management (CRUD):** Add, edit, disable, or delete menu items directly from the interface.
*   **Analytics Dashboard:** Auto-calculating sales figures, top items, and revenue metrics.
*   **Receipt Generation:** Admins can also download PDF receipts for any completed order.

---

## 🏗️ Technical Architecture

This project is structured as a **TurboRepo Monorepo**, utilizing **pnpm** for package management.

### Tech Stack:
*   **Frontend (`apps/client`):** React 19, Vite, TypeScript, Tailwind CSS, Framer Motion (for premium animations), Zustand (State Management), TanStack Query (Data Fetching), Socket.io Client, jsPDF.
*   **Backend (`apps/server`):** Node.js, Express, TypeScript, MongoDB (Mongoose), Socket.io (Real-time events).
*   **Shared (`packages/types`):** Cross-stack TypeScript interfaces ensuring complete type safety from database to UI.

---

## 🚦 Getting Started

### Prerequisites
*   Node.js (v18+)
*   npm
*   MongoDB running locally. 

### 1. Install Dependencies
Using npm (workspaces are configured):
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` in `apps/server` (if it doesn't exist):
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/the-blue-cup
JWT_SECRET=blue-cup-super-secret
CLIENT_URL=http://localhost:5173
```

### 3. Seed the Database
Populate your database with the dynamic, realistic menu (ensure `mongod` is running first):
```bash
cd apps/server
npm run seed
cd ../..
```

### 4. Start the Application
Run both the frontend and backend concurrently via TurboRepo:
```bash
npm run dev
```

- **Frontend (Customer App):** `http://localhost:5173/?table=12`
- **Frontend (Admin Panel):** `http://localhost:5173/admin/login` (Admin defaults: `admin@thebluecup.com` / `admin123`)
- **Backend API:** `http://localhost:5000/api/health`

## 🐳 Docker Deployment
```bash
docker-compose up --build
```

---

## 📁 Project Structure

```text
the-blue-cup/
├── apps/
│   ├── client/       # React + Vite frontend
│   └── server/       # Node + Express + Socket.io backend
├── packages/
│   ├── types/        # Shared TypeScript interfaces (Order, MenuItem, etc.)
│   └── ui/           # Shared UI components
├── project_blueprint.md # Foundational planning & architecture document
├── turbo.json        # TurboRepo configuration
└── package.json      # Root workspace configuration
```

## 📜 Scripts
*   `pnpm dev`: Runs the development server for all apps.
*   `pnpm build`: Builds all packages and apps for production.
*   `pnpm format`: Runs formatting tools across the workspace.
