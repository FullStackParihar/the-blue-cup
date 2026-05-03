import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";

const categories = [
  { id: "Coffee", name: "Artisan Coffee", desc: "Hand-poured perfection from single-origin beans", icon: "☕", img: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=600&fit=crop" },
  { id: "Tea", name: "Premium Teas", desc: "Organic blends sourced from the finest gardens", icon: "🫖", img: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&h=600&fit=crop" },
  { id: "Pastry", name: "Fresh Pastries", desc: "Baked fresh every morning by our in-house chef", icon: "🥐", img: "https://images.unsplash.com/photo-1555507036-ab1f4038024a?w=800&h=600&fit=crop" },
  { id: "Sandwich", name: "Gourmet Bites", desc: "Savory delights crafted with local ingredients", icon: "🥪", img: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&h=600&fit=crop" },
];

const stats = [
  { label: "Years", value: "2+", sub: "of excellence" },
  { label: "Beans", value: "100%", sub: "single-origin" },
  { label: "Served", value: "10K+", sub: "happy cups" },
];

export default function HomePage() {
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 600], [0, 150]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);

  return (
    <div className="relative min-h-screen bg-antique-cream overflow-x-hidden">

      {/* ── HERO ── */}
      <section className="relative min-h-[100svh] flex items-center overflow-hidden">
        {/* Background Image */}
        <motion.div style={{ y: heroY }} className="absolute inset-0 -top-20">
          <img
            src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1600&h=1000&fit=crop"
            alt="The Blue Cup Cafe"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-primary-navy/70" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary-navy via-primary-navy/30 to-transparent" />
        </motion.div>

        {/* Content */}
        <motion.div style={{ opacity: heroOpacity }} className="relative z-10 w-full px-5 sm:px-8">
          <div className="max-w-6xl mx-auto pt-24 pb-16 sm:pt-32 sm:pb-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/15 mb-6 sm:mb-8"
            >
              <span className="w-2 h-2 rounded-full bg-accent-gold animate-pulse" />
              <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.3em] text-accent-gold font-black">Crafting Excellence Since 2026</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-heading font-black leading-[0.85] tracking-tighter text-white mb-6 sm:mb-8"
            >
              THE<br />
              <span className="text-gradient-gold">BLUE CUP</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="text-base sm:text-lg md:text-xl text-white/60 max-w-lg mb-10 sm:mb-12 leading-relaxed font-medium"
            >
              Where artisan traditions meet modern elegance. Skip the wait, savor the moment.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
              className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
            >
              <Link to="/menu" className="group px-8 sm:px-12 py-4 sm:py-5 bg-accent-gold text-primary-navy rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-[0.2em] shadow-gold hover:brightness-110 transition-all active:scale-95 flex items-center justify-center gap-2">
                Explore Menu
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </Link>
              <Link to="/orders" className="px-8 sm:px-12 py-4 sm:py-5 border-2 border-white/25 hover:border-accent-gold/60 text-white rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-[0.2em] transition-all active:scale-95 text-center backdrop-blur-sm">
                Track Order
              </Link>
            </motion.div>

            {/* Stats Row */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
              className="flex gap-8 sm:gap-14 mt-14 sm:mt-20 pt-8 border-t border-white/10"
            >
              {stats.map((s) => (
                <div key={s.label}>
                  <p className="font-heading text-3xl sm:text-4xl font-black text-white leading-none">{s.value}</p>
                  <p className="text-[9px] sm:text-[10px] font-black text-white/40 uppercase tracking-widest mt-1">{s.sub}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ── CATEGORY BENTO GRID ── */}
      <section className="relative z-10 py-16 sm:py-24 md:py-32 px-5 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 sm:mb-16">
            <div>
              <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="flex items-center gap-3 mb-4">
                <div className="h-[2px] w-8 bg-accent-gold" />
                <span className="text-[9px] font-black uppercase tracking-[0.4em] text-accent-gold">Our Menu</span>
              </motion.div>
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-heading font-black text-primary-navy tracking-tighter leading-[0.9]">
                Artisan<br />Collections
              </h2>
            </div>
            <Link to="/menu" className="btn-secondary px-8 py-4 text-[10px] uppercase tracking-[0.2em] font-black shrink-0 inline-flex items-center gap-2 group">
              View All
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-8">
            {categories.map((cat, i) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link
                  to={`/menu?category=${cat.id}`}
                  className="block group relative h-60 sm:h-72 md:h-80 rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden border border-border/60 shadow-soft hover:shadow-premium transition-all duration-500 hover:-translate-y-1"
                >
                  <img src={cat.img} alt={cat.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary-navy/80 via-primary-navy/20 to-transparent" />

                  <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-between">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-2xl sm:text-3xl group-hover:bg-accent-gold group-hover:border-accent-gold transition-all duration-500">
                      {cat.icon}
                    </div>
                    <div>
                      <p className="text-accent-gold text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] mb-2">{cat.id}</p>
                      <h3 className="text-2xl sm:text-3xl font-heading font-black text-white tracking-tight leading-none mb-2">{cat.name}</h3>
                      <p className="text-white/50 text-xs sm:text-sm font-medium max-w-[260px] line-clamp-2">{cat.desc}</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="relative z-10 py-16 sm:py-24 md:py-32 px-5 sm:px-8 bg-primary-navy">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14 sm:mb-20">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <div className="flex items-center justify-center gap-3 mb-5">
                <div className="h-[2px] w-8 bg-accent-gold" />
                <span className="text-[9px] font-black uppercase tracking-[0.4em] text-accent-gold">How It Works</span>
                <div className="h-[2px] w-8 bg-accent-gold" />
              </div>
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-heading font-black text-white tracking-tighter leading-[0.9]">
                Simple &amp; Seamless
              </h2>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-10">
            {[
              { num: "01", title: "Scan & Browse", desc: "Scan your table QR code or browse our curated menu digitally.", icon: "📱" },
              { num: "02", title: "Place Order", desc: "Add items to your basket and confirm with a single tap.", icon: "🛒" },
              { num: "03", title: "Track & Enjoy", desc: "Watch your order come to life with real-time status updates.", icon: "☕" },
            ].map((f, i) => (
              <motion.div
                key={f.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="group text-center sm:text-left p-8 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] bg-white/5 border border-white/10 hover:border-accent-gold/30 transition-all duration-500"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-accent-gold/10 border border-accent-gold/20 flex items-center justify-center text-3xl sm:text-4xl mb-6 mx-auto sm:mx-0 group-hover:bg-accent-gold/20 transition-colors">
                  {f.icon}
                </div>
                <p className="text-accent-gold text-[9px] font-black uppercase tracking-[0.3em] mb-3">Step {f.num}</p>
                <h3 className="text-xl sm:text-2xl font-heading font-black text-white mb-3 tracking-tight">{f.title}</h3>
                <p className="text-white/40 text-sm font-medium leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative z-10 py-16 sm:py-24 md:py-32 px-5 sm:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="card-premium p-10 sm:p-16 md:p-20 rounded-[2.5rem] sm:rounded-[3rem]"
          >
            <span className="text-5xl sm:text-6xl block mb-6">☕</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-black text-primary-navy tracking-tighter mb-4 leading-[0.95]">
              Ready to Experience<br /><span className="text-gradient-gold">The Blue Cup?</span>
            </h2>
            <p className="text-muted text-sm sm:text-base font-medium mb-8 sm:mb-10 max-w-md mx-auto">Join hundreds of happy customers. Your artisan coffee experience awaits.</p>
            <Link to="/menu" className="btn-gold inline-flex px-10 sm:px-14 py-4 sm:py-5 text-[10px] sm:text-xs uppercase tracking-[0.25em] font-black shadow-gold">
              Start Ordering
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-primary-navy text-white py-10 sm:py-14 px-5 sm:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left">
            <h3 className="font-heading text-xl font-black tracking-tight mb-1">The Blue Cup</h3>
            <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Est. 2026 • Artisan Cafe</p>
          </div>
          <div className="flex items-center gap-8">
            {["Home", "Menu", "Track"].map((l) => (
              <Link key={l} to={l === "Home" ? "/" : l === "Menu" ? "/menu" : "/orders"} className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-accent-gold transition-colors">
                {l}
              </Link>
            ))}
          </div>
          <p className="text-white/20 text-[10px] font-black uppercase tracking-wider">© 2026 The Blue Cup</p>
        </div>
      </footer>
    </div>
  );
}
