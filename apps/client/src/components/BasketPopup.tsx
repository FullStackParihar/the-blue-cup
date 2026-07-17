import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "../stores/cartStore";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export default function BasketPopup({ isOpen, onClose, onCheckout }: Props) {
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
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);
  
  const specialInstructions = useCartStore((s) => s.specialInstructions);
  const setSpecialInstructions = useCartStore((s) => s.setSpecialInstructions);

  const subtotal = useCartStore((s) => s.getTotalAmount());
  const tax = 0;
  const total = subtotal;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-primary-navy/40 backdrop-blur-md"
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-[70] bg-white rounded-t-[3rem] shadow-premium flex flex-col max-h-[90vh] sm:max-w-lg sm:mx-auto border-t border-white"
          >
            {/* Drag Handle */}
            <div className="w-full flex justify-center pt-4 pb-2" onClick={onClose}>
              <div className="w-12 h-1.5 bg-gray-200 rounded-full"></div>
            </div>

            {/* Header */}
            <div className="px-8 pb-6 flex items-center justify-between border-b border-border/50 shrink-0">
              <div>
                <h2 className="font-heading text-2xl font-black text-primary-navy tracking-tight">Your Selection</h2>
                <p className="text-[10px] font-black text-muted uppercase tracking-widest">{items.length} items in basket</p>
              </div>
              <button onClick={clearCart} className="text-[10px] font-black text-alert-red uppercase tracking-widest px-4 py-2 bg-alert-red/5 rounded-xl border border-alert-red/10 hover:bg-alert-red hover:text-white transition-all">
                Clear All
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-8 overflow-y-auto flex-1 scrollbar-hide">
              {items.length === 0 ? (
                <div className="text-center py-20 flex flex-col items-center">
                  <span className="text-6xl mb-6 opacity-20 filter grayscale">🛒</span>
                  <p className="text-muted font-bold uppercase tracking-widest text-sm">Your basket is waiting</p>
                </div>
              ) : (
                <div className="space-y-10">
                  {/* Cart Items */}
                  <div className="space-y-8">
                    {items.map((item) => {
                      const id = item.cartItemId || item._id;
                      return (
                        <div key={id} className="flex items-start justify-between group">
                          <div className="flex-1 pr-6">
                            <div className="flex items-center gap-3 mb-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-accent-gold" />
                              <h4 className="font-heading text-base font-black text-primary-navy leading-tight">
                                {item.name}
                              </h4>
                            </div>
                            {item.customization && (
                              <p className="text-[10px] text-muted font-medium uppercase tracking-wider mb-2">{item.customization}</p>
                            )}
                            <div className="numeric-text text-lg text-primary-navy">₹{(item.price * item.quantity).toFixed(0)}</div>
                          </div>
                          
                          {/* Counter */}
                          <div className="flex items-center bg-antique-cream border border-border rounded-[1.25rem] p-1 shadow-soft h-12 shrink-0">
                            <button 
                              onClick={() => updateQuantity(id, item.quantity - 1)}
                              className="w-10 h-full flex items-center justify-center text-primary-navy hover:bg-white rounded-lg transition-all font-black text-lg active:scale-90"
                            >
                              −
                            </button>
                            <span className="numeric-text w-8 text-center text-xs text-primary-navy">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(id, item.quantity + 1)}
                              className="w-10 h-full flex items-center justify-center text-primary-navy hover:bg-white rounded-lg transition-all font-black text-lg active:scale-90"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Special Instructions */}
                  <div className="pt-4">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-lg">✍️</span>
                      <h4 className="font-heading text-base font-black text-primary-navy tracking-tight">Artisan Requests</h4>
                    </div>
                    <textarea 
                      placeholder="Any specific preferences for our chefs?"
                      maxLength={200}
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      className="input-premium h-24 resize-none !px-5 !py-4 scrollbar-hide"
                    />
                    <div className="text-right text-[9px] font-black text-muted uppercase tracking-widest mt-2 px-2"><span className="numeric-text inline">{specialInstructions.length}/200</span> characters</div>
                  </div>
                  
                  {/* Order Summary */}
                  <div className="bg-antique-cream/60 p-6 rounded-[2rem] border border-border/50 shadow-soft">
                    <div className="flex justify-between text-[10px] font-black text-muted uppercase tracking-widest mb-4 pb-4 border-b border-border/40">
                      <span>Subtotal</span>
                      <span className="numeric-text text-primary-navy">₹{subtotal.toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-xs font-black text-primary-navy uppercase tracking-[0.2em]">Total Value</span>
                      <span className="numeric-text text-3xl text-primary-navy">₹{total.toFixed(0)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Footer */}
            <div className="p-8 border-t border-border/40 bg-white/80 backdrop-blur-xl shrink-0">
              <button 
                disabled={items.length === 0}
                onClick={onCheckout}
                className="btn-primary w-full h-16 text-sm uppercase tracking-widest font-black shadow-premium disabled:opacity-30 relative overflow-hidden group/btn"
              >
                <span className="relative z-10">Proceed to Secure Checkout</span>
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500" />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
