import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "../../stores/cartStore";
import { useUserStore } from "../../stores/userStore";


export default function Navbar() {
  const location = useLocation();
  const totalItems = useCartStore((s) => s.getTotalItems());
  const tableNumber = useCartStore((s) => s.tableNumber);
  const setTableNumber = useCartStore((s) => s.setTableNumber);
  const { user, logout } = useUserStore();


  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isAdmin = location.pathname.startsWith("/admin");
  if (isAdmin) return null;

  return (
    <>
      <header className="sticky top-0 z-50 glass-morphism border-b border-border/50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo */}
          <div 
            onClick={() => {
              const now = Date.now();
              if (now - (window as any)._lastLogoClick < 500) {
                (window as any)._logoClicks = ((window as any)._logoClicks || 0) + 1;
                if ((window as any)._logoClicks >= 5) {
                  (window as any)._logoClicks = 0; // Reset
                  navigate("/admin/login");
                }
              } else {
                (window as any)._logoClicks = 1;
              }
              (window as any)._lastLogoClick = now;
            }}
            className="flex flex-col items-start z-50 group min-w-0 shrink cursor-pointer"
          >
            <h1 className="font-heading text-base sm:text-2xl text-primary-navy font-black leading-none tracking-tight group-hover:scale-105 transition-transform origin-left truncate">The Blue Cup</h1>
            <div className="flex items-center gap-1 mt-1 opacity-60">
              <span className="w-1 h-1 rounded-full bg-accent-gold shrink-0" />
              <span className="hidden min-[380px]:inline text-[9px] text-primary-navy font-black uppercase tracking-[0.2em] whitespace-nowrap">Est. 2026</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-10">
            {[
              { label: "Home", path: "/" },
              { label: "Menu", path: "/menu" },
              { label: "Live Tracker", path: "/orders" },
            ].map((link) => (
              <Link 
                key={link.path}
                to={link.path} 
                className={`font-body text-[10px] font-black uppercase tracking-widest transition-all relative py-1
                  ${location.pathname === link.path ? 'text-primary-navy' : 'text-muted hover:text-primary-navy'}
                `}
              >
                {link.label}
                {location.pathname === link.path && (
                  <motion.div layoutId="navline" className="absolute -bottom-1 left-0 right-0 h-0.5 bg-accent-gold rounded-full" />
                )}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1.5 sm:gap-4 z-50 shrink-0">
            {/* Table Number Selector */}
            <div className="flex items-center gap-1.5 sm:gap-2 bg-cream-dark border border-border rounded-xl px-2.5 sm:px-4 py-2 sm:py-2.5 shadow-soft hover:border-accent-gold/40 transition-colors">
              <span className="hidden min-[430px]:inline text-primary-navy text-[9px] font-black uppercase tracking-widest opacity-60">Table</span>
              <select
                value={tableNumber ?? ""}
                onChange={(e) => setTableNumber(e.target.value ? Number(e.target.value) : null)}
                className="bg-transparent text-primary-navy numeric-text text-sm focus:outline-none cursor-pointer w-9 sm:w-auto"
              >
                <option value="">--</option>
                {Array.from({ length: 30 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            {/* Cart Icon */}
            <Link to="/menu" className="relative w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center bg-primary-navy text-antique-cream rounded-xl hover:bg-navy-dark transition-all shadow-premium group">
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {totalItems > 0 && (
                <motion.span
                  key={totalItems}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="numeric-text absolute -top-1.5 -right-1.5 w-5 h-5 sm:w-6 sm:h-6 bg-accent-gold text-primary-navy text-[10px] rounded-full flex items-center justify-center shadow-premium border-2 border-white"
                >
                  {totalItems}
                </motion.span>
              )}
            </Link>

            {/* User Profile */}
            {user && (
              <div className="hidden sm:flex items-center gap-3 pl-2 border-l border-border/50 h-8">
                <div className="flex flex-col items-end">
                  <p className="text-[8px] font-black text-muted uppercase tracking-widest leading-none mb-1">Artisan</p>
                  <p className="text-[10px] font-black text-primary-navy leading-none truncate max-w-[80px]">{user.name || "Member"}</p>
                </div>
                <button 
                  onClick={logout}
                  className="w-8 h-8 rounded-lg bg-warm-white border border-border flex items-center justify-center text-muted hover:text-alert-red transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                </button>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden w-10 h-10 flex items-center justify-center border border-border rounded-xl text-primary-navy bg-warm-white transition-all shadow-soft active:scale-90">
              <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-[100] flex"
          >
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute inset-0 bg-primary-navy/40 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="absolute inset-y-0 right-0 w-[85%] max-w-sm bg-antique-cream shadow-2xl flex flex-col p-10"
            >
              <div className="flex items-center justify-between mb-16">
                <div className="flex flex-col">
                  <span className="font-heading text-2xl font-black text-primary-navy tracking-tighter uppercase">Nexus Menu</span>
                  <div className="h-1.5 w-12 bg-accent-gold mt-1 rounded-full" />
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="w-12 h-12 rounded-2xl bg-white border border-border flex items-center justify-center text-primary-navy shadow-soft">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Mobile Profile Section */}
              {user && (
                <div className="mb-10 p-5 bg-white rounded-[1.5rem] border border-border/50 shadow-soft flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-navy flex items-center justify-center text-accent-gold text-lg shadow-premium">
                    {user.name?.[0]?.toUpperCase() || "A"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[8px] font-black text-muted uppercase tracking-[0.2em] mb-1">Logged In As</p>
                    <p className="text-sm font-black text-primary-navy truncate">{user.name || user.email}</p>
                  </div>
                  <button onClick={logout} className="w-10 h-10 rounded-xl bg-alert-red/5 flex items-center justify-center text-alert-red active:bg-alert-red active:text-white transition-all">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                  </button>
                </div>
              )}

              <nav className="flex flex-col gap-10">
                {[
                  { label: "Home", path: "/", icon: "🏠" },
                  { label: "Menu", path: "/menu", icon: "📋" },
                  { label: "Live Tracker", path: "/orders", icon: "📡" },
                ].map((link, i) => (
                  <motion.div 
                    key={link.path}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Link 
                      onClick={() => setIsMobileMenuOpen(false)} 
                      to={link.path} 
                      className={`flex items-center gap-6 group ${
                        location.pathname === link.path ? 'text-accent-gold' : 'text-primary-navy'
                      }`}
                    >
                      <span className="text-3xl filter grayscale group-hover:grayscale-0 transition-all">{link.icon}</span>
                      <span className="font-heading text-4xl font-black tracking-tighter leading-none">{link.label}</span>
                    </Link>
                  </motion.div>
                ))}
              </nav>

              <div className="mt-auto pt-10 border-t border-border/40">
                <div className="flex items-center gap-4 bg-white p-6 rounded-[2rem] border border-border/50 shadow-premium">
                  <div className="w-14 h-14 rounded-2xl bg-accent-gold/10 border border-accent-gold/20 flex items-center justify-center text-accent-gold text-2xl font-black">
                    {tableNumber || "—"}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-muted uppercase tracking-[0.2em] mb-1">Active Station</span>
                    <span className="text-sm font-black text-primary-navy">
                      {tableNumber ? `Table ${tableNumber}` : "Not Assigned"}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
