import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useMenuItems } from "../hooks/useApi";
import { useCartStore } from "../stores/cartStore";
import { getImageUrl } from "../utils/image";
import ItemDetailModal from "../components/menu/ItemDetailModal";
import type { MenuItem } from "@the-blue-cup/types";
import BasketPopup from "../components/BasketPopup";
import CheckoutSheet from "../components/CheckoutSheet";

const categoryImages: Record<string, string> = {
  Tea: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop",
  Coffee: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&h=400&fit=crop",
  "Ice Tea": "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop",
  Mocktails: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&h=400&fit=crop",
  Shakes: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&h=400&fit=crop",
  Breads: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop",
  Burger: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop",
  "Pav & Fries": "https://images.unsplash.com/photo-1518013034993-41f89a7214f5?w=400&h=400&fit=crop",
  Sandwich: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&h=400&fit=crop",
  Pasta: "https://images.unsplash.com/photo-1473093226795-af9932fe5856?w=400&h=400&fit=crop",
  Pizza: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=400&fit=crop",
  "Cafe Special": "https://images.unsplash.com/photo-1626074353765-517a681e40be?w=400&h=400&fit=crop",
  Momo: "https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?w=400&h=400&fit=crop",
  Maggi: "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=400&h=400&fit=crop",
  Rolls: "https://images.unsplash.com/photo-1626700051175-656868ed2bb1?w=400&h=400&fit=crop",
  Dessert: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=400&fit=crop",
};

