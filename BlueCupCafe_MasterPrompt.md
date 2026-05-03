# 🫙 Blue Cup Cafe — Master Build & Improvement Prompt
> Use this document as the single source of truth when prompting an AI coding assistant (Cursor, Claude Code, GitHub Copilot, etc.) to build or improve the application.

---

## 📋 HOW TO USE THIS DOCUMENT

Split this document into **phases**. Give your AI assistant one phase at a time. Each phase is self-contained and references the existing tech stack (Turborepo monorepo, React + Vite + TypeScript + Tailwind, Node.js + Express + Socket.io, MongoDB + Mongoose).

Always start a new session by pasting this preamble:

```
You are working on "The Blue Cup Cafe" — a real-time cafe ordering system built as a Turborepo monorepo.
- Frontend: apps/client (React + Vite + TypeScript + Tailwind + Framer Motion + Zustand + TanStack Query)
- Backend: apps/server (Node.js + Express + TypeScript + Socket.io)
- Database: MongoDB + Mongoose
- Shared: packages/types, packages/ui

The application must be fully mobile-first and responsive. All new UI must be designed mobile-first (375px base) and scale up gracefully to desktop. Use Tailwind CSS utility classes for all styling. Do not use any new UI libraries unless explicitly instructed.
```

---

---

# ═══════════════════════════════════════
# PHASE 1 — QR Scan & Smart Table Linking
# ═══════════════════════════════════════

## Goal
When a customer scans a QR code on their table, the app must automatically detect the table number, store it in session, and carry it through the entire order flow without the customer ever having to type it.

## Prompt for AI Assistant

```
TASK: Implement the Smart QR Table Linking system for Blue Cup Cafe.

### 1. QR Code URL Format (Backend — already partially implemented, verify/update)
Each table QR code must encode a URL in this format:
  https://<domain>/menu?table=<tableNumber>

Example: https://bluecup.cafe/menu?table=5

The admin panel's QR generator (/admin → Table QR Codes section) already generates these. Verify it uses this exact URL format.

### 2. Table Detection on Frontend (apps/client)
When the /menu page loads:
  a. Read the `table` query param from the URL: const params = new URLSearchParams(window.location.search)
  b. If `table` param exists:
     - Store it in Zustand cart store: cartStore.setTableNumber(tableNumber)
     - Store it in localStorage as 'bluecup_table' for persistence
     - Show a small non-intrusive toast/banner: "📍 You're ordering from Table {tableNumber}"
  c. If no `table` param and localStorage has 'bluecup_table', restore it.
  d. If neither, set tableNumber to null (walk-in / counter order).

### 3. Zustand Cart Store Update (apps/client/src/store/cartStore.ts)
Add these fields and actions to the existing cart Zustand store:
  - tableNumber: number | null
  - deviceId: string  (see Phase 4 for device ID generation)
  - customerName: string
  - customerPhone: string
  - setTableNumber(n: number | null): void
  - setCustomerInfo(name: string, phone: string): void

### 4. Table Number in Order Payload
When an order is placed (POST /api/orders), include:
  {
    items: [...],
    tableNumber: cartStore.tableNumber,
    customerName: cartStore.customerName,
    customerPhone: cartStore.customerPhone,
    deviceId: cartStore.deviceId,
    specialInstructions: string
  }

### 5. Mongoose Order Schema Update (apps/server/src/models/Order.ts)
Add these fields to the Order schema:
  tableNumber: { type: Number, default: null }
  customerName: { type: String, default: 'Guest' }
  customerPhone: { type: String, default: '' }
  deviceId: { type: String, required: true }
  specialInstructions: { type: String, default: '' }

### 6. Admin UI: Show Table Number
In the admin Kanban board and KDS, each order card must prominently display:
  - "Table {N}" badge (amber pill) if tableNumber is set
  - "Walk-in" badge (gray pill) if tableNumber is null

### Mobile UX note
The "You're at Table {N}" banner must be:
  - Fixed at the top, below the navbar
  - Height: 36px, subtle amber background (#FEF3C7), small text
  - Auto-dismiss after 4 seconds with a fade-out animation
  - Not shown again if the customer navigates between pages (use session flag)
```

---

---

# ═══════════════════════════════════════════════════════
# PHASE 2 — Mobile-First Menu UI/UX Redesign
# ═══════════════════════════════════════════════════════

## Goal
Completely redesign the /menu page for an exceptional mobile experience. Think of how top food delivery apps (Zomato, Swiggy, Uber Eats) present their menus.

