import React from "react";
import { motion } from "framer-motion";

export function CornerScrollwork({ className = "", rotation = 0 }: { className?: string; rotation?: number }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      {/* Outer borders */}
      <path d="M6 94 L6 6 C6 6, 6 6, 6 6 L94 6" stroke="#003171" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M12 88 L12 12 L88 12" stroke="#003171" strokeWidth="0.75" fill="none" strokeLinecap="round" />
      
      {/* Classic scroll swirls */}
      <path d="M12 25 C 18 32, 28 28, 28 20 C 28 12, 20 12, 12 12" stroke="#003171" strokeWidth="1.25" fill="none" />
      <path d="M25 12 C 32 18, 28 28, 20 28 C 12 28, 12 20, 12 12" stroke="#C9A84C" strokeWidth="1.25" fill="none" />
      
      <path d="M12 38 C 22 42, 30 32, 28 22 C 26 14, 16 18, 16 30" stroke="#003171" strokeWidth="1" fill="none" />
      <path d="M38 12 C 42 22, 32 30, 22 28 C 14 26, 18 16, 30 16" stroke="#003171" strokeWidth="1" fill="none" />

      {/* Main leaf scroll diagonal */}
      <path d="M12 12 C 30 30, 40 40, 55 55" stroke="#003171" strokeWidth="2" strokeLinecap="round" fill="none" />
      
      {/* Left gold leaf */}
      <path d="M28 28 C 24 33, 22 42, 25 46 C 28 49, 32 46, 32 42 C 32 35, 30 31, 30 31 Z" fill="#C9A84C" />
      {/* Right gold leaf */}
      <path d="M28 28 C 33 24, 42 22, 46 25 C 49 28, 46 32, 42 32 C 35 32, 31 30, 31 30 Z" fill="#C9A84C" />

      {/* Elegant tendrils */}
      <path d="M12 50 C 18 55, 22 52, 20 46" stroke="#003171" strokeWidth="0.75" fill="none" />
      <path d="M50 12 C 55 18, 52 22, 46 20" stroke="#003171" strokeWidth="0.75" fill="none" />
    </svg>
  );
}

export function ElegantFlourish({ className = "w-72 h-12" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 300 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M20 25 C50 15, 80 15, 110 23 C120 26, 130 28, 140 25 C145 23.5, 148 20, 150 15 C152 20, 155 23.5, 160 25 C170 28, 180 26, 190 23 C220 15, 250 15, 280 25"
        stroke="#003171"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* Central detailed ornament */}
      <path
        d="M130 25 C135 35, 142 40, 150 40 C158 40, 165 35, 170 25 C162 27, 158 29, 150 29 C142 29, 138 27, 130 25 Z"
        fill="#003171"
      />
      <path
        d="M115 24 C120 20, 125 18, 132 20 C138 22, 142 26, 150 26 C158 26, 162 22, 168 20 C175 18, 180 20, 185 24"
        stroke="#C9A84C"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Symmetrical leaves/scrolls */}
      <path d="M150 5 L150 12" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round" />
      <circle cx="150" cy="3" r="2.5" fill="#C9A84C" />
      
      {/* Additional classic scroll curves */}
      <path d="M90 22 C75 18, 60 20, 50 25 C45 27.5, 42 30, 48 30 C54 30, 58 24, 75 22" fill="#003171" opacity="0.8" />
      <path d="M210 22 C225 18, 240 20, 250 25 C255 27.5, 258 30, 252 30 C246 30, 242 24, 225 22" fill="#003171" opacity="0.8" />
    </svg>
  );
}

export function BlueCupSVG({ className = "w-40 h-40" }: { className?: string }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 120 120" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Sparkles/Stars */}
      {/* Left Star */}
      <path d="M24 72 L26 68 L24 64 L22 68 Z" fill="#C9A84C" className="animate-pulse" />
      {/* Right Top Star */}
      <path d="M94 48 L96 44 L94 40 L92 44 Z" fill="#C9A84C" className="animate-pulse [animation-delay:0.5s]" />
      {/* Right Bottom Star */}
      <path d="M102 78 L104 74 L102 70 L100 74 Z" fill="#C9A84C" className="animate-pulse [animation-delay:0.2s]" />
      
      {/* Steam lines */}
      <path d="M52 56 C46 45, 56 35, 48 22" stroke="#8C8575" strokeWidth="1.5" strokeLinecap="round" className="opacity-50" />
      <path d="M60 56 C54 40, 68 30, 58 14" stroke="#003171" strokeWidth="2.25" strokeLinecap="round" />
      <path d="M68 56 C62 45, 72 37, 66 24" stroke="#8C8575" strokeWidth="1.5" strokeLinecap="round" className="opacity-75" />

      {/* Saucer */}
      {/* Bottom shadow of saucer */}
      <ellipse cx="60" cy="94" rx="44" ry="8" fill="#8C8575" opacity="0.15" />
      {/* Outer Saucer */}
      <ellipse cx="60" cy="92" rx="44" ry="8" fill="#FCFAF5" stroke="#E8E0D0" strokeWidth="2" />
      {/* Inner Saucer Rim */}
      <ellipse cx="60" cy="92" rx="34" ry="5.5" fill="#E8E0D0" opacity="0.5" />
      {/* Cup Shadow on Saucer */}
      <ellipse cx="60" cy="91" rx="26" ry="4" fill="#8C8575" opacity="0.3" />

      {/* Cup Handle */}
      {/* Outer Handle */}
      <path d="M84 66 C102 66, 102 84, 84 84" stroke="#003171" strokeWidth="5.5" strokeLinecap="round" fill="none" />
      {/* Inner Handle (matches background for hollow effect) */}
      <path d="M84 66 C102 66, 102 84, 84 84" stroke="#FCFAF5" strokeWidth="1.5" strokeLinecap="round" fill="none" />

      {/* Cup Body */}
      {/* Main U-shape Cup */}
      <path d="M34 62 C34 88, 86 88, 86 62 Z" fill="#003171" stroke="#002255" strokeWidth="2" />
      {/* Cup Rim Edge (combines to form the top ellipse) */}
      <ellipse cx="60" cy="62" rx="26" ry="5" fill="#003171" stroke="#002255" strokeWidth="1.5" />

      {/* Coffee/Liquid Inside */}
      <ellipse cx="60" cy="62" rx="23" ry="3.5" fill="#5C3A21" />
      <ellipse cx="58" cy="62" rx="18" ry="2" fill="#8B5A2B" opacity="0.8" />

      {/* Cup Highlight */}
      <path d="M40 65 C40 82, 80 82, 80 65" stroke="#4488DD" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.3" />
    </svg>
  );
}

