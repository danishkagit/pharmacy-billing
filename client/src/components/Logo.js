function Logo({ size = 36, className = '' }) {
  return (
    <img
      src="/logo.svg"
      alt="CalcuttaRx logo — Rx mortar-pestle with Howrah Bridge arc"
      width={size}
      height={size}
      className={`rounded-[27%] shadow-glow-sm ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

function LogoWordmark({ size = 34, compact = false }) {
  return (
    <div className={`flex items-center gap-2.5 ${compact ? '' : 'min-w-0'}`}>
      <Logo size={size} />
      {!compact && (
        <div className="leading-tight">
          <span className="text-white font-extrabold tracking-tight" style={{ fontSize: size * 0.44 }}>
            Calcutta<span className="text-transparent bg-clip-text grad-brand">Rx</span>
          </span>
          <p className="text-[9px] text-slate-500 font-medium uppercase tracking-[0.18em] -mt-0.5">Pharmacy Suite</p>
        </div>
      )}
    </div>
  );
}

export { Logo, LogoWordmark };
export default Logo;