## Prompt for AI Assistant

```
TASK: Redesign the /menu page with a premium mobile-first UI. The design language should be warm, modern, and cafe-appropriate — not generic e-commerce.

### Layout Structure (Mobile: 375px, Desktop: scales up)

#### A. Sticky Header (always visible while scrolling)
  - Left: Cafe logo/name "The Blue Cup" (small, 16px)
  - Center: Search bar (icon only on mobile, expands on tap)
  - Right: Basket icon with item count badge (tapping opens basket popup)
  - Background: white with subtle bottom border
  - Height: 56px

#### B. Hero Banner (below header, not sticky)
  - Full-width image banner with gradient overlay
  - Text: "Fresh. Fast. Delicious." — large serif headline
  - Subtext: current operating hours
  - Height: 160px on mobile

#### C. Category Filter Pills (horizontally scrollable, sticky below header when scrolling)
  - Horizontal scroll, no scrollbar visible
  - Active pill: filled with cafe primary color (#92400E — warm brown), white text
  - Inactive pill: white bg, brown border
  - Pills: All, Coffee ☕, Tea 🍵, Pastry 🥐, Sandwich 🥪, Cold Drinks, Specials
  - Smooth scroll-snap behavior
  - Height: 48px with 12px vertical padding

#### D. Menu Item Cards (vertical list on mobile, 2-col grid on tablet+)
Each card must have:
  - Full-width image (16:9 ratio, lazy loaded, blur placeholder)
  - Item name (16px, semibold)
  - Description (13px, muted, 2-line clamp)
  - Price (16px, bold, warm brown color)
  - Dietary tags: Veg 🟢 / Non-veg 🔴 / Vegan 🌱 — small pill badges
  - Availability toggle indicator (grayed out + "Unavailable" overlay if not available)
  - Add button: "+" circle on the right side of the card (not a full-width button)
  - If item already in cart: show quantity stepper (+/-) inline instead of Add button
  - Tap anywhere on card: open Item Customization Modal (see below)

#### E. Item Customization Modal (bottom sheet on mobile, centered modal on desktop)
Triggered when customer taps a menu item card.
  - Item image (full width, 200px tall)
  - Item name + price
  - Description (full, no clamp)
  - If item has variants (size: Small/Medium/Large), show radio pill selectors
  - If item has add-ons (extra shot, oat milk, etc.), show checkbox list
  - Quantity stepper (- 1 +) at the bottom
  - Large CTA button: "Add to Basket — ₹{price}" (warm brown bg, white text)
  - Dismiss: tap outside or swipe down
  - Animation: slide up from bottom on mobile (use Framer Motion)

#### F. Implementation Notes
  - Use TanStack Query to fetch menu items: useQuery(['menu'], fetchMenuItems)
  - Keep category state in local useState, not URL params
  - Skeleton loading state for cards (gray shimmer placeholders)
  - Error state with retry button
  - Empty state message when no items in a category
  - All images must have loading="lazy" and a fallback placeholder
```

---

---

# ═══════════════════════════════════════════════════════
# PHASE 3 — Floating Basket Popup & Checkout Flow
# ═══════════════════════════════════════════════════════

## Goal
Replace the existing /cart page flow with a floating basket popup (like Swiggy/Zomato) that appears over the menu, and a streamlined checkout sheet.

## Prompt for AI Assistant

