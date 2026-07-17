import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "../stores/cartStore";
import { useCreateOrder } from "../hooks/useApi";
import { getDeviceId } from "../lib/socket";
import { LeafDecoration, SmallLeaf } from "../components/decorations/LeafDecoration";
import { getImageUrl } from "../utils/image";

const categoryImages: Record<string, string> = {
  Coffee: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=100&h=100&fit=crop",
  Tea: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=100&h=100&fit=crop",
  Pastry: "https://images.unsplash.com/photo-1555507036-ab1f4038024a?w=100&h=100&fit=crop",
  Sandwich: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=100&h=100&fit=crop",
  Beverage: "https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=100&h=100&fit=crop",
  Dessert: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=100&h=100&fit=crop",
};

export default function CartPage() {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, getTotalAmount, specialInstructions, setSpecialInstructions, clearCart, tableNumber } = useCartStore();
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const createOrder = useCreateOrder();

  const [isProcessing, setIsProcessing] = useState(false);

  const subtotal = getTotalAmount();
  const tax = 0;
  const total = subtotal;

  const handleCheckout = () => {
    if (customerPhone && !/^\d{10}$/.test(customerPhone)) {
      alert("Please enter a valid 10-digit WhatsApp number.");
      return;
    }
    setIsProcessing(true);
    setTimeout(() => {
      createOrder.mutate({
        tableNumber,
        items: items.map(i => ({
          menuItem: i._id,
          quantity: i.quantity,
          customization: i.customization
        })),
        customerName: customerName || "Guest",
        customerPhone,
        specialInstructions,
        deviceId: getDeviceId()
      }, {
        onSuccess: () => {
          setIsProcessing(false);
          setIsConfirmed(true);
        },
        onError: () => {
          setIsProcessing(false);
          alert("Payment failed. Please try again.");
        }
      });
    }, 2000);
  };

  if (isProcessing) {
    return (
      <div className="min-h-screen glass-morphism fixed inset-0 z-50 flex items-center justify-center p-6 bg-primary-navy/40">
        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          className="max-w-sm w-full bg-antique-cream rounded-[2.5rem] shadow-premium overflow-hidden text-center p-10 border border-white">
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 border-4 border-primary-navy/10 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-accent-gold rounded-full border-t-transparent animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center text-3xl">☕</div>
          </div>
          <h3 className="font-heading text-2xl text-primary-navy font-black tracking-tight mb-2 uppercase">Securing Order</h3>
          <p className="text-muted text-sm font-medium mb-8">Processing your selection via our premium gateway.</p>
          <div className="pt-6 border-t border-border/50">
            <div className="flex justify-between items-center px-2">
              <span className="text-[10px] font-black text-muted uppercase tracking-widest">Amount</span>
              <span className="font-heading text-xl text-primary-navy font-black">₹{total.toFixed(0)}</span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (isConfirmed) {
    return (
      <div className="relative min-h-screen bg-antique-cream flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full card-premium p-10 text-center relative z-10">

          <div className="relative w-32 h-32 mx-auto mb-8">
            <div className="absolute inset-0 bg-accent-gold/10 rounded-full flex items-center justify-center text-5xl">☕</div>
            <div className="absolute -bottom-2 -right-2 bg-leaf text-white rounded-2xl w-12 h-12 flex items-center justify-center shadow-premium border-4 border-white">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>
          </div>

          <h2 className="font-heading text-4xl text-primary-navy font-black tracking-tight mb-2 uppercase">Success!</h2>
          <p className="text-muted font-medium mb-10">Your order has been received by our artisan team.</p>

          <div className="bg-cream-dark/50 border border-border rounded-3xl p-6 mb-10 mx-auto max-w-[240px] shadow-soft">
            <p className="text-[10px] text-muted mb-2 font-black uppercase tracking-[0.2em]">
              {tableNumber ? "Table Assignment" : "Order Profile"}
            </p>
            <p className="font-heading text-5xl text-primary-navy font-black leading-none">
              {tableNumber ? tableNumber : "Walk-in"}
            </p>
          </div>

          <p className="text-[10px] text-muted font-black uppercase tracking-widest mb-10">
            Head over to tracking for live updates.
          </p>

          <div className="flex flex-col gap-4">
            <button onClick={() => { clearCart(); navigate("/orders"); }}
              className="btn-primary py-5 text-sm uppercase tracking-widest font-black shadow-premium">
              Track Progress
            </button>
            <button onClick={() => { clearCart(); navigate("/"); }}
              className="btn-secondary py-5 text-sm uppercase tracking-widest font-black">
              Return Home
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-antique-cream flex flex-col items-center justify-center p-6 text-center">
        <span className="text-8xl mb-8 grayscale opacity-20">🛒</span>
        <h2 className="font-heading text-4xl text-primary-navy font-black tracking-tight mb-4 uppercase">Cart Empty</h2>
        <p className="text-muted text-lg mb-12 max-w-xs mx-auto">Your basket is waiting for some artisan creations.</p>
        <Link to="/menu" className="btn-primary px-12 py-5 text-sm uppercase tracking-widest font-black shadow-premium">
          Browse Menu
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-antique-cream p-6 pb-32">
      <div className="max-w-2xl mx-auto flex items-center justify-between mb-12 pt-6">
        <button onClick={() => navigate(-1)} className="w-12 h-12 flex items-center justify-center bg-white border border-border text-primary-navy rounded-2xl shadow-soft hover:bg-cream-dark transition-all">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="font-heading text-3xl text-primary-navy font-black tracking-tight uppercase">Basket</h1>
        <div className="w-12"></div>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Cart Items */}
        <div className="card-premium p-6 sm:p-8 mb-8">
          <AnimatePresence>
            {items.map((item, idx) => (
              <motion.div key={`${item._id}-${item.customization}`} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center gap-6 py-6 border-b border-border/50 last:border-0 last:pb-0 first:pt-0 group"
              >
                <div className="w-16 h-16 bg-cream-dark rounded-2xl flex items-center justify-center shrink-0 overflow-hidden shadow-soft">
                  <img src={getImageUrl(item.image) || categoryImages[item.category] || categoryImages.Coffee} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-heading text-base text-primary-navy font-black truncate leading-tight mb-1">{item.name}</h3>
                  <div className="text-xs text-accent-gold font-bold">₹{item.price.toFixed(0)}</div>
                  {item.customization && (
                    <p className="text-[10px] text-muted font-medium truncate mt-2 uppercase tracking-wider">{item.customization}</p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-3 shrink-0">
                  <div className="flex items-center bg-cream-dark/50 border border-border rounded-xl p-1 shadow-inner">
                    <button onClick={() => { if (item.quantity > 1) updateQuantity(item.cartItemId || item._id!, item.quantity - 1); else removeItem(item.cartItemId || item._id!); }}
                      className="w-8 h-8 flex items-center justify-center text-primary-navy hover:bg-white rounded-lg transition-all text-sm font-bold">−</button>
                    <span className="w-8 text-center text-xs font-black text-primary-navy">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.cartItemId || item._id!, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center text-primary-navy hover:bg-white rounded-lg transition-all text-sm font-bold">+</button>
                  </div>
                  <div className="text-sm font-black text-primary-navy">₹{(item.price * item.quantity).toFixed(0)}</div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Guest Details */}
        <div className="card-premium p-6 sm:p-8 mb-8">
          <label className="block text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-6 px-1">Guest Details</label>
          <div className="space-y-6">
            <div>
              <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Full Name (Optional)" className="input-premium" />
            </div>
            <div className="relative">
              <input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="WhatsApp Number" className="input-premium pl-14" />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 border-r border-border pr-3">
                <span className="text-[10px] font-black text-muted">🇮🇳</span>
                <span className="text-xs font-bold text-primary-navy">+91</span>
              </div>
            </div>
            <p className="text-[9px] text-muted font-bold uppercase tracking-widest px-1">
              * Needed for digital bill on WhatsApp
            </p>
          </div>
        </div>

        {/* Special Instructions */}
        <div className="card-premium p-6 sm:p-8 mb-8">
          <label className="block text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-4 px-1">Artisan Instructions</label>
          <input type="text" value={specialInstructions} onChange={(e) => setSpecialInstructions(e.target.value)} placeholder="E.g. Extra hot, soy milk, no sugar..." className="input-premium" />
        </div>

        {/* Summary */}
        <div className="card-premium p-8 mb-8">
          <div className="space-y-4 mb-6 pb-6 border-b border-border/50">
            <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
              <span className="text-muted">Subtotal</span>
              <span className="text-primary-navy">₹{subtotal.toFixed(0)}</span>
            </div>
          </div>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Total Payment</p>
              <p className="font-heading text-4xl text-primary-navy font-black tracking-tighter leading-none">₹{total.toFixed(0)}</p>
            </div>
            {tableNumber && (
              <div className="text-right">
                <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Serving Table</p>
                <p className="font-heading text-2xl text-accent-gold font-black leading-none">{tableNumber}</p>
              </div>
            )}
          </div>
        </div>

        <button onClick={handleCheckout} className="btn-primary w-full py-5 text-sm uppercase tracking-widest font-black shadow-premium mb-8">
          Complete Purchase
        </button>

        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 px-4 py-2 bg-primary-navy/5 rounded-full border border-primary-navy/10">
            <svg className="w-3.5 h-3.5 text-leaf" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            <span className="text-[10px] font-black text-primary-navy uppercase tracking-[0.2em]">Encrypted Checkout</span>
          </div>
          <p className="text-[10px] text-muted font-medium uppercase tracking-widest">Powered by The Blue Cup Secure Engine</p>
        </div>
      </div>
    </div>
  );
}
