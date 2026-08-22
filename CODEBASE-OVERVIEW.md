# Codebase Overview: PharmacyBilling

## Directory Structure (client source)
- `client/src/App.js` – Router wrapper with `ProtectedRoute`
- `client/src/index.css` – Custom design system + Tailwind directives
- `client/src/components/Layout.js` – Main layout (sidebar → top nav under audit)
- `client/src/components/Logo.js` – Logo component + BrandWordmark
- `client/src/components/LogoImage.js` – Full lockup image render
- `client/src/pages/` – Next.js page components (Login, Register, Forgot, Dashboard, SaleInvoice*, etc.)
- `client/src/pages/index.js` – Landing/SEO page
- `client/src/context/AuthContext.js`, `ThemeContext.js` – React context providers
- `client/src/utils/api.js`, `gst.js` – Helper functions
- `client/public/logo.png` – Full lockup asset (1536×1024) – canonical brand asset
- `client/public/logo-mark.png` – Cropped icon-only asset (620×430) for nav
- `client/public/logo.svg` – (deleted; not referenced; favicon/og now use .png)
- `server/` – Node/Express + MongoDB backend (not in this audit scope)

## Tech Stack
- **Framework:** Next.js 14 (Pages Router) – SSR landing page + SPA under `pages/[...slug]`
- **UI:** React 18 + react‑router‑dom v6 + Tailwind CSS 3.4
- **Styling:** Tailwind utilities + hand‑written `index.css` design‑system (tokens, gradients, shadows)
- **Backend:** Node.js + Express + Mongoose (MongoDB) – JWT auth, RBAC
- **Assets:** Font Awesome 6.5.1 CDN, Google Fonts (Manrope, Plus Jakarta Sans, Inter)
- **Deploy:** Vercel (client) + Render (server)

## Key Data Flows
1. **Landing SEO:** `pages/index.js` renders static HTML, meta tags, og:image (`/logo.png`), favicon (`/logo.png`).
2. **Auth flow:** `LoginPage` → `useAuth` → `ProtectedRoute` → `Layout`.
3. **Top navigation:** Previously a left sidebar (`Layout.js`); now being refactored to horizontal top nav with dropdown menus (desktop) and slide‑down drawer (mobile).
4. **Brand assets:** `logo.png` (full lockup) used for favicon/og/Landing; `logo-mark.png` (icon only) used in top nav; `BrandWordmark` component renders “CalcuttaRx” with brand blue/green.
5. **Routing:** Public routes: `/login`, `/register`, `/forgot-password`. Protected under `Layout`: `/dashboard`, `/sales`, `/purchases`, `/stock-*`, `/gst/*`, `/reports/*`, company/branch/staff/settings, etc.

## Recent Changes (uncommitted – local working tree)
- Trimmed `logo.png` whitespace, regenerating a tighter crop (1284×743).
- Rewrote `Layout.js` from left sidebar to horizontal top navigation with hover‑intent dropdowns, mobile drawer, breadcrumbs, quick‑action pills, user menu.
- Updated `Logo.js` to export `Logo`, `LogoImage`, `BrandWordmark`; `BrandWordmark` uses solid brand colors (`#005A9C`, `#43A047`) instead of the old `grad‑clip‑text` gradient (which conflicted with gradient backgrounds).
- Updated `index.css`: replaced `.sidebar*` with `.topnav`, `.nav-tab`, `.nav-dropdown`, `.nav-drop-item`, `.subbar`, `.quick-pill`; added brand‑color utilities (`brand‑blue`, `brand‑green`); added reduced‑motion/focus‑visible polish; removed dead `.sidebar‑collapsed`, `.mobile‑bottom‑nav`, `.topbar` rules.
- Fixed brand‑text clipping: removed legacy `.grad‑*` CSS rules that used the `background:` shorthand (which resets `background‑clip`); now all `.grad‑*` rules use `background‑image` only, safe with `bg‑clip‑text`.
- Fixed `LoginPage` crash – added missing `Logo` import.
- Aligned README version from `v2.0` to `v2.5`.
- Fixed `_document.js` theme‑color and asset references.

## Workspace Mode & Appearance Release (v2.6)
Competitor-informed upgrade (DrugERP dual-desk, ArogamOS retailer/wholesale toggle, JedMee role views, LOGIC ERP customisation, Nixfarma themes/accessibility):

### Retail ⇄ Wholesale separation
- **New `context/WorkspaceContext.js`** — per-device "workspace desk" (`retail` | `wholesale`), persisted in `localStorage('crx_workspace_mode')`, auto-clamped to the company's `drugLicenseCategory` (`retail` / `wholesale` / `both`). Exposes `mode, setMode, toggleMode, availableModes, isDual, meta`.
- `Layout.js` — segmented Retail/Wholesale switcher in the desktop header + dedicated Workspace section in the mobile drawer; single-desk licenses show a static desk capsule instead.
- `Dashboard.js` — fully mode-aware: wholesale desk swaps KPI #2 to *Purchases this month* (uses existing `/reports/dashboard` `monthPurchases`), adds a **Supply Snapshot** card (suppliers, month inward ₹k, sales−purchase) plus PO/Transfer/Expense quick pills, and reorders quick actions (B2B Invoice → Purchase → Purchase Order → Supplier → Delivery → GSTR-1). Retail keeps counter actions (Sale/Purchase/Medicine/Prescription/Customer/GSTR-1). Bottom Quick Stats swap Customers↔Suppliers and Monthly Bills↔Month Inward.
- `SaleInvoiceCreate.js` — initial invoice type now honours `?type=retail|wholesale` query param, then falls back to the active workspace desk.
- `RegisterPage.js` — new **Business Type** selector (Retail / Wholesale / Both) at signup; `server/routes/auth.js` persists it as `drugLicenseCategory`.

### Customizable settings & theming
- `ThemeContext.js` — new persisted **accent** preference (`crx_accent`): Clinical Emerald, Trust Blue, Royal Violet, Herbal Amber; applies `data-accent` on `<html>`.
- `index.css` — full per-accent light/dark `--accent-*` token overrides; `btn-primary`, `tile-sale`, nav active underline now accent-driven via vars; added missing `.status-chip(-success/info/warning/danger)` styles; added `.stagger` entrance animation; mobile polish (16px inputs vs iOS zoom, ≥40px tap targets on coarse pointers, safe-area inset).
- `Settings.js` — new first-class **Workspace** tab: default desk picker (dual licenses) + appearance panel (light/dark toggle, accent swatches with live hex).

### Branding & cross-platform visibility
- Generated missing `public/logo-mark.png` (square 1:1 crop source of `logo.png`); fixed `Logo.js` `MARK_ASPECT` to 1.
- Fixed two pre-existing build-breaking bugs in `Logo.js` (unclosed `<img …>` tag; stray `font-medium` attribute outside className).
- `_document.js` — added `application-name`, `apple-mobile-web-app-title/capable`, `mobile-web-app-capable`, `msapplication-TileColor`, sized favicons (`32x32` logo.png, `192x192` logo-mark.png), 180×180 apple-touch-icon, OG image dimensions + alt text for social previews.

---
*End of Overview*