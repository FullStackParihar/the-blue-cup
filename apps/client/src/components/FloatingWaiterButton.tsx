import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import { useCartStore } from "../stores/cartStore";
import { callWaiter, connectSocket } from "../lib/socket";

const playClickSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(1000, ctx.currentTime);
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch {}
};

export default function FloatingWaiterButton() {
  const location = useLocation();
  const tableNumber = useCartStore((s: any) => s.tableNumber);
  const totalCartItems = useCartStore((s: any) => s.getTotalItems());
  const [isCalling, setIsCalling] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const shouldClearMenuCartBar = location.pathname.startsWith("/menu") && totalCartItems > 0;

  const handleCall = () => {
    if (!tableNumber) return;
    
    playClickSound();
    setIsCalling(true);
    connectSocket();
    callWaiter(tableNumber);

    setTimeout(() => {
      setIsCalling(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 4000);
    }, 1500);
  };

  if (!tableNumber) return null;

  return (
    <div className={`fixed right-4 sm:right-8 z-40 pointer-events-none ${shouldClearMenuCartBar ? "bottom-[7.25rem] sm:bottom-8" : "bottom-5 sm:bottom-8"}`}>
      <AnimatePresence>
        {isCalling || showSuccess ? (
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.8 }}
            className="mb-4 bg-primary-navy text-accent-gold px-4 py-3 sm:px-6 sm:py-4 rounded-[2rem] shadow-premium border border-accent-gold/30 backdrop-blur-xl flex items-center gap-3 sm:gap-4 min-w-[210px] sm:min-w-[240px]"
          >
            <div className="relative w-8 h-8 flex items-center justify-center">
              {isCalling ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="text-xl">🛎️</motion.div>
              ) : (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-xl">✨</motion.span>
              )}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] leading-none mb-1">
                {isCalling ? "Signaling Artisan" : "Artisan Notified"}
              </p>
              <p className="text-xs font-bold text-white leading-none">
                {isCalling ? "Please wait a moment..." : "Someone is on the way!"}
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCall}
            className="pointer-events-auto flex items-center justify-center sm:justify-start gap-0 sm:gap-4 w-14 h-14 sm:w-auto sm:h-auto sm:px-8 sm:py-5 rounded-2xl sm:rounded-[2.5rem] bg-accent-gold text-primary-navy shadow-gold border border-white/20 transition-all group overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            
            <div className="relative">
              <span className="text-2xl block group-hover:animate-float">🔔</span>
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary-navy rounded-full animate-ping" />
            </div>
            
            <div className="hidden sm:block text-left">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] leading-none mb-1.5 opacity-80">Table {tableNumber}</p>
              <p className="text-sm font-black uppercase tracking-widest leading-none">Call Artisan</p>
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
