import React from 'react';

function Logo({ size = 36, className = '', theme = 'light' }) {
  const isDark = theme === 'dark';
  const fill = isDark ? 'currentColor' : '#1e293b';
  const gradient = isDark
    ? 'linear-gradient(135deg, #0f766e 0%, #805ad5 100%)'
    : 'linear-gradient(135deg #64748b 0%, #cbd5e1 100%)';
  const borderColor = isDark ? '20' : '10';
  const shadow = isDark ? '0 4px 20px rgba(0,0,0,.4)' : '0 4px 14px rgba(0,0,0,.15)';
  return (
    <div
      className={`inline-flex items-center justify-center rounded-xl border-2 border-slate-300/${borderColor} ${shadow} flex-shrink-0 ${className}`}
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
  const textColor = isDark ? 'text-slate-900' : '#1e293b';
  const textColorDark = isDark ? 'text-slate-900' : '#64748b';
  return (
    <div className={`flex items-center gap-2.5 ${compact ? '' : 'min-w-0'}`}>
      <Logo size={size} theme={theme} />
      {!compact && (
        <div className="leading-tight">
          <span className={textColor} style={{ fontSize: size * 0.44 }}>
            Calcutta<span className="bg-clip-text transparent" style="background: linear-gradient(135deg, #0f766e, #805ad5)">Rx</span>
          </span>
          <p className={textColorDark} className="text-[9px] font-medium uppercase tracking-[0.12em] -mt-0.5">
            Pharmacy Suite
          </p>
        </div>
      )}
    </div>
  );
}

export { Logo, LogoWordmark };
export default Logo;