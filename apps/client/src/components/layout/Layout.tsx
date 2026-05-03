import { useEffect, useState } from "react";
import { Outlet, useLocation, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { useCartStore } from "../../stores/cartStore";
import { connectSocket, socket } from "../../lib/socket";
import FloatingWaiterButton from "../FloatingWaiterButton";

// Sound alert for customer order ready
const playCustomerBeep = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // A pleasant "ding" sound
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};

export default function Layout() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const tableNumber = useCartStore((state) => state.tableNumber);
  const setTableNumber = useCartStore((state) => state.setTableNumber);
  const [readyOrder, setReadyOrder] = useState<any>(null);
  
  const isAdmin = location.pathname.startsWith("/admin");

  useEffect(() => {
    connectSocket();
    const table = searchParams.get("table");
    if (table && !isNaN(parseInt(table, 10))) {
      setTableNumber(parseInt(table, 10));
    }

    const handleOrderReady = (order: any) => {
      // Play sound
      playCustomerBeep();

      // Browser notification
      if ("Notification" in window) {
        if (Notification.permission === "granted") {
          new Notification("Order Ready! 🎉", {
            body: `Your order for Table ${order.tableNumber} is ready to be served!`,
          });
        }
      }
      // UI Custom Toast
      setReadyOrder(order);
    };

    socket.on("orderReady", handleOrderReady);

    // Request notification permission early
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    return () => {
      socket.off("orderReady", handleOrderReady);
    };
  }, [searchParams, setTableNumber]);

  const isMenu = location.pathname.startsWith("/menu");

  // Admin has its own sidebar layout — no navbar/footer
  if (isAdmin) {
    return <Outlet />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-antique-cream">
      <Navbar />
      <main className="flex-1 w-full relative">
        <Outlet />
      </main>
      {!isMenu && <Footer />}
      
      {/* Floating Waiter Button Integrated Here */}
      <FloatingWaiterButton />

      {/* Order Ready Modal Notification */}
      <AnimatePresence>
        {readyOrder && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-primary-navy/20 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white/90 border border-white rounded-[3rem] shadow-premium p-10 max-w-sm w-full text-center relative overflow-hidden glass-morphism"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-gold-dark via-accent-gold to-gold-light" />
              
              <div className="mb-8">
                <div className="w-20 h-20 bg-accent-gold/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-accent-gold/20 shadow-soft">
                  <span className="text-4xl">☕</span>
                </div>
                <h2 className="font-heading text-4xl font-black text-primary-navy mb-3 tracking-tight">
                  Your Order is Ready!
                </h2>
                <p className="font-body text-muted text-sm font-medium leading-relaxed">
                  The artisan creation for <span className="text-primary-navy font-black">Table {readyOrder.tableNumber}</span> has been prepared and is ready to be served.
                </p>
              </div>
              
              <button
                onClick={() => setReadyOrder(null)}
                className="btn-primary w-full py-5 !text-[12px] shadow-gold"
              >
                COLLECT MY CREATION
              </button>
              
              <p className="mt-6 text-[10px] font-black text-accent-gold uppercase tracking-[0.2em] opacity-60">
                The Blue Cup Cafe Experience
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
