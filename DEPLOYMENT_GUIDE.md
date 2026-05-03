# 🚀 Deployment Guide: The Blue Cup

Follow these steps to take your artisan cafe management system live.

## 1. Database: MongoDB Atlas
Since the project currently uses a local MongoDB, you need a cloud-hosted database for production.
1. Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a **Shared Cluster** (Free).
3. In **Network Access**, add `0.0.0.0/0` (Allow access from anywhere).
4. In **Database Access**, create a user with a password.
5. Click **Connect** -> **Drivers** and copy the Connection String. It looks like:
   `mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/the-blue-cup?retryWrites=true&w=majority`

---

## 2. Backend: Render (or Railway)
Deploy the server first so you have an API URL for the frontend.
1. Create a **New Web Service** on [Render](https://render.com).
2. Connect your GitHub repository.
3. **Settings**:
   - **Root Directory**: `apps/server`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node dist/index.js`
4. **Environment Variables**:
   - `MONGODB_URI`: (Your MongoDB Atlas connection string)
   - `JWT_SECRET`: (Generate a long random string)
   - `JWT_REFRESH_SECRET`: (Another long random string)
   - `CLIENT_URL`: (Your frontend URL, e.g., `https://the-blue-cup.vercel.app`)
   - `PORT`: `10000` (Render default)

---

## 3. Frontend: Vercel (or Netlify)
Vercel is highly recommended for React/Vite apps.
1. Create a **New Project** on [Vercel](https://vercel.com).
2. Connect your GitHub repository.
3. **Settings**:
   - **Root Directory**: `apps/client`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **Environment Variables**:
   - `VITE_API_URL`: `https://your-backend-url.onrender.com/api`
   - `VITE_SOCKET_URL`: `https://your-backend-url.onrender.com`

---

## 4. Final Verification
1. Once both are deployed, go to your Frontend URL.
2. Open the **Live Tracker** and ensure the socket connects (the sound icon should pulse).
3. Try placing a test order.
4. Check the **Admin Dashboard** to ensure the order appears in real-time.

---

### 💡 Pro Tip: Secret Admin Access
Remember, the admin console is hidden! To access it in production:
1. Go to your homepage.
2. Click the **"The Blue Cup"** logo in the navbar **5 times quickly**.
3. It will redirect you to the login screen.

### 🛡️ Security Note
Ensure your `JWT_SECRET` is never committed to GitHub. Always use the deployment platform's Environment Variable dashboard.
