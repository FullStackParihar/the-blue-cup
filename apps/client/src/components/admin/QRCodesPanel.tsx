import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";

export default function QRCodesPanel() {
  const [tableCount, setTableCount] = useState(10);
  const [baseUrl, setBaseUrl] = useState("");

  useEffect(() => {
    // If the admin opens this on localhost, the QR codes would incorrectly point to localhost.
    // We default to the local network IP to make scanning from mobile seamless.
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      setBaseUrl("http://10.111.210.108:5173");
    } else {
    setBaseUrl(window.location.origin);
    }
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const tables = Array.from({ length: tableCount }, (_, i) => i + 1);

  return (
    <div className="space-y-6">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)] no-print">
        <h2 className="text-xl font-display font-bold text-white mb-4">Generate Table QR Codes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-white/70 text-sm mb-2 font-body">Number of Tables</label>
            <input
              type="number"
              min="1"
              max="100"
              value={tableCount}
              onChange={(e) => setTableCount(Number(e.target.value) || 1)}
              className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent-gold"
            />
          </div>
          <div>
            <label className="block text-white/70 text-sm mb-2 font-body">Base URL</label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent-gold"
              placeholder="e.g. http://192.168.1.5:5173"
            />
            <p className="text-xs text-white/50 mt-1">Make sure this is accessible to your customers (e.g. your local IP or public domain).</p>
          </div>
        </div>

        <button
          onClick={handlePrint}
          className="bg-accent-gold hover:bg-gold-light text-primary-navy font-bold py-2 px-6 rounded-lg transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print QR Codes
        </button>
      </div>

      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 print:grid-cols-2 print:gap-12">
        {tables.map((table) => {
          const url = `${baseUrl}?table=${table}`;
          return (
            <div key={table} className="bg-white rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-lg print:break-inside-avoid print:shadow-none border border-gray-200">
              <h3 className="text-2xl font-display font-bold text-primary-navy mb-4">Table {table}</h3>
              <div className="bg-white p-2 rounded-xl mb-4">
                <QRCodeSVG value={url} size={150} level="H" includeMargin={true} />
              </div>
              <p className="text-xs text-gray-500 font-body break-all max-w-[200px]">Scan to order from The Blue Cup</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
