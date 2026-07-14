import { useEffect, useState, useMemo } from "react";
import dayjs from "dayjs";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useOrders, useUpdateOrderStatus, useMenuItems, useCreateMenuItem, useUpdateMenuItem, useDeleteMenuItem, useAnalytics, useCreateOrder } from "../hooks/useApi";
import { socket, connectSocket, joinAdminRoom } from "../lib/socket";
import { useQueryClient } from "@tanstack/react-query";
import type { OrderStatus, MenuItem, MenuCategory } from "@the-blue-cup/types";
import QRCodesPanel from "../components/admin/QRCodesPanel";
import WhatsAppLinkPanel from "../components/admin/WhatsAppLinkPanel";
import { menuApi } from "../lib/api";
import { generateWhatsAppBillLink } from "../utils/whatsapp";
import { getImageUrl } from "../utils/image";

type View = "dashboard" | "orders" | "menu" | "analytics" | "qr-codes" | "whatsapp" | "pos";

const statusColors: Record<OrderStatus, { dot: string; text: string; bg: string; border: string }> = {
  Pending: { dot: "bg-alert-red", text: "text-primary-navy", bg: "bg-[#F3F4F6]", border: "border-border" },
  Preparing: { dot: "bg-blue-500", text: "text-primary-navy", bg: "bg-[#F3F4F6]", border: "border-border" },
  Ready: { dot: "bg-leaf", text: "text-primary-navy", bg: "bg-[#F3F4F6]", border: "border-border" },
  Completed: { dot: "bg-muted", text: "text-primary-navy", bg: "bg-[#F3F4F6]", border: "border-border" },
  Cancelled: { dot: "bg-red-500", text: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
};

const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
  Pending: "Preparing", Preparing: "Ready", Ready: "Completed",
};

let audioCtx: AudioContext | null = null;

const playSound = (type: 'order' | 'waiter') => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === 'order') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.5, now + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.start();
      osc.stop(now + 0.4);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, now);
      // Beep 1
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      // Beep 2
      gainNode.gain.setValueAtTime(0, now + 0.2);
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.22);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc.start();
      osc.stop(now + 0.4);
    }
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};

