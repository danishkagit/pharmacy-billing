import React from 'react';

/*
  Single source of truth for Calcutta Node branding.
  /logo.png       — full horizontal lockup (icon + name + tagline), white canvas
  /logo-mark.png  — icon-only crop derived from logo.png (cloud + prescription + capsule)
*/

const LOGO_SRC = '/logo.png';
const LOGO_MARK_SRC = '/logo-mark.png';
const MARK_ASPECT = 1; // mark asset is square (cloud + cross + capsule emblem)

/* Compact brand mark for nav bars and tight spaces. `size` = height in px. */
function Logo({ size = 32, className = '', title = 'Calcutta Node' }) {
  return (
    <img
      src={LOGO_MARK_SRC}
      alt={title}
      title={title}
      draggable="false"
      className={`select-none object-contain rounded-lg bg-white ring-1 ring-slate-900/10 shadow-sm flex-shrink-0 ${className}`}
      style={{ height: size, width: Math.round(size * MARK_ASPECT) }}
    />
  );
}

/* Full lockup (icon + "Calcutta Node" + tagline) for auth panels & spacious areas.
   The asset is whitespace-trimmed so it fills its container edge-to-edge. */
function LogoImage({ height = 48, className = '' }) {
  return (
    <img
      src={LOGO_SRC}
      alt="Calcutta Node — Cloud Based Pharmacy Billing Software"
      draggable="false"
      className={`select-none block w-auto rounded-lg bg-white shadow-glow-sm ${className}`}
      style={{ height }}
    />
  );
}

/* Text wordmark matching the logo's blue/green identity. */
function BrandWordmark({ className = '', light = false }) {
  return (
    <span
      className={`font-extrabold tracking-tight whitespace-nowrap ${light ? 'text-white' : 'text-slate-900 dark:text-white'} ${className}`}
    >
      Calcutta<span className={`font-medium ${light ? 'text-emerald-300' : 'brand-green'}`}> Node</span>
    </span>
  );
}

export { Logo, LogoImage, BrandWordmark };
export default Logo;
