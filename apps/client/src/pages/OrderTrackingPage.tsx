import { motion, AnimatePresence } from "framer-motion";
import { useOrders } from "../hooks/useApi";
import { useCartStore } from "../stores/cartStore";
import type { OrderStatus } from "@the-blue-cup/types";
import { useEffect, useState } from "react";
import { socket, connectSocket, joinOrderRoom } from "../lib/socket";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";

const statusConfig: Record<OrderStatus, { color: string; bg: string; dot: string; label: string }> = {
  Pending: { color: "text-amber-700", bg: "bg-amber-50", dot: "bg-amber-500", label: "Awaiting Confirmation" },
  Preparing: { color: "text-blue-700", bg: "bg-blue-50", dot: "bg-blue-500", label: "Artisan at Work" },
  Ready: { color: "text-green-700", bg: "bg-green-50", dot: "bg-green-500", label: "Ready for Service" },
  Completed: { color: "text-gray-500", bg: "bg-gray-50", dot: "bg-gray-400", label: "Order Fulfilled" },
  Cancelled: { color: "text-red-600", bg: "bg-red-50", dot: "bg-red-500", label: "Order Cancelled" },
};

const statusSteps: OrderStatus[] = ["Pending", "Preparing", "Ready", "Completed"];

export default function OrderTrackingPage() {
  const deviceId = useCartStore((s) => s.deviceId);
  const { data: orders = [], isLoading } = useOrders(undefined, deviceId || undefined);
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<{ message: string; type: string } | null>(null);
  const [isSoundEnabled, setIsSoundEnabled] = useState(false);

  // Play status update sound
  const playSound = (status: string) => {
    if (!isSoundEnabled) return;
    try {
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
      audio.volume = 0.5;
      audio.play();
    } catch (e) {
      console.error("Audio playback failed", e);
    }
  };

  useEffect(() => {
    connectSocket();

    const handleStatusUpdate = ({ orderId, status }: { orderId: string, status: string }) => {
      setToast({ message: `Order Update: ${status}`, type: "success" });
      playSound(status);
      setTimeout(() => setToast(null), 4000);

      queryClient.invalidateQueries({ queryKey: ["orders"] });
    };

    socket.on("orderStatusUpdate", handleStatusUpdate);

    orders.forEach(order => {
      if (order._id && !["Completed", "Cancelled"].includes(order.status as string)) {
        joinOrderRoom(order._id);
      }
    });

    return () => {
      socket.off("orderStatusUpdate", handleStatusUpdate);
    };
  }, [queryClient, orders.length]);

  const active = orders.filter((o) => !["Completed", "Cancelled"].includes(o.status as string));
  const past = orders.filter((o) => ["Completed", "Cancelled"].includes(o.status as string)).slice(0, 10);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-antique-cream flex flex-col items-center justify-center gap-6">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="text-6xl">☕</motion.div>
        <p className="font-heading text-xl text-primary-navy font-black tracking-tight animate-pulse uppercase tracking-[0.2em]">Syncing Archive...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-antique-cream py-12 px-6 relative overflow-x-hidden">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: "-50%" }} animate={{ opacity: 1, y: 20, x: "-50%" }} exit={{ opacity: 0, y: -50, x: "-50%" }}
            className="fixed top-6 left-1/2 z-[100] bg-primary-navy text-accent-gold px-8 py-4 rounded-[1.5rem] shadow-premium flex items-center gap-4 border border-accent-gold/20 backdrop-blur-xl"
          >
            <span className="text-2xl animate-bounce">☕</span>
            <span className="font-heading text-xs font-black uppercase tracking-widest">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-3xl mx-auto">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-16">
          <Link to="/" className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl shadow-soft border border-border group active:scale-95 transition-all">
            <svg className="w-5 h-5 text-primary-navy group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="text-center">
            <h1 className="font-heading text-2xl text-primary-navy font-black tracking-tighter uppercase leading-none mb-1">Live Tracker</h1>
            <p className="text-[10px] font-black text-accent-gold uppercase tracking-[0.3em]">Artisan Experience</p>
          </div>
          <button 
            onClick={() => setIsSoundEnabled(!isSoundEnabled)} 
            className={`w-12 h-12 flex items-center justify-center rounded-2xl shadow-soft border transition-all active:scale-95 ${
              isSoundEnabled ? "bg-accent-gold border-accent-gold text-primary-navy" : "bg-white border-border text-muted"
            }`}
          >
            <div className="relative">
              {isSoundEnabled ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
              )}
              {isSoundEnabled && (
                <motion.span 
                  animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }} 
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full" 
                />
              )}
            </div>
          </button>
        </div>

        {/* Hero Illustration (Optional) */}
        <div className="text-center mb-12">
          <div className="inline-block relative">
            <span className="text-6xl filter drop-shadow-premium">📜</span>
            <motion.span
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -top-2 -right-2 text-2xl"
            >✨</motion.span>
          </div>
        </div>

        {/* Active Orders */}
        {active.length > 0 ? (
          <div className="space-y-10 mb-20">
            {active.map((order, i) => {
              const cfg = statusConfig[order.status as OrderStatus];
              const currentStep = statusSteps.indexOf(order.status as OrderStatus);
              return (
                <motion.div
                  key={order._id}
                  layout
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: i * 0.1 } }}
                  className="card-premium overflow-hidden border-t-4 border-t-accent-gold"
                >
                  <div className={`px-8 py-5 ${cfg.bg} border-b border-border/40 flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${cfg.dot} animate-pulse`} />
                      <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${cfg.color}`}>{cfg.label}</span>
                    </div>
                    <span className="text-[9px] font-black text-muted uppercase tracking-widest bg-white/50 px-3 py-1 rounded-full border border-border/20">
                      #{order._id?.slice(-6).toUpperCase()}
                    </span>
                  </div>

                  <div className="p-8 sm:p-10">
                    <div className="mb-10">
                      <div className="flex gap-1 sm:gap-2 mb-6">
                        {statusSteps.map((_, idx) => (
                          <div key={idx} className={`flex-1 h-1.5 rounded-full transition-all duration-1000 ${idx <= currentStep ? "bg-accent-gold shadow-[0_0_15px_rgba(212,175,55,0.4)]" : "bg-cream-dark"}`} />
                        ))}
                      </div>
                      <div className="flex justify-between gap-1">
                        {statusSteps.map((s, idx) => (
                          <div key={s} className="flex flex-col items-center flex-1">
                            <span className={`text-[7px] xs:text-[9px] font-black uppercase tracking-widest text-center leading-tight ${idx <= currentStep ? "text-primary-navy" : "text-muted opacity-30"}`}>{s}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-antique-cream/40 rounded-[2rem] p-6 border border-border/30 mb-8">
                      <h4 className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-4">Selection Detail</h4>
                      <div className="space-y-3">
                        {order.items.map((item, i) => (
                          <div key={i} className="flex justify-between items-center text-sm">
                            <span className="font-bold text-primary-navy">{typeof item.menuItem === "object" && item.menuItem !== null ? (item.menuItem as Record<string, string>).name : "Item"}</span>
                            <span className="font-black text-accent-gold">×{item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border/30">
                      <div>
                        <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-1">Serving Context</p>
                        <p className="font-heading text-lg font-black text-primary-navy">{order.tableNumber ? `Table ${order.tableNumber}` : "Artisan Takeaway"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-1">Valuation</p>
                        <p className="font-heading text-3xl text-primary-navy font-black tracking-tighter leading-none">₹{order.totalAmount.toFixed(0)}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 card-premium mb-20 bg-white/40 border-dashed border-2">
            <span className="text-6xl block mb-6 grayscale opacity-20">🍃</span>
            <p className="text-muted font-bold text-sm mb-10 max-w-xs mx-auto uppercase tracking-widest">No active sessions found</p>
            <Link to="/menu" className="btn-primary px-10 py-5 text-[10px] uppercase tracking-widest font-black shadow-premium">
              Begin New Selection
            </Link>
          </div>
        )}

        {/* Past Orders Archive */}
        {past.length > 0 && (
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-6 mb-10">
              <h2 className="text-[10px] font-black text-muted uppercase tracking-[0.4em] whitespace-nowrap">Archive</h2>
              <div className="h-[1px] bg-border/40 w-full" />
            </div>

            <div className="space-y-4">
              {past.map((order) => {
                const cfg = statusConfig[order.status as OrderStatus] || statusConfig.Completed;
                return (
                  <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} key={order._id}
                    className="group bg-white/60 hover:bg-white border border-border/30 hover:border-accent-gold/20 p-6 rounded-[2rem] flex items-center justify-between gap-6 transition-all shadow-soft hover:shadow-premium">
                    <div className="flex items-center gap-5">
                      <div className={`w-10 h-10 rounded-xl bg-antique-cream flex items-center justify-center text-lg`}>
                        {order.status === "Completed" ? "✨" : "🚫"}
                      </div>
                      <div>
                        <p className="text-sm text-primary-navy font-black leading-tight mb-1">
                          {order.items.length} item{order.items.length > 1 ? "s" : ""} • ₹{order.totalAmount.toFixed(0)}
                        </p>
                        <p className="text-[9px] text-muted font-black uppercase tracking-widest">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ""} • Table {order.tableNumber || "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {order.status === "Completed" && (
                        <button onClick={() => {
                          import("../utils/pdf").then(({ generateInvoice }) => generateInvoice(order as any));
                        }}
                          className="w-10 h-10 rounded-xl bg-antique-cream flex items-center justify-center text-primary-navy hover:bg-primary-navy hover:text-white transition-all shadow-soft border border-border/40">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </button>
                      )}
                      <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${cfg.color} ${cfg.bg} border-current/10`}>
                        {order.status}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
