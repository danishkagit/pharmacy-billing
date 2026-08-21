import React from 'react';

function Logo({ size = 36, className = '', theme = 'light' }) {
  const isDark = theme === 'dark';
  const fill = isDark ? 'currentColor' : 'white';
  const borderColor = isDark ? '20' : '10';
  return (
    <div
      className={`inline-flex items-center justify-center rounded-xl border-2 border-slate-300/${borderColor} shadow-sm flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
      title="CalcuttaRx"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: size * 0.62, height: size * 0.62 }}
      >
        <path
          d="M12 4v16m-8-8h16"
          stroke={fill}
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="12" r="2.2" fill={fill} />
      </svg>
    </div>
  );
}

function LogoWordmark({ size = 34, compact = false, theme = 'light' }) {
  const isDark = theme === 'dark';
  const textColor = isDark ? 'text-slate-900' : 'text-white';
  const textColorDark = isDark ? 'text-slate-900' : 'text-white';
  return (
    <div className={`flex items-center gap-2.5 ${compact ? '' : 'min-w-0'}`}>
      <Logo size={size} theme={theme} />
      {!compact && (
        <div className="leading-tight">
          <span className={textColor} style={{ fontSize: size * 0.44 }}>
            Calcutta<span className="text-transparent bg-clip-text grad-brand">Rx</span>
          </span>
          <p className={textColorDark} className="text-[9px] text-slate-400 font-medium uppercase tracking-[0.16em] -mt-0.5">
            Pharmacy Suite
          </p>
        </div>
      )}
    </div>
  );
}

export { Logo, LogoWordmark };
export default Logo;
