import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOrders, useUpdateOrderStatus } from "../hooks/useApi";
import { socket, connectSocket } from "../lib/socket";
import { useQueryClient } from "@tanstack/react-query";
import Loader from "../components/Loader";
import type { OrderStatus, Order } from "@the-blue-cup/types";

// Sound alert for new kitchen orders
const playKitchenBeep = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};

export default function KitchenDisplay() {
  const { data: orders = [], isLoading } = useOrders();
  const updateStatus = useUpdateOrderStatus();
  const qc = useQueryClient();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    connectSocket();
    
    const handleNew = () => { 
      qc.invalidateQueries({ queryKey: ["orders"] }); 
      playKitchenBeep();
    };
    const handleUpdate = () => qc.invalidateQueries({ queryKey: ["orders"] });
    
    socket.on("newOrderAlert", handleNew);
    socket.on("orderStatusUpdate", handleUpdate);
    
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    return () => { 
      socket.off("newOrderAlert", handleNew); 
      socket.off("orderStatusUpdate", handleUpdate); 
      clearInterval(timer);
    };
  }, [qc]);

  // Filter only active kitchen orders
  const kitchenOrders = orders.filter((o) => o.status === "Pending" || o.status === "Preparing")
    .sort((a, b) => new Date(a.createdAt || Date.now()).getTime() - new Date(b.createdAt || Date.now()).getTime());

  const pendingOrders = kitchenOrders.filter(o => o.status === "Pending");
  const preparingOrders = kitchenOrders.filter(o => o.status === "Preparing");

  const getElapsedTime = (dateString?: Date) => {
    if (!dateString) return 0;
    const diff = Math.floor((currentTime.getTime() - new Date(dateString).getTime()) / 60000);
    return diff;
  };

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen bg-[#111827] text-white font-body p-6 overflow-x-auto">
      {/* Header */}
      <header className="flex items-center justify-between mb-8 bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-700">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-accent-gold text-primary-navy rounded-lg flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21l9-5-9-5-9 5 9 5z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-wider">KITCHEN DISPLAY SYSTEM</h1>
            <p className="text-gray-400 text-sm">{currentTime.toLocaleTimeString()} • {kitchenOrders.length} Active Orders</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="bg-red-500/20 text-red-400 px-4 py-2 rounded-lg font-bold border border-red-500/30">
            {pendingOrders.length} NEW
          </div>
          <div className="bg-blue-500/20 text-blue-400 px-4 py-2 rounded-lg font-bold border border-blue-500/30">
            {preparingOrders.length} IN PROGRESS
          </div>
        </div>
      </header>

      {/* Orders Grid */}
      <div className="flex gap-6 overflow-x-auto pb-4 snap-x">
        <AnimatePresence>
          {kitchenOrders.map((order) => {
            const elapsedMins = getElapsedTime(order.createdAt);
            const isWarning = elapsedMins >= 10 && order.status === "Pending";
            const isCritical = elapsedMins >= 20;

            return (
              <motion.div 
                key={order._id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, y: -50 }}
                className={`shrink-0 w-[320px] rounded-2xl overflow-hidden flex flex-col snap-center border-2 ${
                  isCritical ? "border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]" : 
                  isWarning ? "border-yellow-500" : 
                  order.status === "Preparing" ? "border-blue-500" : "border-gray-700"
                } bg-gray-800`}
              >
                {/* Order Header */}
                <div className={`p-4 ${
                  isCritical ? "bg-red-500 text-white" : 
                  isWarning ? "bg-yellow-500 text-black" : 
                  order.status === "Preparing" ? "bg-blue-600 text-white" : "bg-gray-700 text-white"
                } flex justify-between items-center`}>
                  <div>
                    <h2 className="text-2xl font-bold">Table {order.tableNumber}</h2>
                    <p className="text-sm opacity-80 font-mono mt-1">#{order._id?.slice(-4).toUpperCase()}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-bold font-mono">{elapsedMins}</span>
                    <span className="text-sm opacity-80 ml-1">min</span>
                  </div>
                </div>

                {/* Items List */}
                <div className="flex-1 p-5 overflow-y-auto">
                  {order.specialInstructions && (
                    <div className="mb-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-yellow-200 text-sm">
                      ⚠️ <strong>Note:</strong> {order.specialInstructions}
                    </div>
                  )}
                  
                  <ul className="space-y-4">
                    {order.items.map((item, idx) => {
                      const itemName = typeof item.menuItem === "object" && item.menuItem !== null ? (item.menuItem as Record<string, string>).name : "Unknown Item";
                      return (
                        <li key={idx} className="flex gap-3 text-lg border-b border-gray-700 pb-3 last:border-0">
                          <span className="bg-gray-700 text-white px-3 py-1 rounded font-bold h-fit">
                            {item.quantity}
                          </span>
                          <div className="flex-1">
                            <p className="font-bold">{itemName}</p>
                            {item.customization && (
                              <p className="text-gray-400 text-sm mt-1 flex gap-1">
                                <span className="text-accent-gold">↳</span> {item.customization}
                              </p>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* Actions */}
                <div className="p-4 bg-gray-900 border-t border-gray-700">
                  {order.status === "Pending" ? (
                    <button 
                      onClick={() => updateStatus.mutate({ id: order._id!, status: "Preparing" })}
                      className="w-full py-4 text-xl font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors shadow-lg active:scale-95"
                    >
                      START PREPARING
                    </button>
                  ) : (
                    <button 
                      onClick={() => updateStatus.mutate({ id: order._id!, status: "Ready" })}
                      className="w-full py-4 text-xl font-bold bg-leaf hover:bg-leaf-light text-white rounded-xl transition-colors shadow-lg active:scale-95"
                    >
                      MARK READY / BUMP
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
          {kitchenOrders.length === 0 && (
            <div className="w-full py-20 flex flex-col items-center justify-center text-gray-500">
              <svg className="w-24 h-24 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              <h2 className="text-2xl font-bold">Kitchen is all caught up!</h2>
              <p>Waiting for new orders...</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
