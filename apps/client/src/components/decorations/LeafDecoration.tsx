export function LeafDecoration({ className = "", flip = false }: { className?: string; flip?: boolean }) {
  return (
    <svg
      className={`pointer-events-none select-none ${className}`}
      style={{ transform: flip ? "scaleX(-1)" : undefined }}
      viewBox="0 0 200 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M80 280C80 280 40 200 60 140C80 80 120 40 140 20C140 20 100 80 90 140C80 200 80 280 80 280Z" fill="#B5C49A" fillOpacity="0.3" />
      <path d="M100 260C100 260 70 190 85 130C100 70 130 30 150 10C150 10 120 70 110 130C100 190 100 260 100 260Z" fill="#8B9E6B" fillOpacity="0.25" />
      <path d="M60 290C60 290 30 230 45 170C60 110 80 60 95 30C95 30 70 100 60 160C50 220 60 290 60 290Z" fill="#A3B18A" fillOpacity="0.2" />
      <ellipse cx="120" cy="80" rx="8" ry="20" transform="rotate(-30 120 80)" fill="#8B9E6B" fillOpacity="0.15" />
      <ellipse cx="50" cy="200" rx="6" ry="15" transform="rotate(15 50 200)" fill="#B5C49A" fillOpacity="0.15" />
    </svg>
  );
}

export function SmallLeaf({ className = "" }: { className?: string }) {
  return (
    <svg className={`pointer-events-none ${className}`} viewBox="0 0 40 40" fill="none">
      <path d="M20 35C20 35 10 25 12 15C14 5 20 2 20 2C20 2 26 5 28 15C30 25 20 35 20 35Z" fill="#8B9E6B" fillOpacity="0.3" />
      <line x1="20" y1="35" x2="20" y2="5" stroke="#8B9E6B" strokeOpacity="0.2" strokeWidth="0.5" />
    </svg>
  );
}

export function GoldDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-accent-gold/30 to-transparent" />
      <SmallLeaf className="w-5 h-5 opacity-60" />
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-accent-gold/30 to-transparent" />
    </div>
  );
}