export default function AdminDashboard() {
  const [view, setView] = useState<View>("orders");
  const [period, setPeriod] = useState("weekly");
  const [timeframe, setTimeframe] = useState("today"); // today, monthly, all
  const [notification, setNotification] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  const [waiterRequests, setWaiterRequests] = useState<{ id: string; table: number; time: Date }[]>([]);

  // POS State
  const [posCart, setPosCart] = useState<{ menuItem: MenuItem; quantity: number; customization: string }[]>([]);
  const [posCustomerName, setPosCustomerName] = useState("");
  const [posCustomerPhone, setPosCustomerPhone] = useState("");
  const [posSpecialInstructions, setPosSpecialInstructions] = useState("");
  const [posTableNumber, setPosTableNumber] = useState<number | null>(null);
  const [posCategory, setPosCategory] = useState("All");
  const [posSearch, setPosSearch] = useState("");
  const createOrder = useCreateOrder();

  const addToPosCart = (item: MenuItem) => {
    setPosCart(prev => {
      const existing = prev.find(i => i.menuItem._id === item._id);
      if (existing) {
        return prev.map(i => i.menuItem._id === item._id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { menuItem: item, quantity: 1, customization: "" }];
    });
  };

  const updatePosCartQuantity = (id: string, qty: number) => {
    if (qty <= 0) {
      setPosCart(prev => prev.filter(i => i.menuItem._id !== id));
    } else {
      setPosCart(prev => prev.map(i => i.menuItem._id === id ? { ...i, quantity: qty } : i));
    }
  };

  const updatePosCartCustomization = (id: string, custom: string) => {
    setPosCart(prev => prev.map(i => i.menuItem._id === id ? { ...i, customization: custom } : i));
  };

  const posSubtotal = useMemo(() => {
    return posCart.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
  }, [posCart]);
  
  const posTax = posSubtotal * 0.05;
  const posTotal = posSubtotal + posTax;

  const handlePlacePosOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (posCart.length === 0) {
      alert("Cart is empty. Please add items to place an order.");
      return;
    }
    if (posCustomerPhone && !/^\d{10}$/.test(posCustomerPhone)) {
      alert("Please enter a valid 10-digit phone number.");
      return;
    }

    createOrder.mutate({
      tableNumber: posTableNumber,
      items: posCart.map(i => ({
        menuItem: i.menuItem._id!,
        quantity: i.quantity,
        customization: i.customization || undefined
      })),
      customerName: posCustomerName || "Walk-in Guest",
      customerPhone: posCustomerPhone || undefined,
      specialInstructions: posSpecialInstructions || undefined
    }, {
      onSuccess: () => {
        setNotification("🛒 Walk-in order placed successfully!");
        playSound("order");
        setPosCart([]);
        setPosCustomerName("");
        setPosCustomerPhone("");
        setPosSpecialInstructions("");
        setPosTableNumber(null);
        setView("orders"); // Switch to Live Orders view
        setTimeout(() => setNotification(null), 5000);
      },
      onError: (err: any) => {
        alert("Failed to place order: " + (err.message || "Unknown error"));
      }
    });
  };
  // Menu Modal State
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<MenuItem> | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Menu Search/Filter State
  const [menuSearch, setMenuSearch] = useState("");
  const [menuFilter, setMenuFilter] = useState("All Categories");

  const { data: orders = [], isLoading, error: ordersError } = useOrders(undefined, undefined, timeframe);
  const { data: dailyReportOrders = [] } = useOrders(undefined, undefined, "today");
  const { data: menuItems = [] } = useMenuItems();
  const { data: analyticsData } = useAnalytics(period);

  // Filtered Menu Items
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(menuSearch.toLowerCase()) || 
                          (item.description?.toLowerCase() || "").includes(menuSearch.toLowerCase());
      const matchFilter = menuFilter === "All Categories" || item.category === menuFilter;
      return matchSearch && matchFilter;
    });
  }, [menuItems, menuSearch, menuFilter]);

  const posFilteredMenuItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(posSearch.toLowerCase()) || 
                          (item.description?.toLowerCase() || "").includes(posSearch.toLowerCase());
      const matchCategory = posCategory === "All" || item.category === posCategory;
      return matchSearch && matchCategory;
    });
  }, [menuItems, posSearch, posCategory]);

  const navigate = useNavigate();

  // Handle Authentication Errors & Initial Auth Check
  useEffect(() => {
    const token = localStorage.getItem("admin-token");
    if (!token) {
      navigate("/admin/login");
      return;
    }

    if (ordersError) {
      const msg = ordersError.message.toLowerCase();
      if (msg.includes("401") || msg.includes("expired") || msg.includes("authentication required")) {
        localStorage.removeItem("admin-token");
        navigate("/admin/login");
      }
    }
  }, [ordersError, navigate]);

  const updateStatus = useUpdateOrderStatus();
  const createMenu = useCreateMenuItem();
  const updateMenu = useUpdateMenuItem();
  const deleteMenu = useDeleteMenuItem();

  const qc = useQueryClient();

  // Wake up AudioContext on first interaction
  useEffect(() => {
    const handleGesture = () => {
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      setIsAudioEnabled(true);
      window.removeEventListener('click', handleGesture);
    };
    window.addEventListener('click', handleGesture);
    return () => window.removeEventListener('click', handleGesture);
  }, []);

  useEffect(() => {
    connectSocket();
    joinAdminRoom();
    const handleNew = (newOrder: any) => {
      // Direct cache injection for zero-latency updates
      qc.setQueryData(["orders", undefined, undefined, timeframe], (old: any) => {
        const ordersList = Array.isArray(old) ? old : [];
        if (ordersList.some((o: any) => o._id === newOrder._id)) return old;
        return [newOrder, ...ordersList];
      });

      setNotification("🔔 New order!");
      playSound("order");
      setTimeout(() => setNotification(null), 5000);
    };

    const handleUpdate = (data: { orderId: string; status?: OrderStatus; tableNumber?: number | null }) => {
      qc.setQueryData(["orders", undefined, undefined, timeframe], (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((o: any) => {
          if (o._id === data.orderId) {
            const updated = { ...o };
            if (data.status !== undefined) updated.status = data.status;
            if (data.tableNumber !== undefined) updated.tableNumber = data.tableNumber;
            return updated;
          }
          return o;
        });
      });
    };
    const handleWaiter = (table: number) => {
      setNotification(`🛎️ Waiter called to Table ${table}!`);
      playSound("waiter");
      setWaiterRequests(prev => [
        { id: Math.random().toString(36).substring(7), table, time: new Date() },
        ...prev
      ]);
      playSound("waiter");
      setTimeout(() => setNotification(null), 5000);
    };

    socket.on("newOrderAlert", handleNew);
    socket.on("orderStatusUpdate", handleUpdate);
    socket.on("waiterCalled", handleWaiter);

    return () => {
      socket.off("newOrderAlert", handleNew);
      socket.off("orderStatusUpdate", handleUpdate);
      socket.off("waiterCalled", handleWaiter);
    };
  }, [qc]);

  // Analytics Computations
  const stats = useMemo(() => {
    const completed = orders.filter((o) => o.status === "Completed");
    const totalSales = completed.reduce((s, o) => s + o.totalAmount, 0);
    return {
      pending: orders.filter((o) => o.status === "Pending").length,
      preparing: orders.filter((o) => o.status === "Preparing").length,
      ready: orders.filter((o) => o.status === "Ready").length,
      completed: completed.length,
      total: orders.length,
      totalSales,
      avgOrder: completed.length > 0 ? totalSales / completed.length : 0,
    };
  }, [orders]);

  const { chartData, topItems } = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return { date: d, label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), sales: 0 };
    });

    const itemsCount: Record<string, { name: string, count: number, revenue: number }> = {};

    orders.forEach(order => {
      if (order.status === "Completed" && order.createdAt) {
        // Daily Sales
        const orderDate = new Date(order.createdAt).toDateString();
        const day = last7Days.find(d => d.date.toDateString() === orderDate);
        if (day) day.sales += order.totalAmount;

        // Top Items
        order.items.forEach(item => {
          const menuItemObj = item.menuItem as unknown as Record<string, any>;
          const name = menuItemObj?.name || "Unknown";
          const id = menuItemObj?._id || name;
          if (!itemsCount[id]) itemsCount[id] = { name, count: 0, revenue: 0 };
          itemsCount[id].count += item.quantity;
          itemsCount[id].revenue += (menuItemObj?.price || 0) * item.quantity;
        });
      }
    });

    const maxSales = Math.max(...last7Days.map(d => d.sales), 1); // prevent division by zero
    const points = last7Days.map((d, i) => `${(i / 6) * 100},${100 - (d.sales / maxSales) * 100}`).join(" ");

    const sortedTop = Object.values(itemsCount).sort((a, b) => b.count - a.count).slice(0, 5);
    const totalItemsSold = Object.values(itemsCount).reduce((sum, i) => sum + i.count, 0);

    return {
      chartData: { last7Days, points, maxSales },
      topItems: sortedTop.map(i => ({ ...i, percentage: totalItemsSold ? (i.count / totalItemsSold) * 100 : 0 }))
    };
  }, [orders]);

  const dailyReport = useMemo(() => {
    const completed = dailyReportOrders.filter((o) => o.status === "Completed");
    const active = dailyReportOrders.filter((o) => ["Pending", "Preparing", "Ready"].includes(o.status));
    const revenue = completed.reduce((sum, order) => sum + order.totalAmount, 0);
    const itemMap = new Map<string, { name: string; quantity: number; revenue: number }>();

    completed.forEach((order) => {
      order.items.forEach((item) => {
        const menuItem = item.menuItem as unknown as Record<string, any>;
        const name = menuItem?.name || "Unknown";
        const unitPrice = item.priceAtOrder || menuItem?.price || 0;
        const current = itemMap.get(name) || { name, quantity: 0, revenue: 0 };
        itemMap.set(name, {
          name,
          quantity: current.quantity + item.quantity,
          revenue: current.revenue + unitPrice * item.quantity,
        });
      });
    });

    return {
      completed: completed.length,
      active: active.length,
      cancelled: dailyReportOrders.filter((o) => o.status === "Cancelled").length,
      total: dailyReportOrders.length,
      revenue,
      avgTicket: completed.length > 0 ? revenue / completed.length : 0,
      items: Array.from(itemMap.values()).sort((a, b) => b.quantity - a.quantity).slice(0, 8),
    };
  }, [dailyReportOrders]);

  const handleSaveMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem?.name || !editingItem?.price || !editingItem?.category) return;

    let imageUrl = editingItem.image || "";

    if (selectedFile) {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("image", selectedFile);
      try {
        const response = await menuApi.uploadImage(formData);
        imageUrl = response.imageUrl;
      } catch (err) {
        setNotification("❌ Image upload failed");
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    const payload = {
      ...editingItem,
      image: imageUrl,
      price: Number(editingItem.price)
    };

    if (editingItem._id) {
      updateMenu.mutate({ id: editingItem._id, payload });
    } else {
      createMenu.mutate(payload as any);
    }
    
    setIsMenuModalOpen(false);
    setEditingItem(null);
    setSelectedFile(null);
  };

  const handleDeleteMenu = (id: string) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      deleteMenu.mutate(id);
    }
  };

  const navItems = [
    { id: "dashboard" as View, icon: "📊", label: "Analytics & Trends" },
    { id: "orders" as View, icon: "🛒", label: "Live Orders" },
    { id: "pos" as View, icon: "🖥️", label: "Walk-in POS" },
    { id: "menu" as View, icon: "📋", label: "Menu Management" },
    { id: "qr-codes" as View, icon: "🔳", label: "Table QR Codes" },
    { id: "whatsapp" as View, icon: "📱", label: "WhatsApp" },
  ];

  const renderSidebar = () => (
    <>
      {/* Logo */}
      <div className="pt-10 pb-12 flex flex-col items-center border-b border-white/10 mx-6 relative">
        <button className="lg:hidden absolute top-0 right-[-10px] text-white/60 p-2" onClick={() => setIsMobileMenuOpen(false)}>✕</button>
        <Link to="/" className="flex flex-col items-center">
          <div className="w-12 h-12 flex items-center justify-center text-accent-gold mb-4 bg-white/5 rounded-2xl border border-white/10 shadow-premium">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 8H4M4 8c0 4.418 3.582 8 8 8s8-3.582 8-8M4 8l1.5-4h13L20 8" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v5M8 21h8M19 12h1a2 2 0 002-2v-1a2 2 0 00-2-2h-1" />
              <path d="M10.5 4.5c.5-1 1.5-1.5 2-1s.5 1 0 1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="font-heading text-xl text-antique-cream font-black tracking-tight leading-none">The Blue Cup</p>
          <p className="text-[10px] text-accent-gold uppercase tracking-[0.3em] mt-2 font-bold opacity-80">Admin Console</p>
        </Link>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 py-10 px-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => (
          <button key={item.id} onClick={() => { setView(item.id); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm transition-all duration-300 ${view === item.id
              ? "bg-white/10 text-antique-cream font-bold border border-white/10 shadow-premium"
              : "text-white/50 hover:text-white hover:bg-white/5"
              }`}>
            <span className={`text-xl w-6 text-center transition-all ${view === item.id ? 'scale-110 grayscale-0' : 'grayscale opacity-60'}`}>{item.icon}</span>
            {item.label}
          </button>
        ))}

        <div className="pt-8 pb-4 px-5">
          <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold">System Views</p>
        </div>

        <Link to="/kitchen" target="_blank" className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm text-white/50 hover:text-white hover:bg-white/5 transition-all group">
          <span className="text-xl w-6 text-center grayscale group-hover:grayscale-0 transition-all">👨‍🍳</span>
          Kitchen Display
          <svg className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
        </Link>
      </nav>

      {/* Admin User */}
      <div className="p-6 border-t border-white/10 mx-4 mt-auto">
        <div className="flex items-center gap-4 bg-white/5 p-3 rounded-2xl border border-white/5">
          <img src="https://i.pravatar.cc/150?u=admin" className="w-10 h-10 rounded-xl object-cover ring-2 ring-white/10" alt="Admin" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-antique-cream truncate">Admin User</p>
            <p className="text-[11px] text-white/40 uppercase tracking-wider font-bold">Master Control</p>
          </div>
        </div>
      </div>
    </>
  );

  if (isLoading && orders.length === 0) {
    return (
      <div className="min-h-screen bg-antique-cream flex flex-col items-center justify-center gap-6">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="text-6xl">☕</motion.div>
        <p className="text-primary-navy font-black text-[10px] uppercase tracking-[0.3em] animate-pulse">Syncing Artisan Command Center...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-antique-cream font-body w-full overflow-hidden">
      {/* ─── Sidebar (Desktop) ─── */}
      <aside className="hidden lg:flex flex-col w-[280px] bg-primary-navy shrink-0 text-white shadow-premium z-50">
        {renderSidebar()}
      </aside>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMobileMenuOpen(false)} className="absolute inset-0 bg-primary-navy/80 backdrop-blur-md" />
            <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "tween", duration: 0.3 }} className="absolute inset-y-0 left-0 w-[280px] bg-primary-navy text-white flex flex-col shadow-2xl">
              {renderSidebar()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Main Content ─── */}
      <main className="flex-1 overflow-auto flex flex-col min-w-0">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between px-6 h-20 bg-primary-navy text-white sticky top-0 z-40 shadow-premium">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center text-accent-gold bg-white/5 rounded-xl">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 8H4M4 8c0 4.418 3.582 8 8 8s8-3.582 8-8M4 8l1.5-4h13L20 8" />
              </svg>
            </div>
            <span className="font-heading font-black text-xl text-antique-cream tracking-tight">Admin</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-3 bg-white/5 rounded-xl border border-white/10">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        </div>

        {/* Notification */}
        <AnimatePresence>
          {notification && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-8 py-3 bg-primary-navy text-accent-gold text-sm font-bold rounded-2xl shadow-premium border border-accent-gold/30">
              {notification}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-6 md:p-10 lg:p-12 max-w-[1600px] mx-auto w-full">

          {/* ─── Dashboard (Analytics & Trends) ─── */}
          {view === "dashboard" && (
            <>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                  <h1 className="font-heading text-4xl md:text-5xl text-primary-navy font-black tracking-tight mb-2">Performance Hub</h1>
                  <p className="text-muted font-medium">Real-time business intelligence and revenue trends.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 bg-white p-1.5 rounded-2xl border border-border shadow-soft">
                  <button onClick={() => { setPeriod("daily"); setTimeframe("today"); }} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${period === "daily" ? "bg-primary-navy text-antique-cream shadow-premium" : "text-muted hover:bg-antique-cream"}`}>Daily Report</button>
                  <button onClick={() => { setPeriod("weekly"); setTimeframe("today"); }} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${period === "weekly" ? "bg-primary-navy text-antique-cream shadow-premium" : "text-muted hover:bg-antique-cream"}`}>Weekly Hub</button>
                  <button onClick={() => { setPeriod("monthly"); setTimeframe("monthly"); }} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${period === "monthly" ? "bg-primary-navy text-antique-cream shadow-premium" : "text-muted hover:bg-antique-cream"}`}>Monthly Hub</button>
                  <button onClick={() => { setPeriod("all"); setTimeframe("all"); }} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${period === "all" ? "bg-primary-navy text-antique-cream shadow-premium" : "text-muted hover:bg-antique-cream"}`}>Full History</button>
                </div>
              </div>

              {/* Stats Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {(period === "daily" ? [
                  { label: "Revenue Today", val: `₹${dailyReport.revenue.toFixed(0)}`, icon: "💰", color: "text-leaf" },
                  { label: "Completed", val: dailyReport.completed, icon: "📦", color: "text-primary-navy" },
                  { label: "Avg. Ticket", val: `₹${dailyReport.avgTicket.toFixed(0)}`, icon: "🎫", color: "text-accent-gold" },
                  { label: "Active Orders", val: dailyReport.active, icon: "🔥", color: "text-alert-red" },
                ] : [
                  { label: "Total Revenue", val: `₹${analyticsData?.summary?.totalRevenue?.toFixed(0) || 0}`, icon: "💰", color: "text-leaf" },
                  { label: "Total Orders", val: analyticsData?.summary?.totalOrders || 0, icon: "📦", color: "text-primary-navy" },
                  { label: "Avg. Ticket", val: `₹${analyticsData?.summary?.avgTicket?.toFixed(0) || 0}`, icon: "🎫", color: "text-accent-gold" },
                  { label: "Active Now", val: orders.filter(o => ["Pending", "Preparing", "Ready"].includes(o.status)).length, icon: "🔥", color: "text-alert-red" },
                ]).map((s, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                    className="card-premium p-8 flex items-center justify-between group hover:border-accent-gold/40 transition-all">
                    <div>
                      <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-2">{s.label}</p>
                      <p className={`numeric-text text-3xl ${s.color}`}>{s.val}</p>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-antique-cream flex items-center justify-center text-2xl shadow-soft group-hover:scale-110 transition-transform">
                      {s.icon}
                    </div>
                  </motion.div>
                ))}
              </div>

              {period === "daily" ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                  <div className="lg:col-span-2 card-premium overflow-hidden">
                    <div className="p-8 border-b border-border/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h3 className="font-heading text-2xl text-primary-navy font-black tracking-tight uppercase">Today&apos;s Transactions</h3>
                        <p className="text-[10px] font-black text-muted uppercase tracking-widest mt-1">
                          {dayjs().format("DD MMM YYYY")} • {dailyReport.total} total orders • {dailyReport.cancelled} cancelled
                        </p>
                      </div>
                      <button
                        onClick={() => import("../utils/pdf").then(({ generateDailyReport }) => generateDailyReport(dailyReportOrders as any))}
                        className="btn-primary py-3 px-6 shadow-premium text-[10px] uppercase tracking-widest"
                      >
                        Download PDF
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left min-w-[760px]">
                        <thead>
                          <tr className="bg-antique-cream border-b border-border">
                            <th className="px-8 py-5 text-[10px] font-black text-muted uppercase tracking-[0.2em]">Order ID</th>
                            <th className="px-8 py-5 text-[10px] font-black text-muted uppercase tracking-[0.2em]">Table / Guest</th>
                            <th className="px-8 py-5 text-[10px] font-black text-muted uppercase tracking-[0.2em]">Time</th>
                            <th className="px-8 py-5 text-[10px] font-black text-muted uppercase tracking-[0.2em]">Status</th>
                            <th className="px-8 py-5 text-[10px] font-black text-muted uppercase tracking-[0.2em] text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                          {dailyReportOrders.length > 0 ? (
                            dailyReportOrders.map((order) => (
                              <tr key={order._id} className="hover:bg-antique-cream/30 transition-colors">
                                <td className="px-8 py-5">
                                  <span className="text-[10px] font-black text-primary-navy uppercase tracking-widest">#ORD-{order._id?.slice(-6).toUpperCase()}</span>
                                </td>
                                <td className="px-8 py-5">
                                  <span className="font-bold text-primary-navy">{order.tableNumber ? `Table ${order.tableNumber}` : "Artisan Guest"}</span>
                                </td>
                                <td className="px-8 py-5">
                                  <span className="text-[11px] text-muted font-medium">{order.createdAt ? dayjs(order.createdAt).format("hh:mm A") : "—"}</span>
                                </td>
                                <td className="px-8 py-5">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${statusColors[order.status as OrderStatus]?.dot || "bg-gray-300"}`} />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary-navy">{order.status}</span>
                                  </div>
                                </td>
                                <td className="px-8 py-5 text-right">
                                  <span className="font-heading text-lg font-black text-primary-navy tracking-tight">₹{order.totalAmount.toFixed(0)}</span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="px-8 py-20 text-center">
                                <p className="text-[10px] font-black text-muted uppercase tracking-widest opacity-40">No orders recorded today</p>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="card-premium p-8">
                    <h3 className="font-heading text-2xl text-primary-navy font-black tracking-tight uppercase mb-8">Items Sold</h3>
                    <div className="space-y-5">
                      {dailyReport.items.length > 0 ? (
                        dailyReport.items.map((item) => (
                          <div key={item.name} className="border-b border-border/40 pb-5 last:border-0 last:pb-0">
                            <div className="flex justify-between gap-4 mb-2">
                              <p className="text-xs font-black text-primary-navy uppercase tracking-wide truncate">{item.name}</p>
                              <p className="text-[10px] font-black text-accent-gold whitespace-nowrap">{item.quantity} sold</p>
                            </div>
                            <p className="text-[11px] font-bold text-muted">₹{item.revenue.toFixed(0)} revenue</p>
                          </div>
                        ))
                      ) : (
                        <div className="py-12 text-center text-muted font-black text-[10px] uppercase tracking-widest">No completed item sales today</div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
                  {/* Revenue Trend Chart */}
                  <div className="lg:col-span-8 card-premium p-8">
                    <div className="flex items-center justify-between mb-10">
                      <h3 className="font-heading text-2xl text-primary-navy font-black tracking-tight uppercase">Revenue Trend</h3>
                      <div className="flex items-center gap-4 text-[10px] font-black text-muted uppercase tracking-widest">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full bg-accent-gold" /> Sales Growth
                        </div>
                      </div>
                    </div>

                    <div className="h-64 w-full relative group">
                      {/* SVG Chart */}
                      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                        <defs>
                          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                          </linearGradient>
                        </defs>

                        {/* Grid Lines */}
                        {[0, 25, 50, 75, 100].map(v => (
                          <line key={v} x1="0" y1={v} x2="100" y2={v} stroke="#000" strokeWidth="0.1" strokeOpacity="0.1" />
                        ))}

                        {/* Line Path */}
                        {analyticsData?.trend && analyticsData.trend.length > 1 ? (
                          <>
                            <motion.path
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              transition={{ duration: 1.5, ease: "easeInOut" }}
                              d={`M ${analyticsData.trend.map((d: any, i: number) => {
                                const x = (i / (analyticsData.trend.length - 1)) * 100;
                                const maxRev = Math.max(...analyticsData.trend.map((t: any) => t.revenue), 1);
                                const y = 100 - (d.revenue / maxRev) * 100;
                                return `${x},${y}`;
                              }).join(" L ")}`}
                              fill="none"
                              stroke="#D4AF37"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d={`M 0,100 L ${analyticsData.trend.map((d: any, i: number) => {
                                const x = (i / (analyticsData.trend.length - 1)) * 100;
                                const maxRev = Math.max(...analyticsData.trend.map((t: any) => t.revenue), 1);
                                const y = 100 - (d.revenue / maxRev) * 100;
                                return `${x},${y}`;
                              }).join(" L ")} L 100,100 Z`}
                              fill="url(#chartGradient)"
                            />
                            {analyticsData.trend.map((d: any, i: number) => {
                              const x = (i / (analyticsData.trend.length - 1)) * 100;
                              const maxRev = Math.max(...analyticsData.trend.map((t: any) => t.revenue), 1);
                              const y = 100 - (d.revenue / maxRev) * 100;
                              return (
                                <g key={i} className="group/point">
                                  <circle cx={x} cy={y} r="1.5" fill="#1A2B48" className="cursor-pointer" />
                                  <circle cx={x} cy={y} r="4" fill="#D4AF37" className="opacity-0 group-hover/point:opacity-20 transition-opacity" />
                                </g>
                              );
                            })}
                          </>
                        ) : (
                          <line x1="0" y1="100" x2="100" y2="100" stroke="#D4AF37" strokeWidth="1" strokeDasharray="4" opacity="0.2" />
                        )}
                      </svg>

                      {/* Labels */}
                      <div className="absolute bottom-[-30px] left-0 right-0 flex justify-between px-2">
                        {analyticsData?.trend?.map((d: any, i: number) => (
                          i % (period === 'monthly' ? 5 : 1) === 0 && (
                            <span key={i} className="text-[8px] font-black text-muted uppercase tracking-tighter">
                              {dayjs(d._id).format(period === 'monthly' ? 'D MMM' : 'ddd')}
                            </span>
                          )
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Top Sellers */}
                  <div className="lg:col-span-4 card-premium p-8">
                    <h3 className="font-heading text-2xl text-primary-navy font-black tracking-tight uppercase mb-8">Top Creations</h3>
                    <div className="space-y-6">
                      {analyticsData?.topItems?.map((item: any, i: number) => (
                        <div key={i} className="group">
                          <div className="flex justify-between items-center mb-2">
                            <p className="text-xs font-black text-primary-navy uppercase tracking-wide truncate pr-4">{item.name}</p>
                            <p className="text-[10px] font-black text-accent-gold">{item.count} Sold</p>
                          </div>
                          <div className="h-1.5 bg-antique-cream rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(item.count / analyticsData.topItems[0].count) * 100}%` }}
                              className="h-full bg-primary-navy group-hover:bg-accent-gold transition-colors"
                            />
                          </div>
                        </div>
                      ))}
                      {!analyticsData?.topItems?.length && (
                        <div className="py-12 text-center text-muted font-black text-[10px] uppercase tracking-widest">No sales data yet</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Transaction Repository (Detailed List) */}
              {period !== "daily" && (
                <div className="mt-12">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="font-heading text-3xl text-primary-navy font-black tracking-tight uppercase">Transaction Repository</h3>
                      <p className="text-[10px] font-black text-muted uppercase tracking-widest mt-1">Full detailed audit of recent activity</p>
                    </div>
                    <div className="flex items-center gap-2 bg-antique-cream p-1 rounded-xl border border-border">
                      {["today", "monthly", "all"].map((t) => (
                        <button
                          key={t}
                          onClick={() => setTimeframe(t)}
                          className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${timeframe === t ? "bg-primary-navy text-white shadow-soft" : "text-muted hover:bg-white"}`}
                        >
                          {t === "today" ? "Daily Artisan" : t === "monthly" ? "Monthly Ledger" : "Full Repository"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="card-premium overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-antique-cream border-b border-border">
                            <th className="px-8 py-5 text-[10px] font-black text-muted uppercase tracking-[0.2em]">Order ID</th>
                            <th className="px-8 py-5 text-[10px] font-black text-muted uppercase tracking-[0.2em]">Table / Guest</th>
                            <th className="px-8 py-5 text-[10px] font-black text-muted uppercase tracking-[0.2em]">Creation Time</th>
                            <th className="px-8 py-5 text-[10px] font-black text-muted uppercase tracking-[0.2em]">Status</th>
                            <th className="px-8 py-5 text-[10px] font-black text-muted uppercase tracking-[0.2em] text-right">Revenue</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                          {orders.length > 0 ? (
                            orders.map((order) => (
                              <tr key={order._id} className="hover:bg-antique-cream/30 transition-colors group">
                                <td className="px-8 py-6">
                                  <span className="text-[10px] font-black text-primary-navy uppercase tracking-widest">#ORD-{order._id?.slice(-6).toUpperCase()}</span>
                                </td>
                                <td className="px-8 py-6">
                                  <span className="font-bold text-primary-navy">{order.tableNumber ? `Table ${order.tableNumber}` : "Artisan Guest"}</span>
                                </td>
                                <td className="px-8 py-6">
                                  <span className="text-[11px] text-muted font-medium">{order.createdAt ? dayjs(order.createdAt).format("MMM DD, hh:mm A") : "—"}</span>
                                </td>
                                <td className="px-8 py-6">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${statusColors[order.status as OrderStatus]?.dot || "bg-gray-300"}`} />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary-navy">{order.status}</span>
                                  </div>
                                </td>
                                <td className="px-8 py-6 text-right">
                                  <span className="font-heading text-lg font-black text-primary-navy tracking-tight">₹{order.totalAmount.toFixed(0)}</span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="px-8 py-20 text-center">
                                <p className="text-[10px] font-black text-muted uppercase tracking-widest opacity-40">No transactions recorded in this cycle</p>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ─── Orders View (Live Management) ─── */}
          {view === "orders" && (
            <>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                  <h1 className="font-heading text-4xl md:text-5xl text-primary-navy font-black tracking-tight mb-2">Live Orders</h1>
                  <p className="text-muted font-medium">Monitoring real-time activity across all tables.</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
                      setIsAudioEnabled(true);
                      playSound('order');
                    }}
                    className={`px-5 py-3 rounded-2xl border flex items-center gap-3 shadow-soft transition-all active:scale-95 ${isAudioEnabled
                      ? 'bg-leaf/10 border-leaf/20 text-leaf'
                      : 'bg-alert-red/10 border-alert-red/20 text-alert-red animate-pulse'
                      }`}
                  >
                    <span className="text-sm">{isAudioEnabled ? '🔊' : '🔇'}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      {isAudioEnabled ? 'Audio Live' : 'Enable Audio'}
                    </span>
                  </button>

                  <div className="px-5 py-3 glass-morphism border border-border rounded-2xl flex items-center gap-3 shadow-soft">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-leaf opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-leaf"></span>
                    </span>
                    <span className="text-[10px] font-black text-primary-navy uppercase tracking-widest">System Live</span>
                  </div>
                </div>
              </div>

              {/* Waiter Requests Section */}
              {waiterRequests.length > 0 && (
                <div className="mb-12 bg-accent-gold/5 border border-accent-gold/20 rounded-[2rem] p-8 shadow-soft">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🛎️</span>
                      <h3 className="font-heading text-2xl text-primary-navy font-black tracking-tight">Waiter Requests</h3>
                    </div>
                    <button onClick={() => setWaiterRequests([])} className="btn-secondary py-2 text-[10px] uppercase tracking-widest font-black">Dismiss All</button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <AnimatePresence>
                      {waiterRequests.map((req) => (
                        <motion.div
                          key={req.id}
                          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                          className="bg-white rounded-2xl border border-accent-gold/20 p-5 shadow-soft flex items-center justify-between group hover:border-accent-gold/50 transition-all"
                        >
                          <div>
                            <p className="font-heading text-lg text-primary-navy font-black leading-none mb-1">Table {req.table}</p>
                            <p className="text-[11px] text-muted font-bold uppercase tracking-wider">{req.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                          <button
                            onClick={() => setWaiterRequests(prev => prev.filter(r => r.id !== req.id))}
                            className="w-10 h-10 rounded-xl bg-accent-gold/10 flex items-center justify-center text-accent-gold hover:bg-accent-gold hover:text-white transition-all shadow-soft"
                          >
                            ✓
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-32 gap-6">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="text-6xl">☕</motion.div>
                  <p className="text-muted font-bold uppercase tracking-[0.2em] animate-pulse">Syncing orders...</p>
                </div>
              ) : (
                <div className="flex overflow-x-auto lg:grid lg:grid-cols-4 gap-6 items-start snap-x snap-mandatory pb-8 -mx-6 px-6 lg:mx-0 lg:px-0 lg:pb-0 scrollbar-hide">
                  {(["Pending", "Preparing", "Ready", "Completed"] as OrderStatus[]).map((status) => {
                    const colOrders = orders.filter((o) => o.status === status);

                    return (
                      <div key={status} className="flex flex-col gap-5 min-w-[85vw] sm:min-w-[340px] lg:min-w-0 snap-center">
                        {/* Column Header */}
                        <div className="bg-white border border-border rounded-2xl p-4 flex items-center justify-between shadow-soft relative overflow-hidden group">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${statusColors[status].dot} shadow-[0_0_10px_rgba(0,0,0,0.1)]`} />
                            <h3 className="text-xs font-black text-primary-navy uppercase tracking-widest">{status}</h3>
                          </div>
                          <span className="px-3 py-1 bg-cream-dark rounded-lg text-[10px] font-black text-primary-navy">
                            {colOrders.length}
                          </span>
                          <div className={`absolute bottom-0 left-0 right-0 h-1 ${statusColors[status].dot} opacity-20`} />
                        </div>

                        {/* Order Cards */}
                        <div className="space-y-4 lg:min-h-[500px]">
                          <AnimatePresence mode="popLayout">
                            {colOrders.map((order) => {
                              const next = nextStatus[order.status as OrderStatus];
                              return (
                                <motion.div key={order._id} layout initial={{ opacity: 0, y: 30, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                                  className="group bg-white border border-border/60 rounded-[2rem] p-6 shadow-soft hover:shadow-premium transition-all duration-500 relative overflow-hidden"
                                >
                                  {/* Status Indicator Bar */}
                                  <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${statusColors[status].dot} opacity-40 group-hover:opacity-100 transition-opacity`} />

                                  <div className="flex justify-between items-start mb-5 pl-2">
                                    <div>
                                      <p className="text-[9px] font-black text-muted uppercase tracking-[0.2em] mb-1">Order Identifier</p>
                                      <p className="text-xs font-black text-primary-navy">#ORD-{order._id?.slice(-6).toUpperCase()}</p>
                                    </div>
                                    <div className="flex flex-col items-end">
                                      <p className="text-[9px] font-black text-muted uppercase tracking-[0.2em] mb-1 text-right">Elapsed</p>
                                      <span className="px-2 py-1 bg-antique-cream rounded-lg text-[10px] font-black text-primary-navy border border-border/50">
                                        {order.createdAt ? (() => {
                                          const mins = Math.round((Date.now() - new Date(order.createdAt).getTime()) / 60000);
                                          return mins < 1 ? "New" : `${mins}m ago`;
                                        })() : "—"}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="pl-2 mb-6">
                                    <div className="flex items-center gap-2 mb-1">
                                      <div className="relative flex items-center bg-transparent group/table">
                                        <select
                                          value={order.tableNumber === null || order.tableNumber === undefined ? "" : order.tableNumber}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            const newTable = val === "" ? null : Number(val);
                                            updateStatus.mutate({ id: order._id!, tableNumber: newTable });
                                          }}
                                          className="font-heading text-2xl text-primary-navy font-black leading-none tracking-tight bg-transparent border-b border-dashed border-primary-navy/30 focus:outline-none focus:border-accent-gold cursor-pointer pr-4 appearance-none"
                                        >
                                          <option value="">Counter / Takeaway</option>
                                          {Array.from({ length: 50 }, (_, i) => i + 1).map(num => (
                                            <option key={num} value={num}>Table {num}</option>
                                          ))}
                                        </select>
                                        <span className="text-[10px] text-muted ml-0.5 group-hover/table:text-accent-gold transition-colors pointer-events-none">▼</span>
                                      </div>
                                      {order.customerName && order.customerName !== "Guest" && (
                                        <span className="text-[10px] font-black text-accent-gold uppercase tracking-widest bg-accent-gold/5 px-2 py-0.5 rounded-md border border-accent-gold/10">
                                          {order.customerName}
                                        </span>
                                      )}
                                    </div>
                                    {order.specialInstructions && (
                                      <p className="text-[10px] text-alert-red font-black uppercase tracking-widest mt-2 flex items-center gap-1.5">
                                        <span className="text-xs">⚠️</span> {order.specialInstructions}
                                      </p>
                                    )}
                                  </div>

                                  <div className="pl-2 space-y-3 mb-8 bg-antique-cream/40 rounded-2xl p-4 border border-border/40">
                                    {order.items.map((item, i) => (
                                      <div key={i} className="flex justify-between items-center text-[12px]">
                                        <div className="flex flex-col max-w-[160px]">
                                          <div className="flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-accent-gold/40" />
                                            <span className="font-bold text-primary-navy truncate">
                                              {typeof item.menuItem === "object" && item.menuItem !== null ? (item.menuItem as Record<string, string>).name : "Unknown Creation"}
                                            </span>
                                          </div>
                                          <span className="text-[9px] font-black text-muted ml-3.5 uppercase tracking-tighter">
                                            ₹{item.priceAtOrder || (typeof item.menuItem === "object" ? (item.menuItem as any).price : 0)} per unit
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-[10px] font-black text-muted">×</span>
                                          <span className="text-sm font-black text-primary-navy">{item.quantity}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>

                                  <div className="pl-2 flex items-center justify-between pt-4 border-t border-border/40">
                                    <div className="flex flex-col">
                                      <span className="text-[9px] font-black text-muted uppercase tracking-widest mb-1">Total Valuation</span>
                                      <p className="font-heading text-xl text-primary-navy font-black leading-none tracking-tighter">₹{order.totalAmount.toFixed(0)}</p>
                                    </div>

                                    <div className="flex gap-2">
                                      {next ? (
                                        <button
                                          onClick={() => updateStatus.mutate({ id: order._id!, status: next })}
                                          className="btn-gold !py-3 !px-5 text-[9px] shadow-gold group/btn overflow-hidden relative"
                                        >
                                          <span className="relative z-10">MOVE TO {next.toUpperCase()}</span>
                                          <div className="absolute inset-0 bg-white/30 translate-y-full group-hover/btn:translate-y-0 transition-transform" />
                                        </button>
                                      ) : order.status === "Completed" ? (
                                        <div className="flex gap-2">
                                          <button
                                            onClick={() => import("../utils/pdf").then(({ generateInvoice }) => generateInvoice(order as any))}
                                            className="btn-secondary !py-3 !px-5 text-[9px]"
                                          >
                                            RECEIPT
                                          </button>
                                          {order.customerPhone && (
                                            <button
                                              onClick={() => {
                                                const waLink = generateWhatsAppBillLink(order as any);
                                                window.open(waLink, "_blank");
                                              }}
                                              className="bg-leaf/10 text-leaf border border-leaf/20 hover:bg-leaf hover:text-white transition-all rounded-xl px-4 py-2 text-[9px] font-black uppercase tracking-widest flex items-center gap-2"
                                            >
                                              <span>📱</span> WA Bill
                                            </button>
                                          )}
                                        </div>
                                      ) : null}
                                    </div>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </AnimatePresence>

                          {colOrders.length === 0 && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 flex flex-col items-center justify-center border-4 border-dashed border-border/40 rounded-[3rem] bg-antique-cream/20">
                              <span className="text-5xl mb-4 grayscale opacity-20 filter invert-[0.2]">🍽️</span>
                              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-muted">Awaiting Artisan Orders</p>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ─── Walk-in POS View ─── */}
          {view === "pos" && (
            <div className="flex flex-col xl:flex-row gap-8 items-start w-full">
              {/* Left Column: Menu Selector */}
              <div className="flex-1 w-full xl:max-w-[65%] flex flex-col gap-6">
                <div>
                  <h1 className="font-heading text-4xl md:text-5xl text-primary-navy font-black tracking-tight mb-2">Walk-in POS</h1>
                  <p className="text-muted font-medium">Create direct orders and checkout for walk-in counter guests.</p>
                </div>

                {/* Search & Category Filter */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <input 
                      type="text" 
                      placeholder="Search menu items..." 
                      className="input-premium pl-12 w-full bg-white shadow-soft"
                      style={{ paddingLeft: '3rem' }}
                      value={posSearch}
                      onChange={(e) => setPosSearch(e.target.value)}
                    />
                    <svg className="w-5 h-5 text-muted absolute left-4 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  
                  <div className="relative shrink-0 sm:w-64">
                    <select 
                      className="input-premium bg-white appearance-none cursor-pointer w-full pr-10 shadow-soft"
                      value={posCategory}
                      onChange={(e) => setPosCategory(e.target.value)}
                    >
                      <option value="All">All Categories</option>
                      {Array.from(new Set(menuItems.map((i) => i.category))).map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted">▼</div>
                  </div>
                </div>

                {/* Menu items grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 overflow-y-auto max-h-[650px] pr-2 scrollbar-hide">
                  {posFilteredMenuItems.map((item) => {
                    const isSelected = posCart.some(i => i.menuItem._id === item._id);
                    return (
                      <motion.div 
                        key={item._id}
                        whileHover={{ y: -4, scale: 1.02 }}
                        className={`card-premium p-5 flex flex-col justify-between relative group overflow-hidden border cursor-pointer select-none transition-all duration-300 ${
                          isSelected ? 'border-accent-gold bg-accent-gold/[0.02]' : 'border-border/60 hover:border-accent-gold/40'
                        }`}
                        onClick={() => item.isAvailable && addToPosCart(item)}
                      >
                        {!item.isAvailable && (
                          <div className="absolute inset-0 bg-white/85 backdrop-blur-[1px] z-10 flex items-center justify-center">
                            <span className="bg-alert-red/10 border border-alert-red/20 text-alert-red text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl shadow-soft">
                              Sold Out
                            </span>
                          </div>
                        )}

                        <div className="flex gap-4 items-start mb-4">
                          <img 
                            src={getImageUrl(item.image) || `https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=80&h=80&fit=crop`} 
                            alt={item.name} 
                            className="w-16 h-16 rounded-2xl object-cover ring-2 ring-cream-dark shadow-soft group-hover:scale-105 transition-transform shrink-0" 
                          />
                          <div className="min-w-0">
                            <span className="text-[9px] font-black text-accent-gold uppercase tracking-widest">{item.category}</span>
                            <h4 className="text-sm font-black text-primary-navy truncate mt-0.5 leading-tight mb-1">{item.name}</h4>
                            <p className="text-[10px] text-muted line-clamp-2 leading-tight font-medium">{item.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-border/40">
                          <span className="font-heading text-lg text-primary-navy font-black">₹{item.price.toFixed(0)}</span>
                          <button 
                            disabled={!item.isAvailable}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (item.isAvailable) addToPosCart(item);
                            }}
                            className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shadow-soft transition-all duration-300 ${
                              isSelected 
                                ? 'bg-accent-gold text-white hover:bg-accent-gold/90' 
                                : 'bg-primary-navy text-white hover:bg-primary-navy/90 hover:scale-105 active:scale-95'
                            }`}
                          >
                            +
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                  {posFilteredMenuItems.length === 0 && (
                    <div className="col-span-full py-20 text-center border-4 border-dashed border-border/40 rounded-[3rem] bg-antique-cream/20">
                      <span className="text-4xl block mb-4">🔍</span>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted">No items matched your search</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Order Summary */}
              <div className="w-full xl:max-w-[35%] xl:sticky xl:top-[88px] flex flex-col gap-6">
                <form onSubmit={handlePlacePosOrder} className="card-premium p-6 sm:p-8 flex flex-col gap-6 border-2 border-primary-navy/10 shadow-premium">
                  <div>
                    <h3 className="font-heading text-2xl text-primary-navy font-black tracking-tight uppercase">Current Order</h3>
                    <p className="text-[10px] font-black text-muted uppercase tracking-widest mt-1">Direct billing detail</p>
                  </div>

                  {/* Cart Items List */}
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 scrollbar-hide border-b border-border/40 pb-5">
                    <AnimatePresence mode="popLayout">
                      {posCart.map((item) => (
                        <motion.div 
                          key={item.menuItem._id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="flex flex-col gap-2 p-3 bg-cream-dark/25 rounded-2xl border border-border/40 hover:border-accent-gold/30 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <h5 className="text-xs font-black text-primary-navy truncate leading-tight">{item.menuItem.name}</h5>
                              <span className="text-[10px] font-black text-accent-gold">₹{item.menuItem.price.toFixed(0)} each</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 bg-white border border-border/60 rounded-xl p-1 shadow-inner">
                              <button 
                                type="button"
                                onClick={() => updatePosCartQuantity(item.menuItem._id!, item.quantity - 1)}
                                className="w-6 h-6 flex items-center justify-center text-primary-navy hover:bg-cream-dark rounded-md text-xs font-bold"
                              >
                                −
                              </button>
                              <span className="w-5 text-center text-xs font-black text-primary-navy">{item.quantity}</span>
                              <button 
                                type="button"
                                onClick={() => updatePosCartQuantity(item.menuItem._id!, item.quantity + 1)}
                                className="w-6 h-6 flex items-center justify-center text-primary-navy hover:bg-cream-dark rounded-md text-xs font-bold"
                              >
                                +
                              </button>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 items-center">
                            <input 
                              type="text" 
                              placeholder="Notes: sugar free, extra ice..." 
                              value={item.customization}
                              onChange={(e) => updatePosCartCustomization(item.menuItem._id!, e.target.value)}
                              className="w-full bg-white/70 border border-border/40 rounded-lg px-2.5 py-1 text-[10px] focus:outline-none focus:border-accent-gold"
                            />
                            <button 
                              type="button" 
                              onClick={() => updatePosCartQuantity(item.menuItem._id!, 0)}
                              className="text-alert-red hover:text-alert-red/80 text-[10px] font-black uppercase tracking-widest px-1 shrink-0"
                            >
                              Remove
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {posCart.length === 0 && (
                      <div className="py-12 text-center text-muted">
                        <span className="text-3xl block mb-2 opacity-30">🛒</span>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Cart is empty</p>
                      </div>
                    )}
                  </div>

                  {/* Customer Details Form */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[9px] font-black text-muted uppercase tracking-[0.2em] mb-1.5 px-1">Customer Profile (Optional)</label>
                      <input 
                        type="text" 
                        placeholder="Guest Name (e.g. John Doe)" 
                        value={posCustomerName}
                        onChange={(e) => setPosCustomerName(e.target.value)}
                        className="input-premium text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-muted uppercase tracking-[0.2em] mb-1.5 px-1">WhatsApp Mobile (Optional)</label>
                      <div className="relative">
                        <input 
                          type="tel" 
                          placeholder="10-digit mobile" 
                          value={posCustomerPhone}
                          onChange={(e) => setPosCustomerPhone(e.target.value)}
                          className="input-premium text-xs pl-14 bg-white"
                          style={{ paddingLeft: '4.5rem' }}
                        />
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 border-r border-border pr-3">
                          <span className="text-[10px] font-black text-muted">🇮🇳</span>
                          <span className="text-xs font-bold text-primary-navy">+91</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[9px] font-black text-muted uppercase tracking-[0.2em] mb-1.5 px-1">Service Target</label>
                        <select 
                          value={posTableNumber === null ? "" : posTableNumber}
                          onChange={(e) => {
                            const val = e.target.value;
                            setPosTableNumber(val === "" ? null : Number(val));
                          }}
                          className="input-premium text-xs bg-white"
                        >
                          <option value="">Takeaway / Counter</option>
                          {Array.from({ length: 50 }, (_, i) => i + 1).map(num => (
                            <option key={num} value={num}>Table {num}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-muted uppercase tracking-[0.2em] mb-1.5 px-1">Instructions</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Extra hot" 
                          value={posSpecialInstructions}
                          onChange={(e) => setPosSpecialInstructions(e.target.value)}
                          className="input-premium text-xs bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Calculations & Submit */}
                  <div className="bg-antique-cream/40 border border-border/50 rounded-2xl p-5 flex flex-col gap-3 shadow-inner">
                    <div className="flex justify-between text-[11px] font-black text-muted uppercase tracking-wider">
                      <span>Subtotal</span>
                      <span className="text-primary-navy">₹{posSubtotal.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-black text-muted uppercase tracking-wider border-b border-border/30 pb-3">
                      <span>Service & Tax (5%)</span>
                      <span className="text-primary-navy">₹{posTax.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between items-end pt-1">
                      <div>
                        <span className="text-[9px] font-black text-muted uppercase tracking-widest block mb-0.5">Total Valuation</span>
                        <span className="font-heading text-3xl text-primary-navy font-black tracking-tighter leading-none">
                          ₹{posTotal.toFixed(0)}
                        </span>
                      </div>
                      {posTableNumber ? (
                        <div className="text-right">
                          <span className="text-[9px] font-black text-muted uppercase tracking-widest block mb-0.5">Serving Room</span>
                          <span className="font-heading text-xl text-accent-gold font-black leading-none">
                            Table {posTableNumber}
                          </span>
                        </div>
                      ) : (
                        <div className="text-right">
                          <span className="text-[9px] font-black text-muted uppercase tracking-widest block mb-0.5">Serving Room</span>
                          <span className="font-heading text-xl text-accent-gold font-black leading-none">
                            Counter
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={posCart.length === 0 || createOrder.isPending}
                    className="btn-primary w-full py-4 text-xs uppercase tracking-widest font-black shadow-premium flex items-center justify-center gap-2"
                  >
                    {createOrder.isPending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Place Order & Generate Bill"
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ─── Menu Management View ─── */}
          {view === "menu" && (
            <>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12">
                <div>
                  <h1 className="font-heading text-4xl md:text-5xl text-primary-navy font-black tracking-tight mb-2">Menu Repository</h1>
                  <p className="text-muted font-medium">Add, update, or curate the cafe offerings.</p>
                </div>
                <button onClick={() => { setEditingItem({}); setIsMenuModalOpen(true); }}
                  className="btn-primary py-4 px-8 shadow-premium">
                  <span className="text-xl leading-none font-light">+</span> Add New Master Item
                </button>
              </div>

              {/* Search + Filter */}
              <div className="flex flex-col md:flex-row gap-4 mb-10">
                <div className="relative flex-1">
                  <input 
                    type="text" 
                    placeholder="Search menu items..." 
                    className="input-premium pl-12 w-full"
                    style={{ paddingLeft: '3rem' }}
                    value={menuSearch}
                    onChange={(e) => setMenuSearch(e.target.value)}
                  />
                  <svg className="w-5 h-5 text-muted absolute left-4 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div className="relative shrink-0 md:w-64 w-full">
                  <select 
                    className="input-premium appearance-none cursor-pointer w-full pr-10"
                    value={menuFilter}
                    onChange={(e) => setMenuFilter(e.target.value)}
                  >
                    <option>All Categories</option>
                    {Array.from(new Set(menuItems.map((i) => i.category))).map((c) => <option key={c}>{c}</option>)}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted">▼</div>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="grid grid-cols-1 gap-6 md:hidden">
                {filteredMenuItems.map((item) => (
                  <div key={item._id} className="card-premium p-6 flex flex-col gap-6 relative group">
                    <div className="flex items-center gap-4">
                      <img src={getImageUrl(item.image) || `https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=80&h=80&fit=crop`} alt={item.name} className="w-16 h-16 rounded-2xl object-cover ring-4 ring-white shadow-soft" />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h3 className="text-lg text-primary-navy font-black leading-tight mb-1">{item.name}</h3>
                          <span className="font-heading text-xl text-primary-navy font-black">₹{item.price.toFixed(0)}</span>
                        </div>
                        <span className="inline-block px-3 py-1 bg-primary-navy/5 text-primary-navy text-[9px] font-black uppercase tracking-wider rounded-lg mb-2">
                          {item.category}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-muted font-medium line-clamp-2">{item.description}</p>

                    <div className="flex items-center justify-between pt-6 border-t border-border/30">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-muted uppercase tracking-widest">Available</span>
                        <button onClick={() => updateMenu.mutate({ id: item._id!, payload: { isAvailable: !item.isAvailable } })}
                          className={`w-12 h-7 rounded-2xl relative transition-all duration-300 ${item.isAvailable ? 'bg-leaf shadow-[inset_0_2px_10px_rgba(0,0,0,0.1)]' : 'bg-muted/30'}`}>
                          <div className={`absolute top-1 w-5 h-5 rounded-xl bg-white shadow-premium transition-all duration-300 ${item.isAvailable ? 'left-6' : 'left-1'}`} />
                        </button>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingItem(item); setIsMenuModalOpen(true); }} className="w-10 h-10 rounded-xl bg-white border border-border flex items-center justify-center text-primary-navy shadow-soft">✏️</button>
                        <button onClick={() => handleDeleteMenu(item._id!)} className="w-10 h-10 rounded-xl bg-white border border-border flex items-center justify-center text-alert-red shadow-soft">🗑</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="card-premium hidden md:block overflow-hidden shadow-premium">
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[900px]">
                    <thead>
                      <tr className="bg-warm-white border-b border-border">
                        <th className="px-8 py-5 text-[10px] text-muted uppercase tracking-widest font-black">Item Profile</th>
                        <th className="px-8 py-5 text-[10px] text-muted uppercase tracking-widest font-black">Classification</th>
                        <th className="px-8 py-5 text-[10px] text-muted uppercase tracking-widest font-black">Pricing</th>
                        <th className="px-8 py-5 text-[10px] text-muted uppercase tracking-widest font-black">Availability</th>
                        <th className="px-8 py-5 text-[10px] text-muted uppercase tracking-widest font-black">Operations</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {filteredMenuItems.map((item) => (
                        <tr key={item._id} className="hover:bg-cream-dark/20 transition-all group">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <img src={getImageUrl(item.image) || `https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=80&h=80&fit=crop`} alt={item.name} className="w-12 h-12 rounded-2xl object-cover ring-4 ring-white shadow-soft" />
                              <div>
                                <span className="block text-sm text-primary-navy font-black leading-none mb-1">{item.name}</span>
                                <span className="text-[11px] text-muted font-medium line-clamp-1 max-w-[200px]">{item.description}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <span className="px-3 py-1.5 bg-primary-navy/5 text-primary-navy text-[10px] font-black uppercase tracking-wider rounded-xl">
                              {item.category}
                            </span>
                          </td>
                          <td className="px-8 py-6">
                            <span className="font-heading text-lg text-primary-navy font-black tracking-tight">₹{item.price.toFixed(0)}</span>
                          </td>
                          <td className="px-8 py-6">
                            <button onClick={() => updateMenu.mutate({ id: item._id!, payload: { isAvailable: !item.isAvailable } })}
                              className={`w-12 h-7 rounded-2xl relative transition-all duration-300 ${item.isAvailable ? 'bg-leaf shadow-[inset_0_2px_10px_rgba(0,0,0,0.1)]' : 'bg-muted/30'}`}>
                              <div className={`absolute top-1 w-5 h-5 rounded-xl bg-white shadow-premium transition-all duration-300 ${item.isAvailable ? 'left-6' : 'left-1'}`} />
                            </button>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex gap-2 transition-all">
                              <button onClick={() => { setEditingItem(item); setIsMenuModalOpen(true); }} className="w-10 h-10 rounded-xl bg-white border border-border flex items-center justify-center text-primary-navy hover:shadow-soft hover:border-accent-gold transition-all">✏️</button>
                              <button onClick={() => handleDeleteMenu(item._id!)} className="w-10 h-10 rounded-xl bg-white border border-border flex items-center justify-center text-alert-red hover:shadow-soft hover:border-alert-red/30 transition-all">🗑</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ─── Analytics View ─── */}
          {view === "analytics" && (
            <>
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div>
                  <h1 className="font-heading text-4xl md:text-5xl text-primary-navy font-black tracking-tight mb-2">Performance</h1>
                  <p className="text-muted font-medium">Growth insights and sales analytics.</p>
                </div>
                <div className="px-6 py-3 glass-morphism border border-border rounded-2xl text-[10px] font-black text-primary-navy uppercase tracking-[0.2em] shadow-soft">
                  {chartData.last7Days[0].label} – {chartData.last7Days[6].label}
                </div>
              </div>

              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {[
                  { label: "Gross Revenue", value: `₹${stats.totalSales.toFixed(0)}`, icon: "💰", trend: "+12.5%" },
                  { label: "Order Volume", value: `${stats.completed}`, icon: "📦", trend: "+8.3%" },
                  { label: "Ticket Average", value: `₹${stats.avgOrder.toFixed(0)}`, icon: "🎫", trend: "+5.7%" },
                  { label: "Success Rate", value: `${((stats.completed / (stats.total || 1)) * 100).toFixed(1)}%`, icon: "📈", trend: "+2.1%" },
                ].map((card) => (
                  <div key={card.label} className="card-premium p-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary-navy/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-accent-gold/5 transition-all" />
                    <div className="flex items-center gap-3 mb-6">
                      <span className="text-2xl grayscale group-hover:grayscale-0 transition-all">{card.icon}</span>
                      <p className="text-[10px] font-black text-muted uppercase tracking-widest">{card.label}</p>
                    </div>
                    <p className="numeric-text text-4xl text-primary-navy mb-4">{card.value}</p>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-leaf/10 rounded-lg">
                      <span className="text-[10px] font-black text-leaf">{card.trend}</span>
                      <svg className="w-3 h-3 text-leaf" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                    </div>
                  </div>
                ))}
              </div>

              {/* Charts & Inventory */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue Chart */}
                <div className="lg:col-span-2 card-premium p-8 sm:p-10">
                  <div className="flex items-center justify-between mb-12">
                    <h3 className="text-sm font-black text-primary-navy uppercase tracking-widest">Revenue Forecast</h3>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-primary-navy" />
                      <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Daily Sales</span>
                    </div>
                  </div>

                  <div className="h-64 relative border-b border-border/50 flex items-end justify-between px-6 pt-10">
                    <div className="absolute inset-0 pl-6 pr-6 pt-10 pb-0">
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <polyline points={chartData.points} fill="none" stroke="#003171" strokeWidth="2.5" strokeLinejoin="round" className="drop-shadow-premium" />
                        {chartData.points.split(" ").map((pt, i) => {
                          const [x, y] = pt.split(",");
                          return (
                            <g key={i} className="group/pt cursor-pointer">
                              <circle cx={x} cy={y} r="3" fill="#003171" stroke="white" strokeWidth="2" className="group-hover/pt:r-5 transition-all" />
                            </g>
                          );
                        })}
                      </svg>
                    </div>
                    {chartData.last7Days.map((day) => (
                      <div key={day.label} className="flex flex-col items-center translate-y-10 z-10">
                        <span className="text-[10px] font-black text-muted uppercase tracking-widest">{day.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Inventory Motion */}
                <div className="card-premium p-8 sm:p-10">
                  <h3 className="text-sm font-black text-primary-navy uppercase tracking-widest mb-10">Inventory Motion</h3>
                  <div className="space-y-8">
                    {topItems.length > 0 ? topItems.map((item, i) => (
                      <div key={item.name} className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-cream-dark overflow-hidden shrink-0 flex items-center justify-center text-2xl shadow-soft">
                          ☕
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-end mb-2">
                            <p className="text-[13px] text-primary-navy font-black truncate leading-none">{item.name}</p>
                            <span className="text-[10px] font-black text-muted uppercase tracking-wider">{item.count} Sold</span>
                          </div>
                          <div className="h-2 bg-cream-dark rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${item.percentage}%` }} transition={{ duration: 1.5, ease: "easeOut" }} className="h-full bg-primary-navy rounded-full" />
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="py-20 text-center opacity-20">
                        <span className="text-5xl block mb-4">🌪️</span>
                        <p className="text-[10px] font-black uppercase tracking-widest">No Velocity Data</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ─── QR Codes View ─── */}
          {view === "qr-codes" && (
            <div className="max-w-4xl">
              <div className="mb-12">
                <h1 className="font-heading text-4xl md:text-5xl text-primary-navy font-black tracking-tight mb-2">Access Points</h1>
                <p className="text-muted font-medium">Generate and manage table QR codes.</p>
              </div>
              <div className="card-premium p-10">
                <QRCodesPanel />
              </div>
            </div>
          )}

          {view === "whatsapp" && (
            <div className="max-w-2xl mx-auto h-full">
              <WhatsAppLinkPanel />
            </div>
          )}
         </div>
      </main>

      {/* Menu Item Modal */}
      <AnimatePresence>
        {isMenuModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-primary-navy/40 backdrop-blur-md" onClick={() => setIsMenuModalOpen(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()} className="w-full max-w-lg bg-antique-cream rounded-[2.5rem] shadow-premium p-10 border border-white">

              <div className="flex justify-between items-center mb-10">
                <div>
                  <h2 className="font-heading text-3xl text-primary-navy font-black tracking-tight">{editingItem?._id ? "Edit Item" : "Create Item"}</h2>
                  <p className="text-[10px] font-black text-accent-gold uppercase tracking-[0.3em] mt-1">Repository Update</p>
                </div>
                <button onClick={() => setIsMenuModalOpen(false)} className="w-10 h-10 rounded-xl bg-white border border-border flex items-center justify-center text-muted hover:text-primary-navy transition-all">✕</button>
              </div>

              <form onSubmit={handleSaveMenu} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-muted uppercase tracking-widest mb-2 px-1">Item Designation</label>
                    <input required type="text" placeholder="e.g. Blue Velvet Latte" value={editingItem?.name || ""} onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                      className="input-premium" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-muted uppercase tracking-widest mb-2 px-1">Taxonomy</label>
                    <select required value={editingItem?.category || ""} onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value as MenuCategory })}
                      className="input-premium bg-white">
                      <option value="">Choose...</option>
                      {[
                        "Tea", "Coffee", "Ice Tea", "Mocktails", "Shakes", 
                        "Breads", "Burger", "Pav & Fries", "Sandwich", 
                        "Pasta", "Pizza", "Cafe Special", "Momo", "Maggi", 
                        "Rolls", "Dessert", "Pastry", "Beverage", "Frappes", 
                        "Hot Chocolate", "OTC"
                      ].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-muted uppercase tracking-widest mb-2 px-1">Price Point (₹)</label>
                    <input required type="number" placeholder="250" value={editingItem?.price || ""} onChange={(e) => setEditingItem({ ...editingItem, price: Number(e.target.value) })}
                      className="input-premium" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-muted uppercase tracking-widest mb-2 px-1">Product Description</label>
                  <textarea rows={3} placeholder="Describe the flavor notes and ingredients..." value={editingItem?.description || ""} onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                    className="input-premium resize-none" />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-muted uppercase tracking-widest mb-2 px-1">Product Image (Cloudinary)</label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-white rounded-2xl border-2 border-dashed border-border/50 flex items-center justify-center overflow-hidden shrink-0">
                      {selectedFile ? (
                        <img src={URL.createObjectURL(selectedFile)} alt="Preview" className="w-full h-full object-cover" />
                      ) : editingItem?.image ? (
                        <img src={editingItem.image} alt="Current" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl">📸</span>
                      )}
                    </div>
                    <label className="flex-1 cursor-pointer">
                      <div className="btn-secondary py-3 text-[10px] text-center border-2 border-dashed">
                        {selectedFile ? selectedFile.name : "Choose New Image"}
                      </div>
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                    </label>
                  </div>
                </div>

                <div className="pt-8 flex gap-4">
                  <button type="button" disabled={isUploading} onClick={() => { setIsMenuModalOpen(false); setSelectedFile(null); }} className="flex-1 btn-secondary py-4 text-xs uppercase tracking-widest font-black">Cancel</button>
                  <button type="submit" disabled={isUploading} className="flex-1 btn-primary py-4 text-xs uppercase tracking-widest font-black shadow-premium flex items-center justify-center gap-2">
                    {isUploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        Uploading...
                      </>
                    ) : editingItem?._id ? "Commit Changes" : "Create Item"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