```
TASK: Build the Floating Basket Popup + Checkout Sheet for Blue Cup Cafe.

### 1. Floating Basket Button (persistent, bottom-right on mobile)
  - Fixed position: bottom: 80px, right: 16px (above mobile nav if any)
  - Only visible when cartStore.items.length > 0
  - Design: pill button "🛒 View Basket (N items) · ₹{total}"
  - Background: #92400E (warm brown), white text
  - On tap: open BasketPopup
  - Animate in/out with Framer Motion (scale + opacity)

### 2. BasketPopup Component (bottom sheet, max-height: 70vh)
Location: apps/client/src/components/BasketPopup.tsx

Structure:
  - Handle bar at top (for drag-to-dismiss feel — use Framer Motion drag)
  - Header: "Your Basket" + item count + "Clear All" text button
  - Scrollable list of cart items:
    Each item row:
      - Item name (14px, medium)
      - Variant if selected (12px, muted)
      - Quantity stepper (- N +) — updating Zustand store
      - Item subtotal on right (14px, bold)
      - Swipe left to delete item (use Framer Motion drag)
  - Separator line
  - Special Instructions textarea:
    - Placeholder: "Any requests for the kitchen? (e.g. less sugar, no ice)"
    - Max 200 characters
    - Character counter
  - Order Summary section:
    - Subtotal
    - Tax (5%)
    - Total (bold, larger)
  - CTA button: "Proceed to Checkout" (full-width, brown)
  - Clicking CTA: close basket popup, open CheckoutSheet

### 3. CheckoutSheet Component (full-screen on mobile, centered modal on desktop)
Location: apps/client/src/components/CheckoutSheet.tsx

Sections (vertical, scrollable):

  A. Order Details (read-only summary)
     - "Ordering for: Table {N}" or "Walk-in Order"
     - Compact item list
     - Total amount

  B. Your Details (optional fields)
     - Input: "Your Name" (text, optional)
     - Input: "Mobile Number" (tel, optional)
     - Small note: "Only used to notify you about your order"

  C. Account Section (optional login)
     - Text: "Have an account? Sign in for loyalty points and order history"
     - "Sign In with Google" button (gray outlined, Google logo SVG)
     - "Continue as Guest" link (underlined text)
     - If signed in: show "Welcome back, {name}! 👋" and pre-fill details

  D. Payment Method (future — for now show "Pay at Counter" as selected option)
     - Radio: ✅ Pay at Counter (default, always available)
     - Radio: 💳 Online Payment (Coming Soon — disabled, grayed out)

  E. Place Order Button
     - "Place Order · ₹{total}" — full-width, brown, large (52px height)
     - On tap: POST to /api/orders with full payload (see Phase 1 schema)
     - Loading state: spinner inside button, text changes to "Placing order..."
     - On success: navigate to /orders?tracking={orderId} and clear cart

  F. Related Items Section (above checkout button)
     Title: "Customers also love..."
     - Horizontal scroll of 4-5 menu items (small cards, 140px wide)
     - Fetch: GET /api/menu/recommendations?orderId={currentItems}&limit=5
     - Backend logic: return items NOT in current cart, sorted by popularity (order frequency from completed orders)
     - Tapping adds directly to cart with toast confirmation

### 4. Backend: Recommendations Endpoint
Location: apps/server/src/routes/menu.ts

GET /api/menu/recommendations
Query params: items (comma-separated item IDs), limit (default 5)
Logic:
  - Query completed orders containing the given item IDs
  - Extract co-occurring items (items ordered together)
  - Sort by frequency
  - Exclude items already in the request's `items` param
  - Return top {limit} items with full menu item details
  - Fallback: if no co-occurrence data, return top-selling items

### Mobile UX Notes
  - All sheets use Framer Motion: y: "100%" → y: 0, spring physics
  - Backdrop: semi-transparent black overlay behind sheets
  - Keyboard-aware: sheets must scroll so inputs are never hidden by the virtual keyboard
  - Form validation: show inline errors (red border + message) before allowing order placement
```

---

---

# ═══════════════════════════════════════════════════════
# PHASE 4 — Device ID, Anonymous Auth & Customer Login
# ═══════════════════════════════════════════════════════

## Goal
Track each customer device uniquely for order history and notifications, and allow optional Google login for loyalty features.

## Prompt for AI Assistant