export default function MenuPage() {
  const [searchParams] = useSearchParams();
  const initialCat = searchParams.get("category") || "All";
  const [activeCat, setActiveCat] = useState(initialCat);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const { data: rawMenuItems = [], isLoading, error } = useMenuItems();
  const menuItems = rawMenuItems.filter((item) => item.isAvailable);
  const addItem = useCartStore((s) => s.addItem);

  const [isBasketOpen, setIsBasketOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const tableNumber = useCartStore((s) => s.tableNumber);
  const setTableNumber = useCartStore((s) => s.setTableNumber);
  const [tableUpdateMessage, setTableUpdateMessage] = useState<string | null>(null);

  // Helper for localStorage expiry
  const setTableStorage = (num: number) => {
    const data = { value: num, timestamp: Date.now() };
    localStorage.setItem("bluecup_table", JSON.stringify(data));
  };

  const getTableStorage = (): number | null => {
    try {
      const dataStr = localStorage.getItem("bluecup_table");
      if (!dataStr) return null;
      if (!dataStr.startsWith("{")) {
        const num = parseInt(dataStr, 10);
        if (!isNaN(num)) {
          setTableStorage(num);
          return num;
        }
        return null;
      }
      const data = JSON.parse(dataStr);
      if (Date.now() - data.timestamp > 3 * 60 * 60 * 1000) {
        localStorage.removeItem("bluecup_table");
        return null;
      }
      return data.value;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const tableParam = searchParams.get("table");
    let currentTable = tableNumber;

    if (tableParam) {
      const num = parseInt(tableParam, 10);
      if (!isNaN(num) && num >= 1 && num <= 11) {
        if (currentTable !== null && currentTable !== num) {
          setTableUpdateMessage(`📍 Moved to Table ${num}`);
          setTimeout(() => setTableUpdateMessage(null), 3000);
        }
        setTableNumber(num);
        setTableStorage(num);
      }
    } else {
      const storedTable = getTableStorage();
      if (storedTable) {
        setTableNumber(storedTable);
      }
    }
  }, [searchParams, setTableNumber]);

  const [searchQuery, setSearchQuery] = useState("");
  const cartItems = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  const tabOrder = [
    "All",
    "Tea",
    "Coffee",
    "Ice Tea",
    "Mocktails",
    "Shakes",
    "Breads",
    "Burger",
    "Pav & Fries",
    "Sandwich",
    "Pasta",
    "Pizza",
    "Cafe Special",
    "Momo",
    "Maggi",
    "Rolls",
    "Dessert",
  ];
  const allCats = ["All", ...Array.from(new Set(menuItems.map((i) => i.category)))].sort((a, b) => {
    const iA = tabOrder.indexOf(a);
    const iB = tabOrder.indexOf(b);
    if (iA !== -1 && iB !== -1) return iA - iB;
    if (iA !== -1) return -1;
    if (iB !== -1) return 1;
    return a.localeCompare(b);
  });

  const filtered = menuItems.filter((i) => {
    const matchCat = activeCat === "All" || i.category === activeCat;
    const matchSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const getCartQuantity = (itemId: string) => {
    return cartItems.filter((i) => i._id === itemId).reduce((sum, i) => sum + i.quantity, 0);
  };

  const incrementCartItem = (item: MenuItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const itemInCart = cartItems.filter(i => i._id === item._id);
    if (itemInCart.length > 1) {
      setSelectedItem(item);
      return;
    }
    const existing = itemInCart[0];
    if (existing) {
      updateQuantity(existing.cartItemId || existing._id, existing.quantity + 1);
    } else {
      addItem({ _id: item._id!, name: item.name, price: item.price, quantity: 1, category: item.category, image: item.image });
    }
  };

  const decrementCartItem = (item: MenuItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const itemInCart = cartItems.filter(i => i._id === item._id);
    if (itemInCart.length > 1) {
      setSelectedItem(item);
      return;
    }
    const existing = itemInCart[0];
    if (existing) {
      if (existing.quantity > 1) {
        updateQuantity(existing.cartItemId || existing._id, existing.quantity - 1);
      } else {
        removeItem(existing.cartItemId || existing._id);
      }
    }
  };

  const quickAdd = (item: MenuItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.isAvailable) return;
    addItem({ _id: item._id!, name: item.name, price: item.price, quantity: 1, category: item.category });
  };

  const totalCartItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartAmount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="relative min-h-screen bg-antique-cream pb-32">
      <section className="bg-white/70 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-7xl mx-auto px-3 sm:px-8 py-3 sm:py-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-premium !py-3 !pl-12 !bg-warm-white/70"
            />
            <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </section>

      {/* Table & Toast Messages */}
      <AnimatePresence>
        {tableUpdateMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }} animate={{ opacity: 1, y: 16, x: "-50%" }} exit={{ opacity: 0, y: -20, x: "-50%" }}
            className="fixed top-24 left-1/2 z-[60] bg-leaf text-white px-6 py-3 rounded-2xl shadow-premium text-[11px] font-black uppercase tracking-widest flex items-center gap-3 border border-white/20"
          >
            <span>{tableUpdateMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="relative h-[25vh] md:h-[40vh] overflow-hidden group">
          <img
            src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&h=600&fit=crop"
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
            alt="Cafe Banner"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-antique-cream via-antique-cream/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <p className="text-[10px] font-black text-accent-gold uppercase tracking-[0.4em] mb-3">Est. 2024</p>
              <h2 className="font-heading text-3xl md:text-6xl text-primary-navy font-black tracking-tighter leading-none mb-4 uppercase">
                Artisan <br className="md:hidden" /> Creations
              </h2>
              {tableNumber && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-md border border-white rounded-xl shadow-soft">
                  <span className="text-sm">📍</span>
                  <span className="text-[10px] font-black text-primary-navy uppercase tracking-widest">Serving Table <span className="numeric-text">{tableNumber}</span></span>
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Category Selection */}
        <div className="sticky top-20 z-30 bg-antique-cream/95 backdrop-blur-md border-b border-border/40">
          <div className="flex gap-2 sm:gap-4 overflow-x-auto scrollbar-hide py-3 sm:py-6 px-3 sm:px-8 snap-x snap-mandatory scroll-px-3 sm:scroll-px-8">
            {allCats.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCat(cat)}
                className={`snap-start shrink-0 whitespace-nowrap min-w-[4.5rem] sm:min-w-0 px-4 py-2 sm:px-8 sm:py-3.5 rounded-xl sm:rounded-2xl text-[8px] sm:text-[10px] font-black uppercase tracking-[0.16em] sm:tracking-[0.2em] transition-all border shadow-soft active:scale-95 ${activeCat === cat
                  ? "bg-primary-navy border-primary-navy text-antique-cream shadow-premium"
                  : "bg-white border-border text-primary-navy hover:border-accent-gold/40"
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Grid */}
        <div className="p-4 sm:p-8 bento-grid pb-40">
          {isLoading ? (
            <div className="col-span-12 py-32 flex flex-col items-center justify-center gap-6">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="text-6xl">☕</motion.div>
              <p className="text-muted font-black uppercase tracking-[0.2em] animate-pulse">Brewing the menu...</p>
            </div>
          ) : error ? (
            <div className="col-span-12 py-32 text-center card-premium m-6">
              <span className="text-5xl block mb-4">🍂</span>
              <h3 className="text-xl font-heading font-black text-primary-navy mb-2 uppercase tracking-tight">Transmission Error</h3>
              <p className="text-muted text-sm font-medium mb-8 max-w-xs mx-auto">We couldn't connect to the pantry. Please verify your connection.</p>
              <button onClick={() => window.location.reload()} className="btn-primary px-10 py-4 text-[10px] uppercase tracking-widest font-black">Reconnect</button>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filtered.map((item, i) => {
                const qtyInCart = getCartQuantity(item._id!);
                return (
                  <motion.div
                    key={item._id}
                    layout
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setSelectedItem(item)}
                    className={`col-span-6 md:col-span-6 lg:col-span-4 card-premium overflow-hidden group cursor-pointer hover-lift ${!item.isAvailable ? 'opacity-60 grayscale' : ''}`}
                  >
                    <div className="w-full h-40 sm:h-64 relative overflow-hidden bg-cream-dark">
                      <img
                        src={getImageUrl(item.image) || categoryImages[item.category] || categoryImages.Coffee}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                      {!item.isAvailable && (
                        <div className="absolute inset-0 bg-primary-navy/60 backdrop-blur-sm z-10 flex items-center justify-center p-2 text-center">
                          <span className="bg-antique-cream text-primary-navy px-3 py-1.5 sm:px-6 sm:py-2.5 rounded-xl sm:rounded-2xl text-[8px] sm:text-[10px] font-black tracking-widest sm:tracking-[0.2em] uppercase shadow-premium border border-white">Sold Out</span>
                        </div>
                      )}

                      <div className="absolute top-2 left-2 sm:top-4 sm:left-4">
                        <div className="bg-white/90 backdrop-blur-md px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl text-[7px] sm:text-[9px] font-black text-primary-navy uppercase tracking-widest flex items-center gap-1.5 sm:gap-2 shadow-soft border border-white">
                          <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-accent-gold" /> {item.category}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 sm:p-8 flex flex-col flex-1">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-2 sm:gap-4 mb-3 sm:mb-4">
                        <h3 className="font-heading text-lg sm:text-2xl text-primary-navy font-black leading-tight tracking-tight uppercase line-clamp-1">{item.name}</h3>
                        <span className="numeric-text text-base sm:text-xl text-primary-navy whitespace-nowrap">₹{item.price.toFixed(0)}</span>
                      </div>

                      <p className="text-muted text-[10px] sm:text-sm font-medium leading-relaxed mb-4 sm:mb-8 line-clamp-2">{item.description}</p>

                      <div className="mt-auto flex items-center justify-end">
                        {qtyInCart > 0 ? (
                          <div className="flex items-center bg-antique-cream border border-border rounded-xl sm:rounded-[1.25rem] p-0.5 sm:p-1 shadow-soft" onClick={(e) => e.stopPropagation()}>
                            <button onClick={(e) => decrementCartItem(item, e)} className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-primary-navy hover:bg-white rounded-lg transition-all font-black text-base sm:text-lg active:scale-90">−</button>
                            <span className="numeric-text w-6 sm:w-8 text-center text-[11px] sm:text-xs text-primary-navy">{qtyInCart}</span>
                            <button onClick={(e) => incrementCartItem(item, e)} className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-accent-gold hover:bg-white rounded-lg transition-all font-black text-base sm:text-lg active:scale-90">+</button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => quickAdd(item, e)}
                            disabled={!item.isAvailable}
                            className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-primary-navy flex items-center justify-center text-antique-cream shadow-premium hover:bg-accent-gold hover:text-primary-navy transition-all active:scale-90 group/add"
                          >
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 group-hover/add:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}

          {!isLoading && !error && filtered.length === 0 && (
            <div className="col-span-12 py-32 text-center">
              <span className="text-6xl block mb-6 opacity-20 filter grayscale">🍽️</span>
              <p className="font-black text-muted uppercase tracking-[0.2em] text-sm">No flavors matched your search</p>
            </div>
          )}
        </div>
      </main>

      {/* Item Detail Modal */}
      {selectedItem && <ItemDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />}

      {/* High-End Floating Basket Bar */}
      <AnimatePresence>
        {totalCartItems > 0 && !isBasketOpen && !isCheckoutOpen && (
          <motion.div
            initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-6 right-6 z-50 max-w-lg mx-auto"
          >
            <button
              onClick={() => setIsBasketOpen(true)}
              className="w-full bg-primary-navy text-antique-cream rounded-[2.5rem] shadow-premium p-2 flex items-center justify-between border border-white/10 group overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-accent-gold translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500 opacity-10" />

              <div className="flex items-center gap-4 pl-4 relative z-10">
                <div className="w-12 h-12 rounded-[1.25rem] bg-white/10 flex items-center justify-center text-xl">
                  🛒
                </div>
                <div>
                  <p className="font-black text-[11px] uppercase tracking-[0.2em] text-left leading-none mb-1">Your Selection</p>
                  <p className="numeric-text text-lg text-accent-gold leading-none">{totalCartItems} {totalCartItems === 1 ? 'Item' : 'Items'}</p>
                </div>
              </div>

              <div className="flex items-center gap-6 pr-6 relative z-10">
                <div className="text-right">
                  <p className="font-black text-[9px] uppercase tracking-widest text-white/40 mb-1">Total Valuation</p>
                  <p className="numeric-text text-xl">₹{totalCartAmount.toFixed(0)}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white">
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <BasketPopup
        isOpen={isBasketOpen}
        onClose={() => setIsBasketOpen(false)}
        onCheckout={() => { setIsBasketOpen(false); setIsCheckoutOpen(true); }}
      />

      <CheckoutSheet
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
      />
    </div>
  );
}
