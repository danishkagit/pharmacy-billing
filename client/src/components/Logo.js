import React from 'react';

/*
  Single source of truth for CalcuttaRx product branding.
  (Calcutta Node is the developer/parent company — credited in page footers.)
  /logo.png       — square emblem artwork (transparent background), canonical asset
  /logo-mark.png  — tight-crop of the same emblem, trimmed to its bounding box,
                    sized for nav bars / favicons / app icons
*/

const LOGO_SRC = '/logo.png';
const LOGO_MARK_SRC = '/logo-mark.png';
const MARK_ASPECT = 1; // mark asset is a trimmed square canvas

/* Compact brand mark for nav bars and tight spaces. `size` = height in px.
   The artwork fills the tile edge-to-edge so it stays bold at small sizes. */
function Logo({ size = 32, className = '', title = 'CalcuttaRx' }) {
  return (
    <img
      src={LOGO_MARK_SRC}
      alt={title}
      title={title}
      draggable="false"
      className={`select-none object-contain rounded-lg bg-slate-50 dark:bg-slate-800 ring-1 ring-slate-900/10 dark:ring-white/10 shadow-sm flex-shrink-0 ${className}`}
      style={{ height: size, width: Math.round(size * MARK_ASPECT) }}
    />
  );
}

/* Emblem + wordmark lockup for auth panels & spacious areas. */
function LogoImage({ height = 48, className = '', light = false }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <img
        src={LOGO_MARK_SRC}
        alt="CalcuttaRx — Cloud Based Pharmacy Billing Software"
        draggable="false"
        className="select-none object-contain rounded-lg bg-slate-50 dark:bg-slate-800 ring-1 ring-slate-900/10 dark:ring-white/10 shadow-glow-sm"
        style={{ height }}
      />
      <BrandWordmark light={light} />
    </span>
  );
}

/* Text wordmark matching the logo's blue/green identity. */
function BrandWordmark({ className = '', light = false }) {
  return (
    <span
      className={`font-extrabold tracking-tight whitespace-nowrap ${light ? 'text-white' : 'text-slate-900 dark:text-white'} ${className}`}
    >
      Calcutta<span className={`font-extrabold ${light ? 'text-emerald-300' : 'brand-green'}`}>Rx</span>
    </span>
  );
}

export { Logo, LogoImage, BrandWordmark };
export default Logo;
