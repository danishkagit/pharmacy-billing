# CalcuttaRx — Pharmacy Billing Suite

A full-featured **Pharmacy Billing & Inventory Management System** built for wholesalers and retailers. Handles GST 2.0 billing (Nil/5%/18%/40%), sales & purchases, batch-wise inventory with expiry tracking, prescription management, returns, and regulatory compliance — all in one dashboard.

**Live app:** https://pharmacybills.vercel.app

Built by [Calcutta Node.](https://calcuttanode.vercel.app/about) · Kolkata

## Features

### Billing & Sales
- Retail & wholesale sale invoices with itemized GST calculation (IGST/CGST/SGST)
- Batch-wise selection with automatic rate/mrp/gst lookup
- Cash, credit and UPI/card payment modes, credit days & outstanding tracking
- Sale returns and credit notes
- **Prescription attachment** — capture a photo (webcam/native camera) or upload an image/PDF against any retail invoice
- PDF invoice generation, GST e-invoice support

### Purchase & Inventory
- Purchase invoices, purchase orders and purchase returns
- Medicine catalog with brand lookup, HSN codes and GST rates
- Batch & expiry management, low-stock alerts and expiry dashboard
- Stock adjustments, inter-branch stock transfers
- Barcode generation (`bwip-js`) and medicine catalog import from CSV
- Multi-branch inventory with per-branch stock views

### Prescriptions & CRM
- Prescription registry with patient & doctor details, scheduled-drug validation
- Customer, supplier, salesman, doctor and patient management
- Loyalty points program
- SMS notifications (`SmsLog`)

### Reports & Compliance
- GSTR-1 and GSTR-3B reports, sales & profit-loss reports, outstanding report
- Narcotics register, drug schedule log, drug license manager
- Full audit trail of user actions
- Payments and expenses tracking, delivery orders

### Security & Access
- JWT authentication with role-based access control (RBAC)
- Password hashing, forgot-password / reset-password flow
- Multi-branch, multi-user staff management with granular permissions

## Tech Stack

| Layer     | Technology |
|-----------|------------|
| Frontend  | Next.js 14 (Pages Router), React 18, React Router, Tailwind CSS |
| Backend   | Node.js, Express, Mongoose (MongoDB) |
| Extras    | JWT auth, Multer uploads, PDFKit invoices, bwip-js barcodes, node-cron, IMAP email fetch, SMS |

## Getting Started

### Prerequisites
- Node.js >= 18
- MongoDB (local or Atlas)

### Installation

```bash
# clone
git clone https://github.com/danishkagit/pharmacy-billing.git
cd pharmacy-billing

# install dependencies
npm install
npm install --prefix server
npm install --prefix client
```

### Configure environment

Create `server/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://<host>/pharmacy
JWT_SECRET=change-me
```

### Seed default admin

```bash
npm run seed
# admin@calcuttarx.com / password123
```

### Run locally

```bash
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

## Deployment

- **Frontend** — Vercel (`vercel --prod`); set `NEXT_PUBLIC_API_URL` to the backend API URL.
- **Backend** — Render (or any Node host); `npm start` runs `server/server.js`; `uploads/` is served at `/uploads`.
- **Database** — MongoDB Atlas.

## Project Structure

```
├── server/                 # Express + Mongoose backend
│   ├── models/             # Mongoose schemas (SaleInvoice, Batch, Medicine, ...)
│   ├── routes/             # REST API routes (auth, saleInvoices, inventory, gst, ...)
│   ├── middleware/         # JWT auth, RBAC, upload
│   ├── uploads/            # Uploaded files (bill/prescription attachments)
│   ├── data/               # Medicine catalog data
│   └── server.js
├── client/                 # Next.js frontend (SPA)
│   ├── pages/              # Next.js pages router entry
│   └── src/
│       ├── pages/          # React Router page components
│       └── components/     # Shared UI components
└── render.yaml             # Render blueprint
```