```
TASK: Implement device-based tracking + optional Google login for Blue Cup Cafe customers.

### 1. Device ID Generation (apps/client/src/lib/deviceId.ts)
Create a utility that generates and persists a unique device ID.

Implementation:
  import { v4 as uuidv4 } from 'uuid'

  export function getDeviceId(): string {
    const STORAGE_KEY = 'bluecup_device_id'
    let deviceId = localStorage.getItem(STORAGE_KEY)
    if (!deviceId) {
      deviceId = `device_${uuidv4()}`
      localStorage.setItem(STORAGE_KEY, deviceId)
    }
    return deviceId
  }

Initialize this in App.tsx on mount and store in Zustand: cartStore.setDeviceId(getDeviceId())

### 2. MongoDB: DeviceSession Schema (apps/server/src/models/DeviceSession.ts)
  {
    deviceId: { type: String, required: true, unique: true, index: true },
    orderIds: [{ type: ObjectId, ref: 'Order' }],
    pushSubscription: { type: Object, default: null },  // Web Push subscription object
    customerId: { type: ObjectId, ref: 'Customer', default: null },  // if logged in
    createdAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date, default: Date.now }
  }

On every order creation (POST /api/orders):
  - Find or create DeviceSession by deviceId
  - Push orderId to deviceSession.orderIds
  - Update lastSeenAt

### 3. Order History by Device
Frontend: /orders page
  - On load, fetch: GET /api/orders?deviceId={deviceId}
  - Backend: filter orders by deviceId, sort by createdAt desc
  - Show last 10 orders with status badges
  - Each order is collapsible to show item details

### 4. Optional Google Login (Recommended: use a simple JWT approach, no Passport.js needed)

Backend — Customer Schema (apps/server/src/models/Customer.ts):
  {
    googleId: String,
    name: String,
    email: String,
    phone: String,
    deviceIds: [String],  // allows same account across devices
    orderIds: [{ type: ObjectId, ref: 'Order' }],
    createdAt: Date
  }

Backend — Auth Route (apps/server/src/routes/auth.ts):
  POST /api/auth/google
    Body: { idToken: string, deviceId: string }
    - Verify Google ID token using google-auth-library
    - Find or create Customer record
    - Link deviceId to customer.deviceIds
    - Return JWT: { token, customer: { name, email } }

Frontend — Google Login Flow:
  - Use @react-oauth/google package (lightweight)
  - GoogleOAuthProvider wraps the app with clientId from .env
  - In CheckoutSheet, "Sign In with Google" uses useGoogleLogin() hook
  - On success: call POST /api/auth/google with credential
  - Store JWT in localStorage as 'bluecup_auth_token'
  - Update Zustand: authStore.setCustomer(customer)

### 5. Auth Zustand Store (apps/client/src/store/authStore.ts)
  {
    customer: { name: string, email: string } | null,
    token: string | null,
    isAuthenticated: boolean,
    login(customer, token): void,
    logout(): void
  }

### 6. Environment Variables Needed
Frontend (.env):
  VITE_GOOGLE_CLIENT_ID=your_google_client_id

Backend (.env):
  GOOGLE_CLIENT_ID=your_google_client_id
  JWT_SECRET=your_secret_key

### Notes
  - Login is ALWAYS optional. "Continue as Guest" must always be available.
  - If customer is logged in, pre-fill name/phone in checkout
  - If logged in, merge device order history with account order history
  - Show "Signed in as {name}" in the CheckoutSheet header
```

---

---

# ═══════════════════════════════════════════════════════
# PHASE 5 — Real-Time Notifications (Customer + Admin)
# ═══════════════════════════════════════════════════════

## Goal
Customers receive push notifications as their order progresses (Preparing → Ready → Completed). Admins receive persistent new-order alerts. All notifications are tied to device ID.

## Prompt for AI Assistant

