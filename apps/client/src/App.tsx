import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Layout from "./components/layout/Layout";
import { lazy, Suspense, useEffect } from "react";
import Loader from "./components/Loader";

const HomePage = lazy(() => import("./pages/HomePage"));
const MenuPage = lazy(() => import("./pages/MenuPage"));
const CartPage = lazy(() => import("./pages/CartPage"));
const OrderTrackingPage = lazy(() => import("./pages/OrderTrackingPage"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminLoginPage = lazy(() => import("./pages/AdminLoginPage"));
const KitchenDisplay = lazy(() => import("./pages/KitchenDisplay"));
import { useCartStore } from "./stores/cartStore";
import { socket, connectSocket } from "./lib/socket";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, refetchOnWindowFocus: false },
  },
});

function App() {
  const tableNumber = useCartStore((s) => s.tableNumber);
  const deviceId = useCartStore((s) => s.deviceId);
  const setDeviceId = useCartStore((s) => s.setDeviceId);

  useEffect(() => {
    connectSocket();
    
    if (!deviceId) {
      const storedId = localStorage.getItem("bluecup_device_id");
      if (storedId) {
        setDeviceId(storedId);
      } else {
        const newId = `dev_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
        localStorage.setItem("bluecup_device_id", newId);
        setDeviceId(newId);
      }
    }

    const handleReconnect = () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    };

    socket.on("connect", handleReconnect);

    if (tableNumber !== null) {
      socket.emit("join-table", tableNumber);
    }

    return () => { socket.off("connect", handleReconnect); };
  }, [tableNumber, deviceId, setDeviceId]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<Loader />}>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/menu" element={<MenuPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/orders" element={<OrderTrackingPage />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/login" element={<AdminLoginPage />} />
            </Route>
            
            <Route path="/kitchen" element={<KitchenDisplay />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
