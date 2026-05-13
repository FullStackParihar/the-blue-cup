import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { socket } from "../../lib/socket";
import { motion, AnimatePresence } from "framer-motion";

export default function WhatsAppLinkPanel() {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [status, setStatus] = useState<"disconnected" | "ready" | "unauthenticated" | "loading">("loading");

  useEffect(() => {
    socket.on("whatsapp-qr", (qr: string) => {
      setQrCode(qr);
      setStatus("unauthenticated");
    });

    socket.on("whatsapp-status", (newStatus: any) => {
      setStatus(newStatus);
      if (newStatus === "ready") {
        setQrCode(null);
      }
    });

    return () => {
      socket.off("whatsapp-qr");
      socket.off("whatsapp-status");
    };
  }, []);

  return (
    <div className="card-premium p-8 h-full flex flex-col items-center justify-center text-center">
      <div className="mb-8">
        <div className="w-16 h-16 bg-leaf/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">📱</span>
        </div>
        <h2 className="text-xl font-heading text-primary-navy font-black tracking-tight mb-2">WhatsApp Automation</h2>
        <p className="text-muted text-xs font-medium max-w-xs mx-auto">
          Link your WhatsApp to send automated bills and PDFs directly to customers.
        </p>
      </div>

      <div className="relative w-64 h-64 bg-white rounded-3xl border-2 border-border/50 flex items-center justify-center overflow-hidden shadow-inner">
        <AnimatePresence mode="wait">
          {status === "ready" ? (
            <motion.div
              key="ready"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center"
            >
              <div className="w-20 h-20 bg-leaf rounded-full flex items-center justify-center mb-4 shadow-lg shadow-leaf/30">
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-leaf font-black uppercase tracking-[0.2em] text-[10px]">Connected & Ready</span>
            </motion.div>
          ) : qrCode ? (
            <motion.div
              key="qr"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4 bg-white"
            >
              <QRCodeSVG value={qrCode} size={200} level="H" includeMargin={true} />
              <p className="mt-4 text-[9px] font-black text-muted uppercase tracking-widest">Scan with WhatsApp</p>
            </motion.div>
          ) : (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center"
            >
              <div className="w-8 h-8 border-4 border-gold/20 border-t-gold rounded-full animate-spin mb-4" />
              <span className="text-muted font-black uppercase tracking-[0.2em] text-[10px]">
                {status === "loading" ? "Initializing Service..." : "Waiting for QR Code..."}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-3 w-full">
        <div className="flex items-center gap-3 p-3 bg-primary-navy/5 rounded-xl text-left border border-primary-navy/10">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-xs">📜</span>
          </div>
          <div>
            <p className="text-[10px] font-black text-primary-navy uppercase tracking-tighter">Automatic Bills</p>
            <p className="text-[9px] text-muted font-bold">Sent instantly on completion</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-primary-navy/5 rounded-xl text-left border border-primary-navy/10">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-xs">📎</span>
          </div>
          <div>
            <p className="text-[10px] font-black text-primary-navy uppercase tracking-tighter">PDF Attachments</p>
            <p className="text-[9px] text-muted font-bold">Includes formatted invoices</p>
          </div>
        </div>
      </div>
    </div>
  );
}
