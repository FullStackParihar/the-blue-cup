import React from 'react';
import { motion } from 'framer-motion';

export default function Loader() {
  return (
    <div className="fixed inset-0 bg-antique-cream z-[9999] flex flex-col items-center justify-center">
      <div className="relative w-20 h-24 mb-10 mx-auto">
        {/* The Handle */}
        <div className="absolute -right-5 top-3 w-8 h-12 border-4 border-primary-navy border-l-0 rounded-r-2xl z-0" />
        
        {/* The Cup Body */}
        <div className="absolute inset-0 border-4 border-primary-navy rounded-b-3xl rounded-t-lg bg-warm-white overflow-hidden z-10 flex flex-col justify-end shadow-lg">
          {/* Liquid inside */}
          <motion.div
            initial={{ height: "0%" }}
            animate={{ height: ["5%", "85%", "5%"] }}
            transition={{ 
              duration: 3, 
              ease: "easeInOut", 
              repeat: Infinity 
            }}
            className="w-full bg-primary-navy relative"
          >
            {/* Simple wave effect on top of the liquid */}
            <motion.div 
              animate={{ x: ["0%", "-50%"] }}
              transition={{ duration: 2, ease: "linear", repeat: Infinity }}
              className="absolute -top-[6px] left-0 w-[200%] h-[6px] opacity-80 flex"
            >
              <div className="w-1/2 h-full rounded-[100%] bg-primary-navy -translate-y-1/2" />
              <div className="w-1/2 h-full rounded-[100%] bg-primary-navy -translate-y-1/2" />
            </motion.div>
          </motion.div>
        </div>
        
        {/* Steam */}
        <motion.div 
          animate={{ y: [-5, -25], opacity: [0, 0.8, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
          className="absolute -top-8 left-4 w-1.5 h-8 bg-muted rounded-full blur-[2px] z-20"
        />
        <motion.div 
          animate={{ y: [0, -30], opacity: [0, 0.6, 0], scale: [1, 1.5, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut", delay: 0.6 }}
          className="absolute -top-6 left-10 w-2 h-10 bg-muted rounded-full blur-[2px] z-20"
        />
        <motion.div 
          animate={{ y: [-2, -20], opacity: [0, 0.7, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut", delay: 1.2 }}
          className="absolute -top-7 right-4 w-1 h-6 bg-muted rounded-full blur-[2px] z-20"
        />
      </div>
      
      <div className="flex flex-col items-center gap-2">
        <motion.h2 
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-primary-navy font-heading font-bold tracking-[0.25em] text-sm uppercase ml-1"
        >
          The Blue Cup
        </motion.h2>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ y: [0, -4, 0], opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              className="w-1.5 h-1.5 bg-accent-gold rounded-full"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
