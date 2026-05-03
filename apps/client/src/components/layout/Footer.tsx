import { Link } from "react-router-dom";
import { GoldDivider } from "../decorations/LeafDecoration";

export default function Footer() {
  return (
    <footer className="bg-primary-navy text-antique-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-accent-gold/20 flex items-center justify-center">
                <span className="text-xl">☕</span>
              </div>
              <div>
                <span className="font-heading text-xl text-antique-cream">The Blue Cup Cafe</span>
                <p className="text-[10px] text-antique-cream/40 tracking-widest uppercase">Est. 2024</p>
              </div>
            </Link>
            <p className="text-antique-cream/40 text-sm font-body leading-relaxed mt-4">
              Artisan coffee, fresh pastries, and handcrafted beverages in a warm,
              welcoming atmosphere. Order ahead and skip the line.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-heading text-accent-gold text-sm uppercase tracking-wider mb-5">
              Quick Links
            </h3>
            <ul className="space-y-3">
              {[
                { to: "/menu", label: "Our Menu" },
                { to: "/cart", label: "Your Cart" },
                { to: "/orders", label: "Track Order" },
                { to: "/admin", label: "Staff Dashboard" },
              ].map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-antique-cream/40 hover:text-accent-gold text-sm font-body transition-colors duration-300 flex items-center gap-2 group">
                    <span className="w-1 h-1 rounded-full bg-accent-gold/30 group-hover:bg-accent-gold transition-colors" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Hours */}
          <div>
            <h3 className="font-heading text-accent-gold text-sm uppercase tracking-wider mb-5">
              Hours
            </h3>
            <ul className="space-y-3 text-sm font-body">
              {[
                { day: "Mon – Fri", time: "7:00 AM – 8:00 PM" },
                { day: "Saturday", time: "8:00 AM – 9:00 PM" },
                { day: "Sunday", time: "8:00 AM – 6:00 PM" },
              ].map((h) => (
                <li key={h.day} className="flex justify-between gap-4">
                  <span className="text-antique-cream/60 min-w-[5rem]">{h.day}</span>
                  <span className="text-antique-cream/40 whitespace-nowrap">{h.time}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <GoldDivider className="my-10" />

        <p className="text-center text-antique-cream/25 text-xs font-body">
          © {new Date().getFullYear()} The Blue Cup Cafe. Crafted with ❤️ and ☕
        </p>
      </div>
    </footer>
  );
}