```
TASK: Implement Web Push Notifications for both customers and admin in Blue Cup Cafe.

### Technology: Web Push API + service worker
Use the 'web-push' npm package on the backend. Use the browser's PushManager API on the frontend.

### 1. Backend Setup (apps/server)

Install: npm install web-push
Generate VAPID keys once: npx web-push generate-vapid-keys
Add to .env:
  VAPID_PUBLIC_KEY=...
  VAPID_PRIVATE_KEY=...
  VAPID_EMAIL=mailto:admin@bluecup.cafe

Create: apps/server/src/lib/pushNotifications.ts
  import webpush from 'web-push'
  webpush.setVapidDetails(process.env.VAPID_EMAIL, process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY)

  export async function sendPushToDevice(deviceId: string, payload: PushPayload) {
    const session = await DeviceSession.findOne({ deviceId })
    if (!session?.pushSubscription) return
    try {
      await webpush.sendNotification(session.pushSubscription, JSON.stringify(payload))
    } catch (err) {
      // If subscription is expired (410), remove it
      if (err.statusCode === 410) {
        await DeviceSession.updateOne({ deviceId }, { $unset: { pushSubscription: 1 } })
      }
    }
  }

  export async function sendPushToAdmin(payload: PushPayload) {
    // Find all admin device sessions
    const adminSessions = await DeviceSession.find({ isAdmin: true, pushSubscription: { $ne: null } })
    for (const session of adminSessions) {
      await sendPushToDevice(session.deviceId, payload)
    }
  }

  type PushPayload = { title: string, body: string, icon?: string, data?: Record<string, any> }

### 2. Push Subscription Route
POST /api/notifications/subscribe
  Body: { subscription: PushSubscription, deviceId: string }
  Action: DeviceSession.findOneAndUpdate({ deviceId }, { pushSubscription: subscription }, { upsert: true })
  Response: { success: true }

DELETE /api/notifications/unsubscribe
  Body: { deviceId: string }
  Action: Remove pushSubscription from DeviceSession

### 3. Service Worker (apps/client/public/sw.js)
Create this file:
  self.addEventListener('push', (event) => {
    const data = event.data.json()
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: '/icons/icon-192.png',
        badge: '/icons/badge-72.png',
        data: data.data,
        vibrate: [100, 50, 100],
        actions: data.actions || []
      })
    )
  })

  self.addEventListener('notificationclick', (event) => {
    event.notification.close()
    const url = event.notification.data?.url || '/'
    event.waitUntil(clients.openWindow(url))
  })

### 4. Frontend Push Permission (apps/client/src/lib/pushNotifications.ts)
  export async function subscribeToPush(deviceId: string): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false
    
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return false

    const registration = await navigator.serviceWorker.register('/sw.js')
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY)
    })

    await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription, deviceId })
    })
    return true
  }

### 5. When to Request Push Permission
  - After order is successfully placed (in the order confirmation screen):
    Show a banner: "🔔 Get notified when your order is ready?"
    Button: "Allow Notifications" → calls subscribeToPush()
    Button: "No thanks" → dismisses permanently (localStorage flag: 'bluecup_push_declined')
  - Never ask on first page load or on the menu page

### 6. Trigger Notifications on Order Status Change
In the order status update handler (Socket.io + REST):

When admin changes order status via Kanban (PATCH /api/orders/:id/status):
  const messages = {
    'preparing': { title: '👨‍🍳 Your order is being prepared!', body: 'Sit tight, the kitchen is on it.' },
    'ready': { title: '✅ Your order is ready!', body: 'Please collect your order from the counter. Table {N}.' },
    'completed': { title: '🙏 Thanks for visiting!', body: 'Hope to see you again at The Blue Cup.' }
  }
  
  const msg = messages[newStatus]
  if (msg) {
    // 1. Emit Socket.io event (for in-app UI update)
    io.emit('orderStatusUpdate', { orderId, status: newStatus })
    
    // 2. Send push notification to customer's device
    await sendPushToDevice(order.deviceId, {
      ...msg,
      data: { url: `/orders?tracking=${orderId}`, orderId }
    })
  }

When new order is placed (POST /api/orders):
  // Send to admin devices
  await sendPushToAdmin({
    title: '🆕 New Order!',
    body: `Table ${tableNumber || 'Walk-in'} — ₹${totalAmount} — ${itemCount} items`,
    data: { url: '/admin', orderId }
  })

### 7. In-App Notification (fallback when app is open)
When Socket.io event 'orderStatusUpdate' is received and the order belongs to this device:
  - Show a toast notification at the top of the screen (Framer Motion slide down)
  - Toast style: green bg for 'ready', amber for 'preparing'
  - Auto-dismiss after 5 seconds
  - Tap navigates to /orders?tracking={orderId}
```

---

---

# ═══════════════════════════════════════════════════════
# PHASE 6 — Real-Time Order Tracking Page
# ═══════════════════════════════════════════════════════

## Goal
A beautiful, real-time order tracking page that customers land on after ordering.

## Prompt for AI Assistant

