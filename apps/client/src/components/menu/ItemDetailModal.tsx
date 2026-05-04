import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import type { MenuItem } from "@the-blue-cup/types";
import { useCartStore } from "../../stores/cartStore";

interface Props {
  item: MenuItem | null;
  onClose: () => void;
}

const categoryImages: Record<string, string> = {
  Tea: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&h=400&fit=crop",
  Coffee: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=600&h=400&fit=crop",
  "Ice Tea": "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&h=400&fit=crop",
  Mocktails: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&h=400&fit=crop",
  Shakes: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&h=400&fit=crop",
  Breads: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&h=400&fit=crop",
  Burger: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=400&fit=crop",
  "Pav & Fries": "https://images.unsplash.com/photo-1518013034993-41f89a7214f5?w=600&h=400&fit=crop",
  Sandwich: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&h=400&fit=crop",
  Pasta: "https://images.unsplash.com/photo-1473093226795-af9932fe5856?w=600&h=400&fit=crop",
  Pizza: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&h=400&fit=crop",
  "Cafe Special": "https://images.unsplash.com/photo-1626074353765-517a681e40be?w=600&h=400&fit=crop",
  Momo: "https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?w=600&h=400&fit=crop",
  Maggi: "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600&h=400&fit=crop",
  Rolls: "https://images.unsplash.com/photo-1626700051175-656868ed2bb1?w=600&h=400&fit=crop",
  Dessert: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=600&h=400&fit=crop",
};

const addOns = [
  { name: "Extra Shot", price: 20 },
  { name: "Chocolate Powder", price: 15 },
  { name: "Caramel Syrup", price: 20 },
  { name: "Soy Milk Substitute", price: 30 },
];

export default function ItemDetailModal({ item, onClose }: Props) {
  const [qty, setQty] = useState(1);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const addItem = useCartStore((s) => s.addItem);

  if (!item) return null;

  const addOnTotal = selectedAddOns.reduce((sum, name) => {
    const addon = addOns.find((a) => a.name === name);
    return sum + (addon?.price ?? 0);
  }, 0);
  const totalPrice = (item.price + addOnTotal) * qty;

  const toggleAddOn = (name: string) => {
    setSelectedAddOns((prev) =>
      prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name]
    );
  };

  const handleAdd = () => {
    const customization = selectedAddOns.join(", ");
    addItem({
      _id: item._id!,
      name: item.name,
      price: item.price + addOnTotal,
      quantity: qty,
      category: item.category,
      customization: customization || undefined,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-6 bg-primary-navy/40 backdrop-blur-md" onClick={onClose}>
        
        <motion.div 
          initial={{ y: "100%" }} 
          animate={{ y: 0 }} 
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full sm:max-w-lg bg-white rounded-t-[3rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[95vh] border-t border-white"
        >
          {/* Drag Handle (Mobile) */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/40 rounded-full z-30 sm:hidden" />

          {/* Close Button */}
          <button onClick={onClose}
            className="absolute top-6 right-6 z-30 w-12 h-12 flex items-center justify-center text-primary-navy bg-white/90 backdrop-blur-md rounded-2xl shadow-soft hover:bg-white transition-all active:scale-90 border border-border/50">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Hero Image */}
          <div className="relative h-[250px] sm:h-[300px] w-full shrink-0 overflow-hidden">
            <img src={categoryImages[item.category] || categoryImages.Coffee} alt={item.name}
              className="w-full h-full object-cover scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
            <div className="absolute bottom-6 left-8 flex flex-col gap-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-navy text-[9px] font-black uppercase tracking-widest text-antique-cream shadow-premium self-start">
                {item.category}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-8 pb-8 pt-2 overflow-y-auto flex-1 scrollbar-hide">
            <div className="flex justify-between items-start mb-6">
              <h2 className="font-heading text-3xl sm:text-4xl text-primary-navy font-black leading-none tracking-tight">{item.name}</h2>
              <p className="font-heading text-2xl text-accent-gold font-black whitespace-nowrap ml-6">₹{item.price.toFixed(0)}</p>
            </div>
            
            <p className="font-body text-base text-muted font-medium leading-relaxed mb-10 opacity-80">{item.description}</p>

            {/* Customization */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-xl">✨</span>
                <h4 className="font-heading text-lg text-primary-navy font-black tracking-tight">Artisan Enhancements</h4>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {addOns.map((addon) => (
                  <button 
                    key={addon.name}
                    onClick={() => toggleAddOn(addon.name)}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
                      selectedAddOns.includes(addon.name)
                        ? "bg-primary-navy/5 border-primary-navy/20 shadow-soft"
                        : "bg-warm-white border-border/50 hover:border-accent-gold/40"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                        selectedAddOns.includes(addon.name)
                          ? "bg-accent-gold border-accent-gold"
                          : "border-border bg-white"
                      }`}>
                        {selectedAddOns.includes(addon.name) && (
                          <svg className="w-4 h-4 text-primary-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className={`text-sm font-bold ${selectedAddOns.includes(addon.name) ? "text-primary-navy" : "text-muted"}`}>{addon.name}</span>
                    </div>
                    <span className="text-xs font-black text-accent-gold">+₹{addon.price}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="px-8 py-8 sm:py-10 border-t border-border/40 bg-white/80 backdrop-blur-xl">
            <div className="flex items-center gap-6">
              {/* Counter */}
              <div className="flex items-center bg-antique-cream border border-border rounded-[1.5rem] p-1.5 shadow-soft h-16 shrink-0">
                <button onClick={() => setQty(Math.max(1, qty - 1))}
                  className="w-12 h-full flex items-center justify-center text-primary-navy hover:bg-white rounded-xl transition-all font-black text-xl active:scale-90">−</button>
                <span className="w-10 text-center font-body text-base font-black text-primary-navy">{qty}</span>
                <button onClick={() => setQty(qty + 1)}
                  className="w-12 h-full flex items-center justify-center text-primary-navy hover:bg-white rounded-xl transition-all font-black text-xl active:scale-90">+</button>
              </div>

              {/* Add Button */}
              <button onClick={handleAdd}
                className="btn-gold flex-1 h-16 !px-8 shadow-gold relative overflow-hidden group/btn">
                <div className="flex items-center justify-between w-full relative z-10">
                  <span className="font-black text-[11px] uppercase tracking-[0.2em]">Add To Basket</span>
                  <div className="h-6 w-px bg-primary-navy/20" />
                  <span className="font-heading text-xl font-black">₹{totalPrice.toFixed(0)}</span>
                </div>
                <div className="absolute inset-0 bg-white/30 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500" />
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
