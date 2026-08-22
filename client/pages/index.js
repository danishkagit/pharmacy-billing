import Head from 'next/head';
import { BrandWordmark } from '../src/components/Logo';

// Server-rendered marketing landing — crawlable HTML for SEO.
// Authenticated users are bounced to /dashboard by the inline script below.
const SITE = 'https://pharmacybills.vercel.app';

const faqs = [
  {
    q: 'Does CalcuttaRx support the new GST 2.0 tax slabs?',
    a: 'Yes. The system applies Nil, 5%, 18% and 40% slabs automatically based on each medicine\u2019s HSN code and GST rate, calculates CGST/SGST or IGST correctly for intra-state and inter-state sales, and produces Rule 46 compliant tax invoices plus GSTR-1 and GSTR-3B report views.'
  },
  {
    q: 'Can I move my existing stock and party data into the software?',
    a: 'Yes. Import your medicine catalog, opening stock batches, customers and suppliers through simple CSV templates. Most shops complete migration in a single afternoon, and our team assists with your first import free of charge during onboarding.'
  },
  {
    q: 'What happens if the internet goes down at my counter?',
    a: 'CalcuttaRx is cloud-based, so billing needs an active connection. Any short outage pauses new bills but never loses saved data \u2014 everything up to that point is already stored securely. A backup mobile hotspot keeps most West Bengal counters billing without interruption.'
  },
  {
    q: 'Is it suitable for both retail counters and wholesale businesses?',
    a: 'Yes. Retail mode gives you fast POS billing with thermal receipts and prescription capture, while wholesale mode supports credit days, party-wise outstanding, bulk invoicing and delivery orders. Many distributor customers run both modes from the same account.'
  },
  {
    q: 'How does prescription attachment work?',
    a: 'At billing time, capture the patient\u2019s prescription using your webcam or phone camera, or upload an image or PDF. It is stored against the invoice in the prescription registry along with patient and doctor details, with scheduled-drug validation to keep dispensing compliant.'
  },
  {
    q: 'How much does it cost and is there a free trial?',
    a: 'You can start a free trial with no card required and explore every feature, including billing, inventory and reports. Paid plans are priced per shop with multi-branch discounts, and all plans include free onboarding, staff training and support in English, Hindi and Bengali.'
  }
];

const features = [
  {
    id: 'billing',
    h2: 'Fast Prescription Billing, Batch Tracking & Expiry Alerts',
    icon: 'cash-register',
    body: 'Ring up a sale in seconds with itemized CGST/SGST or IGST calculated per item. Every invoice follows the Rule 46 tax invoice format, prints on your thermal POS printer, and can be issued as a PDF or GST e-invoice when required.',
    bullets: [
      'Retail and wholesale invoices with automatic rate, MRP and GST lookup by batch',
      'Cash, credit, UPI and card payment modes, including split payments on one bill',
      'Hold and recall bills at the counter when customers are still shopping',
      'Sale returns and credit notes linked back to the original invoice',
      'Prescription photo attached to any retail invoice before dispatch'
    ]
  },
  {
    id: 'gst',
    h2: 'GST Compliance & Filing-Ready Reports for Chemists',
    icon: 'file-invoice-dollar',
    body: 'Stop rebuilding spreadsheets before every GST due date. Generate GSTR-1 and GSTR-3B report views directly from your invoices, with HSN-wise summaries, B2B/B2C splits and credit notes \u2014 exportable as CSV for your accountant.',
    bullets: [
      'GSTR-1 and GSTR-3B report views rebuilt from actual sales data',
      'HSN/rate-wise tax summary with Table 12 bifurcation (B2B/B2C)',
      'Credit notes (CDNR) captured automatically against original invoices',
      'E-invoice IRN and e-way bill workflow above statutory thresholds'
    ]
  },
  {
    id: 'inventory',
    h2: 'Purchase & Stock Management With Supplier Ledger',
    icon: 'boxes-stacked',
    body: 'Know exactly which batch sold, which is expiring next month, and which shelf needs a reorder \u2014 before losses happen. Free-scheme quantities, landed costs and supplier dues stay visible from one dashboard.',
    bullets: [
      'Batch-level purchase, sale and return tracking with expiry dates on every entry',
      'Expiry dashboard and low-stock alerts so near-expiry stock never surprises you',
      'Free quantity and scheme discounts handled natively on purchase bills',
      'Barcode label generation and CSV/AI import of your full medicine catalog',
      'Stock adjustments, physical checks and inter-branch transfers'
    ]
  },
  {
    id: 'reports',
    h2: "Owner Reports: Sales, Outstanding & Profit-Loss",
    icon: 'chart-line',
    body: 'See today\u2019s sales from your phone, chase party-wise udhaar before month-end, and know your real margins per branch \u2014 without waiting for the accountant.',
    bullets: [
      'Sales, profit-and-loss and item-wise margin reports at branch level',
      'Outstanding khata with credit days and party-wise dues tracking',
      'Payments and expenses recorded against suppliers and parties',
      'Multi-branch consolidation for chains running more than one shop'
    ]
  }
];