```
TASK: Build the real-time Order Tracking page for Blue Cup Cafe customers.

### Route: /orders (or /orders?tracking=<orderId>)

### Page Structure (mobile-first)

#### A. If tracking a specific order (URL has ?tracking=orderId):
  Show the "Active Order" section at the top, full-width.

#### B. Active Order Card
  Design: Prominent card, warm cream background (#FFFBF5)

  Content:
    - Order number: "#1042" (large, bold, top-left)
    - Table number badge (top-right): "Table 5" or "Walk-in"
    - Estimated wait time: "~12 minutes" (only for 'preparing' status)
    
    Status Progress Tracker (horizontal stepper):
      4 steps: Pending → Preparing → Ready → Completed
      - Each step: icon + label below
      - Active step: filled circle (brown), bold label, animated pulse ring
      - Completed steps: filled circle (green with checkmark)
      - Inactive steps: empty gray circle
      - Connecting lines between steps fill left-to-right as status progresses
      - Animation: Framer Motion (each transition animates smoothly)
      
      Icons:
        Pending: ⏳  Preparing: 👨‍🍳  Ready: ✅  Completed: 🎉
    
    Item list (collapsed by default, expand button):
      - "View your items" toggle
      - When expanded: show item name + quantity + price per row
    
    "Call Waiter" button (outline style, full-width below item list):
      - On tap: emit socket 'waiterCalled' event with { tableNumber, orderId, deviceId }
      - Shows loading state → changes to "✅ Waiter notified!" for 3 seconds

#### C. Past Orders (below active order, or alone if no active order)
  Header: "Your Past Orders"
  Fetch: GET /api/orders?deviceId={deviceId}&status=completed&limit=10
  
  Each past order: collapsed card
    - Date + time (left)
    - Order total (right, bold)
    - Item count subtitle
    - "View Details" tap to expand
    - "Download Receipt" button (PDF using existing jspdf logic)

#### D. Empty State (no orders at all)
  - Illustration: simple coffee cup SVG (inline, not an image file)
  - Text: "No orders yet"
  - Button: "Browse Menu" → navigate to /menu

#### E. Socket.io Real-Time Updates
  - On mount: connect to socket and join room: socket.emit('joinOrderRoom', { orderId, deviceId })
  - Listen: socket.on('orderStatusUpdate', ({ orderId, status }) => update local state)
  - On status change: animate the progress tracker, show in-app toast
  - On unmount: socket.emit('leaveOrderRoom', { orderId })

### Backend Socket Room Logic (apps/server/src/socket/index.ts)
  socket.on('joinOrderRoom', ({ orderId, deviceId }) => {
    socket.join(`order_${orderId}`)
  })
  
  // When status changes:
  io.to(`order_${orderId}`).emit('orderStatusUpdate', { orderId, status: newStatus })
```

---

---

# ═══════════════════════════════════════════════════════
# PHASE 7 — Admin Dashboard UX Overhaul
# ═══════════════════════════════════════════════════════

## Goal
Make the admin dashboard fully mobile-friendly and more powerful with persistent waiter call queue and improved Kanban.

## Prompt for AI Assistant

```
TASK: Overhaul the Admin Dashboard for Blue Cup Cafe.

### 1. Mobile Navigation Fix
Current: hamburger slide-out menu
Keep this. Additionally:
  - Bottom tab bar on mobile (≤768px): 4 tabs with icons
    [📋 Orders] [🍽️ Menu] [📊 Analytics] [⚙️ Settings]
  - Tab bar: fixed bottom, white bg, 56px height, icon + label, active tab highlighted

### 2. Kanban Board Improvements (Live Orders)

A. Column headers must show order count badge: "Pending (3)"

B. Order cards must display:
   - Order number (bold, large)
   - Table number OR "Walk-in" (pill badge)
   - Time since order (auto-updating: "2m ago", "15m ago")
   - Item list (compact, 2-line clamp, "...and 2 more" if > 3 items)
   - Total amount
   - Customer name if provided
   - Action buttons:
     - For "Pending" cards: "Start Preparing" button (fills to Preparing)
     - For "Preparing" cards: "Mark Ready" button (fills to Ready)
     - For "Ready" cards: "Complete" button (fills to Completed)
   - Swipe right on mobile to advance status (Framer Motion drag gesture)

C. New Order Audio Alert:
   - On 'newOrderAlert' socket event: play sound AND show a persistent banner at top:
     "🆕 New Order — Table {N} · ₹{amount}" with "View" button
   - Banner stays until clicked or dismissed manually (not auto-dismiss)

### 3. Persistent Waiter Call Queue (NEW FEATURE)
This fixes the current ephemeral waiter call problem.

Backend:
  - New WaiterCall schema:
    { orderId, tableNumber, deviceId, status: 'pending'|'acknowledged', createdAt }
  - POST /api/waiter-calls — create new call (emitted from customer /orders page)
  - PATCH /api/waiter-calls/:id/acknowledge — mark as acknowledged
  - GET /api/waiter-calls?status=pending — get all pending calls

Admin UI — "Waiter Calls" panel (sidebar or modal):
  - Bell icon in admin header with red badge showing count of pending calls
  - Click opens a slide-out panel listing all pending calls:
    Each call: "Table {N} is calling — 2m ago" + "Acknowledge" button
  - Acknowledging removes from list and emits socket event to customer:
    socket.emit('waiterAcknowledged', { orderId }) 
    → Customer sees: "✅ Waiter is on the way!"
  - On page load: fetch GET /api/waiter-calls?status=pending to restore state

### 4. Analytics Page Improvements
  - Date range picker (Today / Last 7 Days / This Month)
  - Summary cards: Total Orders, Completed, Revenue, Avg Order Value
  - Line chart: revenue over time (existing SVG chart, make it responsive)
  - Top 5 items: horizontal bar chart with item image thumbnail
  - Table: recent completed orders (searchable by order number or customer name)
  - Export button: download CSV of orders for selected date range

### 5. JWT Admin Auth (Finalize)
  - POST /api/admin/login: { username, password } → JWT token (24h expiry)
  - Store token in httpOnly cookie (not localStorage)
  - Backend middleware: authMiddleware.ts checks cookie on all /api/admin/* routes
  - Frontend: if /admin route is accessed without valid session, redirect to /admin/login
  - Admin login page: simple centered form, cafe branding

### 6. Menu Management Modal Improvements
  - Add Cloudinary image upload:
    - File input + preview thumbnail
    - On select: upload to Cloudinary via POST /api/upload/image
    - Backend: use cloudinary npm package, return secure_url
    - Store URL in menu item's imageUrl field
  - Image is required when creating a new item (not for editing)
```

