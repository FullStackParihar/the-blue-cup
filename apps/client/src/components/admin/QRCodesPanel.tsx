import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";

export default function QRCodesPanel() {
  const [tables, setTables] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  const [newTableNum, setNewTableNum] = useState("");
  const [baseUrl, setBaseUrl] = useState("");

  useEffect(() => {
    // Default to the production Vercel URL, or window.location.origin if already deployed
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      setBaseUrl("https://the-blue-cup-client.vercel.app");
    } else {
      setBaseUrl(window.location.origin);
    }

    // Load tables from localStorage if they exist
    const storedTables = localStorage.getItem("tbc_active_tables");
    if (storedTables) {
      try {
        const parsed = JSON.parse(storedTables);
        if (Array.isArray(parsed) && parsed.every(item => typeof item === "number")) {
          const filtered = parsed.filter(num => num >= 1 && num <= 11).sort((a, b) => a - b);
          setTables(filtered);
        }
      } catch (err) {
        console.error("Failed to parse stored tables:", err);
      }
    }
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleAddTable = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(newTableNum);
    if (isNaN(num) || num < 1 || num > 11) {
      alert("Please enter a valid table number between 1 and 11.");
      return;
    }
    if (tables.includes(num)) {
      alert("This table number already exists in your list.");
      return;
    }
    const updated = [...tables, num].sort((a, b) => a - b);
    setTables(updated);
    localStorage.setItem("tbc_active_tables", JSON.stringify(updated));
    setNewTableNum("");
  };

  const handleDeleteTable = (num: number) => {
    if (confirm(`Are you sure you want to remove Table ${num}?`)) {
      const updated = tables.filter((t) => t !== num);
      setTables(updated);
      localStorage.setItem("tbc_active_tables", JSON.stringify(updated));
    }
  };

  return (
    <div className="space-y-8">
      {/* Configuration & Adding box */}
      <div className="bg-antique-cream/35 border border-border/50 rounded-3xl p-6 shadow-sm no-print">
        <h2 className="font-heading text-2xl text-primary-navy font-black uppercase tracking-tight mb-4">
          Manage Table Access Points
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Add Table form */}
          <form onSubmit={handleAddTable} className="space-y-2">
            <label className="block text-primary-navy/85 text-[10px] font-black uppercase tracking-widest">
              Add Table Number
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                max="11"
                value={newTableNum}
                onChange={(e) => setNewTableNum(e.target.value)}
                placeholder="e.g. 11"
                className="flex-1 bg-white border border-border/60 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-gold transition-all"
              />
              <button
                type="submit"
                className="bg-primary-navy text-white text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl hover:bg-gold transition-colors"
              >
                Add ＋
              </button>
            </div>
            <p className="text-[9px] text-muted font-medium">Enter a table number between 1 and 11.</p>
          </form>

          {/* Base URL info */}
          <div className="space-y-2 md:col-span-2">
            <label className="block text-primary-navy/85 text-[10px] font-black uppercase tracking-widest">
              Base Destination URL
            </label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="w-full bg-white border border-border/60 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:border-gold transition-all"
              placeholder="e.g. http://192.168.1.5:5173"
            />
            <p className="text-[9px] text-muted font-medium">
              Make sure this points to your local network IP or public domain so customers can scan it.
            </p>
          </div>
        </div>

        <button
          onClick={handlePrint}
          className="btn-primary py-3 px-6 text-[10px] uppercase tracking-widest font-black flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print All QR Codes 🖨️
        </button>
      </div>

      {/* Grid of Tables */}
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 print:grid-cols-2 print:gap-12">
        {tables.map((table) => {
          const url = `${baseUrl}?table=${table}`;
          return (
            <div
              key={table}
              className="bg-white rounded-3xl p-6 flex flex-col items-center justify-center text-center border border-border/40 shadow-sm relative group print:break-inside-avoid print:shadow-none"
            >
              {/* Delete button (only visible on hover and hidden when printing) */}
              <button
                onClick={() => handleDeleteTable(table)}
                className="absolute top-4 right-4 bg-alert-red/10 text-alert-red hover:bg-alert-red hover:text-white p-1.5 rounded-full transition-all opacity-0 group-hover:opacity-100 no-print text-[10px]"
                title="Remove Table"
              >
                ✕
              </button>

              <h3 className="font-heading text-2xl font-black text-primary-navy mb-4">Table {table}</h3>
              
              <div className="bg-white p-3 rounded-2xl border border-border/30 mb-4 shadow-sm">
                <QRCodeSVG value={url} size={150} level="H" includeMargin={true} />
              </div>
              
              <p className="text-[10px] text-muted font-semibold uppercase tracking-wider">
                Scan to Order
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