export default function Landing() {
  return (
    <>
      <Head>
        <title>Cloud-Based Chemist POS &amp; Billing Software | CalcuttaRx</title>
        <meta name="description" content="Run your chemist shop on the cloud. GST 2.0 billing, batch-wise inventory, expiry alerts and GSTR-1/3B reports — built for pharmacies in West Bengal." />
        <link rel="canonical" href={SITE + '/'} />
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large" />
      </Head>

      {/* Bounce logged-in users straight into the app */}
      <script dangerouslySetInnerHTML={{ __html: `try{if(localStorage.getItem('token'))location.replace('/dashboard')}catch(e){}` }} />

      {/* Structured data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'SoftwareApplication',
            name: 'CalcuttaRx',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web',
            url: SITE + '/',
            description: 'Cloud pharmacy billing and GST inventory software for chemists and medical stores. GST 2.0 invoices, batch/expiry tracking, GSTR-1/3B reports.',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR', description: 'Free trial. Paid plans per shop.' },
            publisher: { '@id': SITE + '/#org' }
          },
          {
            '@type': 'Organization',
            '@id': SITE + '/#org',
            name: 'Calcutta Node',
            url: 'https://calcuttanode.vercel.app/about',
            foundingDate: '2025',
            founder: { '@type': 'Person', name: 'Danish Shoaib' },
            address: { '@type': 'PostalAddress', addressLocality: 'Kolkata', addressRegion: 'West Bengal', addressCountry: 'IN' },
            sameAs: ['https://www.instagram.com/calcuttanode/', 'https://www.linkedin.com/in/danishshoaib-in/', 'https://danishkagit.github.io/portfolio/']
          },
          {
            '@type': 'FAQPage',
            mainEntity: faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } }))
          }
        ]
      }) }} />

      <div className="min-h-screen grad-mesh">
        {/* Nav */}
        <header className="max-w-6xl mx-auto flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="CalcuttaRx logo" className="h-11 w-auto rounded-lg bg-white shadow-glow-sm" />
            <BrandWordmark className="text-lg" />
          </div>
          <nav className="flex items-center gap-2">
            <a href="/login" className="btn btn-secondary btn-sm">Sign In</a>
            <a href="/register" className="btn btn-primary btn-sm">Start Free</a>
          </nav>
        </header>

        {/* Hero */}
        <section className="max-w-4xl mx-auto text-center px-5 pt-14 pb-16">
          <span className="chip chip-teal inline-flex mb-5"><i className="fas fa-bolt mr-1"></i>GST 2.0 Ready · Built in Kolkata</span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.1] text-slate-900">
            Cloud-Based Chemist POS &amp; Billing Solution in{' '}
            <span className="text-transparent bg-clip-text grad-hero animate-gradient-x">West Bengal</span>
          </h1>
          <p className="mt-5 text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            CalcuttaRx replaces your cash memo book and desktop billing tool with one fast cloud counter —
            GST 2.0 invoices, batch-wise stock with expiry tracking, prescriptions, and filing-ready GSTR
            reports, from a single login you can open anywhere.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a href="/register" className="btn btn-primary btn-glow px-7 py-3 text-base"><i className="fas fa-store mr-1.5"></i>Start Free Trial</a>
            <a href="https://wa.me/918584885450?text=Hi!%20I%20want%20a%20CalcuttaRx%20demo%20for%20my%20pharmacy." target="_blank" rel="noopener noreferrer" className="btn btn-secondary px-7 py-3 text-base"><i className="fab fa-whatsapp mr-1.5" style={{ color: '#25D366' }}></i>Book a Free Demo</a>
          </div>
          <p className="mt-4 text-xs text-slate-400">No card required. Set up your counter in one day with free onboarding and staff training.</p>
        </section>

        {/* Trust strip */}
        <section className="max-w-5xl mx-auto px-5 pb-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              ['shield-halved', 'GST 2.0 ready — Nil, 5%, 18% and 40% slabs applied automatically on every invoice'],
              ['receipt', 'Rule 46 compliant tax invoices on thermal 80mm, A4 or A5'],
              ['boxes-stacked', 'Import your existing medicine stock list and start billing the same day'],
              ['laptop-mobile', 'Runs in any browser — desktop, laptop or tablet at the sales counter'],
              ['database', 'Role-based access so only your staff see your data'],
              ['headset', 'Free onboarding and support in English, Hindi and Bengali']
            ].map(([icon, text], i) => (
              <div key={i} className="glass-card p-4 flex items-start gap-3">
                <i className={`fas fa-${icon} text-pharma-500 mt-1`}></i>
                <span className="text-sm text-slate-600 font-medium">{text}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="features" className="max-w-5xl mx-auto px-5 pb-20 space-y-16">
          {features.map(f => (
            <div key={f.id} id={f.id} className="glass-card p-7 md:p-9">
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
                <span className="color-block color-block-md grad-brand text-white"><i className={`fas fa-${f.icon}`}></i></span>
                {f.h2}
              </h2>
              <p className="mt-4 text-slate-600 leading-relaxed max-w-3xl">{f.body}</p>
              <ul className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2.5">
                {f.bullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <i className="fas fa-circle-check text-emerald-500 mt-0.5"></i>{b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        {/* Who it's for */}
        <section id="who" className="max-w-5xl mx-auto px-5 pb-20">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 mb-6 text-center">Built for Every Kind of Chemist Counter in West Bengal</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              ['store', 'Retail Chemists', 'Fast counter billing, prescription capture and expiry control for single-shop pharmacies.'],
              ['truck', 'Wholesale Distributors', 'Credit days, party-wise outstanding and bulk invoicing with GST-ready documentation.'],
              ['hospital-user', 'Hospital Dispensaries', 'Patient-linked dispensing with scheduled-drug validation and audit trails.'],
              ['code-branch', 'Multi-Branch Chains', 'One owner login, per-branch stock, consolidated sales and profit reporting.']
            ].map(([icon, t, d], i) => (
              <div key={i} className="app-card app-card-hover p-5">
                <div className="color-block color-block-md grad-accent-soft text-pharma-600 mb-3"><i className={`fas fa-${icon}`}></i></div>
                <h3 className="font-bold text-slate-800">{t}</h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-3xl mx-auto px-5 pb-20">
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 mb-6 text-center">Questions Chemists Ask Before Switching</h2>
          <div className="space-y-3">
            {faqs.map((f, i) => (
              <details key={i} className="glass-card p-5 group">
                <summary className="cursor-pointer font-semibold text-slate-800 text-sm list-none flex items-center justify-between gap-3">
                  {f.q}
                  <i className="fas fa-chevron-down text-xs text-slate-400 group-open:rotate-180 transition-transform"></i>
                </summary>
                <p className="mt-3 text-sm text-slate-600 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="max-w-4xl mx-auto px-5 pb-24 text-center">
          <div className="rounded-3xl grad-hero animate-gradient-x p-10 md:p-14 shadow-glow">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Move your counter to the cloud this week.</h2>
            <p className="text-white/85 mt-3 max-w-xl mx-auto">Free migration help, staff training and WhatsApp support — from your neighbourhood software team in Kolkata.</p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <a href="/register" className="btn bg-white text-emerald-700 hover:bg-emerald-50 px-8 py-3 text-base font-bold"><i className="fas fa-arrow-right mr-1.5"></i>Create Free Account</a>
              <a href="/login" className="btn border border-white/60 text-white hover:bg-white/10 px-8 py-3 text-base">Sign In</a>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/60 bg-white/50 backdrop-blur-md">
          <div className="max-w-5xl mx-auto px-5 py-10 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <img src="/logo.png" alt="CalcuttaRx logo" className="h-9 w-auto rounded-md bg-white" />
                <BrandWordmark className="text-base" />
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">Pharmacy billing software Kolkata chemists trust — cloud GST invoicing, batch-wise inventory and compliance for medical stores across West Bengal.</p>
            </div>
            <div>
              <p className="font-bold text-slate-700 mb-2 text-xs uppercase tracking-wider">Product</p>
              <ul className="space-y-1.5 text-xs text-slate-500">
                <li><a className="hover:text-pharma-600" href="#billing">GST Billing &amp; POS</a></li>
                <li><a className="hover:text-pharma-600" href="#inventory">Batch &amp; Expiry Inventory</a></li>
                <li><a className="hover:text-pharma-600" href="#reports">GSTR-1 / GSTR-3B Reports</a></li>
                <li><a className="hover:text-pharma-600" href="/login">Customer Login</a></li>
              </ul>
            </div>
            <div>
              <p className="font-bold text-slate-700 mb-2 text-xs uppercase tracking-wider">Company</p>
              <ul className="space-y-1.5 text-xs text-slate-500">
                <li>A <a className="font-semibold text-slate-700 hover:text-pharma-600" href="https://calcuttanode.vercel.app/about" rel="noopener noreferrer">Calcutta Node SaaS Product</a> · Kolkata</li>
                <li><a className="hover:text-pharma-600" href="https://wa.me/918584885450" rel="noopener noreferrer">WhatsApp Support</a></li>
                <li><a className="hover:text-pharma-600" href="https://www.instagram.com/calcuttanode/" rel="noopener noreferrer">Instagram</a> · <a className="hover:text-pharma-600" href="https://www.linkedin.com/in/danishshoaib-in/" rel="noopener noreferrer">LinkedIn</a></li>
                <li><a className="hover:text-pharma-600" href="mailto:calcuttanode@gmail.com">calcuttanode@gmail.com</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/70 py-4 text-center text-[11px] text-slate-400">
            © {new Date().getFullYear()} CalcuttaRx · Powered by CalcuttaRx Cloud Billing · A Calcutta Node SaaS Product · Kolkata, West Bengal
          </div>
        </footer>
      </div>
    </>
  );
}