---

---

# ═══════════════════════════════════════════════════════
# PHASE 8 — PWA, Polish & Performance
# ═══════════════════════════════════════════════════════

## Goal
Make the app installable as a Progressive Web App (PWA) and polish all remaining rough edges.

## Prompt for AI Assistant

```
TASK: Convert Blue Cup Cafe frontend into a PWA and apply final polish.

### 1. PWA Setup (apps/client)
Install: npm install vite-plugin-pwa
Configure in vite.config.ts:
  VitePWA({
    registerType: 'autoUpdate',
    manifest: {
      name: 'The Blue Cup Cafe',
      short_name: 'Blue Cup',
      description: 'Order from your table at The Blue Cup Cafe',
      theme_color: '#92400E',
      background_color: '#FFFBF5',
      display: 'standalone',
      start_url: '/',
      icons: [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
      ]
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      runtimeCaching: [
        { urlPattern: /^https:\/\/.*\/api\/menu/, handler: 'NetworkFirst',
          options: { cacheName: 'menu-cache', expiration: { maxAgeSeconds: 3600 } } }
      ]
    }
  })

Create app icons: 192x192 and 512x512 PNG. Use a coffee cup design with brown (#92400E) background.

### 2. VAPID Key Environment Variable
In apps/client/.env:
  VITE_VAPID_PUBLIC_KEY=<your_vapid_public_key>

### 3. Global Toast System
Create: apps/client/src/components/Toast/ToastProvider.tsx
  - Context-based toast system
  - Support types: 'success' | 'error' | 'info' | 'warning'
  - Position: top-center on mobile, top-right on desktop
  - Framer Motion slide-down animation
  - Auto-dismiss: 4 seconds
  - Max 3 toasts visible at once
  - Swipe up to dismiss individual toast on mobile

Replace all ad-hoc alert/notification UIs across the app with this system.

### 4. Loading & Error States
Ensure every data-fetching component has:
  - Skeleton loading (gray shimmer using CSS animation)
  - Error state with retry button
  - Empty state with helpful message + action button

### 5. Accessibility
  - All interactive elements must have aria-label
  - Focus visible rings (2px brown outline)
  - Minimum tap target: 44x44px on all buttons
  - Color contrast ratio: minimum 4.5:1 for all text

### 6. Performance
  - Images: use WebP format where possible, always include width/height attributes
  - Code split: lazy load admin routes (React.lazy + Suspense)
  - Bundle: verify no duplicate dependencies across Turborepo packages
  - Font: use system font stack as fallback, load Google Fonts with font-display: swap

### 7. Error Boundary
  Wrap the app in a global ErrorBoundary component that shows a friendly error screen
  with a "Reload" button instead of a blank white screen on JS errors.

### 8. 404 Page
  Create a friendly 404 page with:
  - Coffee spill illustration (SVG, inline)
  - "Oops! This page doesn't exist"
  - "Back to Menu" button
```

---

---

# ═══════════════════════════════════════════════════════
# APPENDIX A — Shared Types (packages/types)
# ═══════════════════════════════════════════════════════