interface BrandCoverLogoProps {
  showBorder?: boolean;
  className?: string;
}

export default function BrandCoverLogo({ showBorder = true, className = "" }: BrandCoverLogoProps) {
  return (
    <div className={`relative flex flex-col items-center justify-center bg-warm-white p-8 sm:p-14 md:p-16 rounded-[2.5rem] shadow-premium select-none border border-border/40 overflow-hidden ${className}`}>
      
      {/* Textured vintage overlay background */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />
      
      {showBorder && (
        <>
          {/* Outer elegant borders */}
          <div className="absolute inset-4 sm:inset-6 border border-primary-navy/90 rounded-[1.8rem] pointer-events-none" />
          <div className="absolute inset-5 sm:inset-[30px] border border-primary-navy/30 rounded-[1.5rem] pointer-events-none" />

          {/* Ornate corner scrollworks */}
          <CornerScrollwork className="absolute top-4 left-4 sm:top-6 sm:left-6 w-12 h-12 sm:w-16 sm:h-16" rotation={0} />
          <CornerScrollwork className="absolute top-4 right-4 sm:top-6 sm:right-6 w-12 h-12 sm:w-16 sm:h-16" rotation={90} />
          <CornerScrollwork className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 w-12 h-12 sm:w-16 sm:h-16" rotation={270} />
          <CornerScrollwork className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 w-12 h-12 sm:w-16 sm:h-16" rotation={180} />
        </>
      )}

      {/* 1. Top Italic Title */}
      <motion.p
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1 }}
        className="font-heading italic text-xs sm:text-sm md:text-base text-primary-navy/80 text-center tracking-wide mb-2 sm:mb-3"
      >
        Where every cup tells a story
      </motion.p>

      {/* 2. Top Flourish */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="mb-4 sm:mb-6"
      >
        <ElegantFlourish className="w-56 h-8 sm:w-72 sm:h-10 text-primary-navy" />
      </motion.div>

      {/* 3. Central Blue Cup Illustration */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.3 }}
        className="relative w-36 h-36 sm:w-44 sm:h-44 md:w-48 md:h-48 flex items-center justify-center my-1 sm:my-2"
      >
        <div className="absolute inset-0 bg-accent-gold/5 rounded-full blur-2xl animate-pulse" />
        <BlueCupSVG className="w-full h-full drop-shadow-md hover:scale-105 transition-transform duration-500 cursor-pointer" />
      </motion.div>

      {/* 4. Brand Name - THE BLUE CUP */}
      <motion.h2
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.45 }}
        className="font-heading text-3xl sm:text-4xl md:text-5xl font-black text-primary-navy tracking-[0.18em] text-center uppercase leading-none mt-4 mb-2 sm:mb-3"
      >
        THE BLUE CUP
      </motion.h2>

      {/* 5. Subtitle Separator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="flex items-center justify-center gap-3 sm:gap-4 w-full max-w-[280px] sm:max-w-[340px] mb-6 sm:mb-8"
      >
        <div className="h-[1px] flex-1 bg-primary-navy/40" />
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[6px] text-accent-gold rotate-45 font-bold">✦</span>
          <span className="text-[9px] sm:text-[10px] text-primary-navy font-black tracking-[0.25em] uppercase">SIP OF ELEGANCE</span>
          <span className="text-[6px] text-accent-gold rotate-45 font-bold">✦</span>
        </div>
        <div className="h-[1px] flex-1 bg-primary-navy/40" />
      </motion.div>

      {/* 6. Bottom Script */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.7 }}
        className="font-heading italic text-lg sm:text-xl md:text-2xl text-primary-navy/90 text-center tracking-wide"
      >
        Sip. Relax. Repeat
      </motion.p>

    </div>
  );
}
