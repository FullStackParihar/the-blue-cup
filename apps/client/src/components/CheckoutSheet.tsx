import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "../stores/cartStore";
import { useUserStore } from "../stores/userStore";
import { useNavigate } from "react-router-dom";
import { orderApi, authApi } from "../lib/api";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function CheckoutSheet({ isOpen, onClose }: Props) {
  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  const items = useCartStore((s) => s.items);
  const tableNumber = useCartStore((s) => s.tableNumber);
  const specialInstructions = useCartStore((s) => s.specialInstructions);
  const customerName = useCartStore((s) => s.customerName);
  const customerPhone = useCartStore((s) => s.customerPhone);
  const deviceId = useCartStore((s) => s.deviceId);
  const setCustomerInfo = useCartStore((s) => s.setCustomerInfo);
  const clearCart = useCartStore((s) => s.clearCart);

  const { user, setUser } = useUserStore();
  const [authMode, setAuthMode] = useState<"guest" | "login" | "register">("guest");
  const [authForm, setAuthForm] = useState({ email: "", password: "", name: "", phone: "" });
  const [authError, setAuthError] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();

  const subtotal = useCartStore((s) => s.getTotalAmount());
  const tax = 0;
  const total = subtotal;

  const handleAuth = async () => {
    setAuthError(null);
    setIsLoading(true);
    try {
      let res;
      if (authMode === "login") {
        res = await authApi.login({ email: authForm.email, password: authForm.password });
      } else {
        res = await authApi.register(authForm);
      }
      
      if (res.data) {
        setUser(res.data.user, res.data.token);
        setAuthMode("guest"); // Close auth view, user is now logged in
        if (res.data.user.name) setCustomerInfo(res.data.user.name, res.data.user.phone || customerPhone);
      }
    } catch (err: any) {
      setAuthError(err.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (items.length === 0) return;
    setIsLoading(true);
    setError(null);

    try {
      const orderPayload = {
        items: items.map(i => ({
          menuItem: i._id,
          quantity: i.quantity,
          customization: i.customization || undefined
        })),
        tableNumber: tableNumber,
        customerName: customerName || "Guest",
        customerPhone: customerPhone || undefined,
        specialInstructions: specialInstructions || undefined,
        deviceId: deviceId || undefined,
      };

      const res = await orderApi.create(orderPayload);
      
      if (res.data) {
        clearCart();
        onClose();
        navigate(`/orders?tracking=${res.data._id}`);
      }
      
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to place order. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[80] bg-primary-navy/40 backdrop-blur-md"
          />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-[90] bg-white rounded-t-[3rem] shadow-premium flex flex-col h-[95vh] sm:max-w-lg sm:mx-auto border-t border-white"
          >
            {/* Drag Handle */}
            <div className="w-full flex justify-center pt-4 pb-2" onClick={onClose}>
              <div className="w-12 h-1.5 bg-gray-200 rounded-full"></div>
            </div>

            {/* Header */}
            <div className="px-8 pb-6 border-b border-border/50 shrink-0">
              <h2 className="font-heading text-2xl font-black text-primary-navy tracking-tight uppercase">Confirm Order</h2>
            </div>

            {/* Scrollable Content */}
            <div className="p-8 overflow-y-auto flex-1 space-y-10 scrollbar-hide">
              
              {/* Order Context */}
              <div className="bg-antique-cream/80 rounded-[2rem] p-6 border border-border/40 shadow-soft relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-accent-gold/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                <h3 className="font-heading text-lg font-black text-primary-navy mb-2">
                  {tableNumber ? `📍 Dining at Table ${tableNumber}` : "🚶 Artisan Takeaway"}
                </h3>
                <div className="text-[10px] font-black text-muted uppercase tracking-widest space-y-1">
                  <p><span className="numeric-text inline">{items.length}</span> artisan selections • Total Value: <span className="numeric-text inline">₹{total.toFixed(0)}</span></p>
                  <p className="opacity-60 truncate">{items.map(i => i.name).join(", ")}</p>
                </div>
              </div>

              {/* Your Details / Rewards */}
              <div className="space-y-6">
                {!user ? (
                  <div className="card-premium p-5 bg-white border-accent-gold/20 overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-accent-gold/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                    
                    <div className="flex items-center justify-between mb-4 relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary-navy flex items-center justify-center text-accent-gold shadow-premium text-xs">✨</div>
                        <div>
                          <h3 className="font-heading text-base font-black text-primary-navy tracking-tight uppercase">Artisan Rewards</h3>
                        </div>
                      </div>
                      <span className="text-[7px] font-black bg-accent-gold/10 text-accent-gold px-2 py-1 rounded-full uppercase border border-accent-gold/20">Member Perks</span>
                    </div>
                    
                    {authMode === "guest" ? (
                      <div className="relative z-10 flex items-center justify-between gap-4">
                        <p className="text-[10px] font-medium text-muted leading-tight max-w-[140px]">Join for exclusive previews and artisan perks.</p>
                        <div className="flex gap-2">
                          <button onClick={() => setAuthMode("login")} className="btn-secondary !py-2 !px-4 text-[8px] uppercase font-black tracking-widest whitespace-nowrap">Sign In</button>
                          <button onClick={() => setAuthMode("register")} className="btn-gold !py-2 !px-4 text-[8px] uppercase font-black tracking-widest shadow-gold whitespace-nowrap">Join</button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 relative z-10">
                        <div className="flex items-center gap-2 mb-1">
                          <button onClick={() => setAuthMode("guest")} className="text-muted hover:text-primary-navy transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                          </button>
                          <span className="text-[9px] font-black text-primary-navy uppercase tracking-widest">{authMode === "login" ? "Welcome Back" : "Create Account"}</span>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-2">
                          {authMode === "register" && (
                            <input 
                              type="text" 
                              placeholder="Full Name" 
                              value={authForm.name} 
                              onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })} 
                              className="input-premium !py-2.5 !px-4 !text-xs !bg-antique-cream/30" 
                            />
                          )}
                          <div className="grid grid-cols-2 gap-2">
                            <input 
                              type="email" 
                              placeholder="Email" 
                              value={authForm.email} 
                              onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} 
                              className="input-premium !py-2.5 !px-4 !text-xs !bg-antique-cream/30" 
                            />
                            <input 
                              type="password" 
                              placeholder="Pass" 
                              value={authForm.password} 
                              onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} 
                              className="input-premium !py-2.5 !px-4 !text-xs !bg-antique-cream/30" 
                            />
                          </div>
                        </div>
                        
                        {authError && (
                          <p className="text-[7px] text-alert-red font-black uppercase tracking-widest text-center">{authError}</p>
                        )}
                        
                        <button 
                          onClick={handleAuth} 
                          disabled={isLoading}
                          className="w-full btn-primary !py-2.5 text-[8px] uppercase font-black tracking-widest shadow-premium disabled:opacity-50"
                        >
                          {isLoading ? "Validating..." : authMode === "login" ? "Unlock Profile" : "Establish Account"}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="card-premium p-6 border-accent-gold/30 bg-accent-gold/5 flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary-navy flex items-center justify-center text-accent-gold shadow-premium group-hover:scale-110 transition-transform">✨</div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-[9px] font-black text-muted uppercase tracking-widest">Artisan Member</p>
                          <span className="w-1.5 h-1.5 rounded-full bg-leaf animate-pulse" />
                        </div>
                        <h4 className="font-heading text-lg font-black text-primary-navy leading-none tracking-tight">{user.name || user.email}</h4>
                      </div>
                    </div>
                    <button onClick={() => useUserStore.getState().logout()} className="w-10 h-10 rounded-xl bg-alert-red/5 flex items-center justify-center text-alert-red hover:bg-alert-red hover:text-white transition-all shadow-soft group/logout">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    </button>
                  </div>
                )}

                {/* Profile Fields (Used for guest or pre-filled for members) */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xl">🤵</span>
                    <h3 className="font-heading text-lg font-black text-primary-navy tracking-tight">Delivery Details</h3>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-muted uppercase tracking-widest px-2">Contact Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. John Doe" 
                      value={customerName}
                      onChange={(e) => setCustomerInfo(e.target.value, customerPhone)}
                      className="input-premium"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-muted uppercase tracking-widest px-2">Mobile Number</label>
                    <input 
                      type="tel" 
                      placeholder="e.g. +91 98765 43210" 
                      value={customerPhone}
                      onChange={(e) => setCustomerInfo(customerName, e.target.value)}
                      className="input-premium"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-xl">💳</span>
                  <h3 className="font-heading text-lg font-black text-primary-navy tracking-tight">Settlement Method</h3>
                </div>
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-5 border-2 border-accent-gold rounded-2xl bg-accent-gold/5 cursor-pointer shadow-soft">
                    <div className="flex items-center gap-4">
                      <div className="w-6 h-6 rounded-full border-2 border-accent-gold flex items-center justify-center p-1 bg-white">
                        <div className="w-full h-full bg-accent-gold rounded-full" />
                      </div>
                      <span className="font-black text-primary-navy text-sm uppercase tracking-widest">Pay at Counter</span>
                    </div>
                    <span className="text-xl">🏦</span>
                  </label>
                  
                  <label className="flex items-center justify-between p-5 border border-border/50 rounded-2xl bg-warm-white opacity-40 cursor-not-allowed grayscale">
                    <div className="flex items-center gap-4">
                      <div className="w-6 h-6 rounded-full border-2 border-border" />
                      <span className="font-black text-muted text-sm uppercase tracking-widest">Digital Payment</span>
                    </div>
                    <span className="text-[10px] font-black text-muted uppercase tracking-widest">Coming Soon</span>
                  </label>
                </div>
              </div>
              
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-alert-red/5 text-alert-red p-6 rounded-[1.5rem] text-xs font-bold border border-alert-red/20 shadow-soft"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg">⚠️</span>
                    <span className="uppercase tracking-widest">Transmission Error</span>
                  </div>
                  <p className="opacity-80 leading-relaxed">{error}</p>
                </motion.div>
              )}

            </div>

            {/* Action Footer */}
            <div className="p-8 border-t border-border/40 bg-white/80 backdrop-blur-xl shrink-0">
              <button 
                onClick={handlePlaceOrder}
                disabled={isLoading || items.length === 0}
                className="btn-primary w-full h-16 shadow-premium disabled:opacity-30 flex items-center justify-center gap-4 group/btn relative overflow-hidden"
              >
                {isLoading ? (
                  <span className="animate-pulse uppercase tracking-[0.2em] text-[10px]">Processing Transmission...</span>
                ) : (
                  <div className="flex items-center justify-between w-full relative z-10 px-4">
                    <span className="font-black text-[11px] uppercase tracking-[0.3em]">Commit Order</span>
                    <div className="h-6 w-px bg-white/20" />
                    <span className="numeric-text text-xl">₹{total.toFixed(0)}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500" />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