```typescript
// packages/types/src/index.ts

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled'

export interface MenuItem {
  _id: string
  name: string
  description: string
  price: number
  category: 'coffee' | 'tea' | 'pastry' | 'sandwich' | 'cold-drink' | 'special' | 'other'
  imageUrl: string
  isAvailable: boolean
  isVeg: boolean
  variants?: MenuVariant[]
  addOns?: MenuAddOn[]
  orderCount: number  // for popularity sorting
  createdAt: string
}

export interface MenuVariant {
  name: string  // e.g. "Small", "Medium", "Large"
  priceModifier: number  // added to base price
}

export interface MenuAddOn {
  name: string  // e.g. "Extra Shot", "Oat Milk"
  price: number
}

export interface CartItem {
  menuItem: MenuItem
  quantity: number
  selectedVariant?: MenuVariant
  selectedAddOns: MenuAddOn[]
  specialNote?: string
}

export interface Order {
  _id: string
  orderNumber: number
  items: OrderItem[]
  status: OrderStatus
  tableNumber: number | null
  customerName: string
  customerPhone: string
  deviceId: string
  specialInstructions: string
  subtotal: number
  tax: number
  total: number
  createdAt: string
  updatedAt: string
}

export interface OrderItem {
  menuItem: MenuItem
  quantity: number
  selectedVariant?: MenuVariant
  selectedAddOns: MenuAddOn[]
  itemTotal: number
}

export interface WaiterCall {
  _id: string
  orderId: string
  tableNumber: number | null
  deviceId: string
  status: 'pending' | 'acknowledged'
  createdAt: string
}

export interface Customer {
  _id: string
  googleId: string
  name: string
  email: string
  phone: string
  deviceIds: string[]
  orderIds: string[]
  createdAt: string
}

export interface PushPayload {
  title: string
  body: string
  icon?: string
  data?: Record<string, any>
}
```

---

---

# ═══════════════════════════════════════════════════════
# APPENDIX B — Socket.io Events Reference
# ═══════════════════════════════════════════════════════

```
CLIENT → SERVER:
  joinOrderRoom       { orderId, deviceId }
  leaveOrderRoom      { orderId }
  waiterCalled        { orderId, tableNumber, deviceId }

SERVER → CLIENT (all connected):
  newOrderAlert       { order: Order }
  orderStatusUpdate   { orderId, status: OrderStatus, order: Order }
  waiterCalled        { orderId, tableNumber, deviceId, callId }
  waiterAcknowledged  { orderId, callId }

SERVER → CLIENT (specific order room):
  orderStatusUpdate   { orderId, status: OrderStatus }
```

---

---

# ═══════════════════════════════════════════════════════
# APPENDIX C — API Endpoints Reference
# ═══════════════════════════════════════════════════════

```
PUBLIC ENDPOINTS (no auth required):
  GET    /api/menu                              — all available menu items
  GET    /api/menu/recommendations?items=...   — related items
  POST   /api/orders                            — place new order
  GET    /api/orders?deviceId=...               — orders by device
  GET    /api/orders/:id                        — single order
  POST   /api/auth/google                       — Google login
  POST   /api/notifications/subscribe           — save push subscription
  DELETE /api/notifications/unsubscribe         — remove subscription
  POST   /api/waiter-calls                      — call a waiter

ADMIN ENDPOINTS (JWT required):
  GET    /api/admin/orders                      — all orders
  PATCH  /api/orders/:id/status                 — update order status
  GET    /api/menu/admin                        — all items (incl. unavailable)
  POST   /api/menu                              — create menu item
  PATCH  /api/menu/:id                          — update menu item
  DELETE /api/menu/:id                          — delete menu item
  PATCH  /api/menu/:id/toggle                   — toggle availability
  GET    /api/analytics/summary                 — dashboard stats
  GET    /api/analytics/sales?range=7d          — sales data
  GET    /api/waiter-calls?status=pending        — pending waiter calls
  PATCH  /api/waiter-calls/:id/acknowledge      — acknowledge call
  POST   /api/upload/image                      — upload to Cloudinary
  POST   /api/admin/login                       — admin login
```

---

---

# ═══════════════════════════════════════════════════════
# APPENDIX D — Environment Variables
# ═══════════════════════════════════════════════════════

```
# apps/server/.env
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_jwt_secret_min_32_chars
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password

GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com

VAPID_EMAIL=mailto:admin@bluecup.cafe
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...

CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

CLIENT_URL=http://localhost:5173

# apps/client/.env
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
VITE_VAPID_PUBLIC_KEY=...
```

---

*Document version 1.0 — Blue Cup Cafe Master Build Prompt*
*Generated for AI-assisted development. Use one phase at a time for best results.*
