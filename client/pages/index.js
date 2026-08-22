import Head from 'next/head';
import { useState, useEffect, useRef } from 'react';
import { BrandWordmark } from '../src/components/Logo';

const SITE = 'https://pharmacybills.vercel.app';

// ── SEO-optimized FAQs — long-tail keyword targeted ─────────────────────
const faqs = [
  { q: 'Is this GST 2.0 pharmacy billing software ready for Nil/5%/18%/40% slabs?', a: 'Yes — CalcuttaRx is GST 2.0 ready pharmacy billing software. It auto-picks Nil, 5%, 18% and 40% by HSN, applies CGST/SGST for West Bengal and IGST out-of-state, prints Rule 46 invoices, and exports GSTR-1, GSTR-3B & HSN Table 12 for your CA — no manual math.' },
  { q: 'Can you move my old stock & party data from Marg or Tally?', a: 'That\u2019s our job. Send us your CSV / Excel / Marg backup. We import medicines, batches with expiry, customers & suppliers. Most Kolkata shops start billing the same day. First import is free with onboarding — no data entry operator needed.' },
  { q: 'What if my internet goes down at the counter?', a: 'CalcuttaRx is cloud pharmacy billing software, so billing needs internet. But saved data is never lost — every bill is auto-saved. For short cuts, a \u20B9150 mobile hotspot keeps you billing. Unlike desktop dongles that crash and lose the day\u2019s sale, your GSTR data stays safe.' },
  { q: 'Can CalcuttaRx handle wholesale pharmacy billing and retail POS together?', a: 'Yes — same login runs retail POS (3-second thermal billing) and wholesale pharmacy billing (bulk invoices, credit/udhaar khata, party-wise outstanding, delivery challans, scheme & free quantity). Switch modes instantly — ideal for Bagri Market distributors and College Street wholesalers.' },
  { q: 'Do you support Schedule H and H1 prescription tracking for medical stores?', a: 'Yes — every bill links patient + doctor + prescription photo (webcam/phone/PDF) to the invoice. This Schedule H software flags Schedule H/H1 drugs at billing, keeps a searchable prescription registry for inspection, and stores data audit-logged per branch.' },
  { q: 'What is pharmacy billing software price in Kolkata? Is there a free trial?', a: 'Start free for 14 days — no card. Then pharmacy billing software price is \u20B9799/shop/mo (Starter, 1 branch) or \u20B91,299 for wholesale + retail (Growth, 5 users) when billed yearly — save 20%. Includes GST 2.0 billing, batch & expiry tracking, GSTR-1/3B, prescription registry and Bangla/Hindi/English support. Chain plans custom. No hidden AMC, no invoice caps like Marg.' },
  // ── New long-tail FAQs for comparison & specialty intent ────────────
  { q: 'Marg vs CalcuttaRx — which pharmacy billing software is better for Kolkata chemists?', a: 'Marg needs dongle/AMC and manual GST 2.0 updates; CalcuttaRx is cloud pharmacy billing software with auto Nil/5%/18%/40% by HSN, no dongle, free data import from Marg/Tally, and WhatsApp support in Bangla. Pricing from \u20B9799 vs Marg \u20B912k+/yr AMC. Most Bengal shops switch in one afternoon.' },
  { q: 'How does batch and expiry tracking work? Will it alert before medicines expire?', a: 'This batch expiry tracking software captures batch number + expiry on every purchase. The dashboard flags stock expiring in 30/60/90 days, batch-wise and rack-wise, with auto return list to supplier — shops save \u20B92–3 lakh yearly. Works for barcode scan and bulk Excel import.' },
  { q: 'Is CalcuttaRx pharmacy inventory software good for 2–20 store chains?', a: 'Yes — pharmacy inventory software with multi-branch stock transfer, per-branch profit, central khata, role permissions and audit log. See Siliguri \u2192 Jalpaiguri transfers in one click, track daily sale branch-wise on mobile, one owner login for all counters across West Bengal.' },
  { q: 'Which pharmacy POS software is best for GST filing for medical stores?', a: 'CalcuttaRx is built for medical store GST filing — one-click GSTR-1 & GSTR-3B, HSN Table 12 with B2B/B2C split, CDNR credit notes, and e-Invoice IRN. Your CA gets a ready CSV, no Excel rework. 98% of users file on time vs 60% with manual khata.' },
  { q: 'Do you provide on-site training and Bengali support in Kolkata and Howrah?', a: 'Yes — free onboarding and staff training in Kolkata, Howrah, Hooghly, Siliguri, Durgapur and across West Bengal — in Bangla, Hindi and English. We import your Marg data, train your cashier at the counter, and stay on WhatsApp (85848 85450) for daily support.' },
];

const features = [
  {
    id: 'billing',
    label: 'Billing',
    h2: 'Pharmacy POS & Billing Software — 3-Second Counter Billing for Medical Stores',
    icon: 'cash-register',
    body: 'Pharmacy POS billing that works like you think — type, scan, done. MRP, rate and GST 2.0 pulled by batch automatically. Prints Rule 46 invoices clean, passes scrutiny, and keeps the queue moving even in the evening rush.',
    bullets: ['Pharmacy POS billing — scan barcode or type 2 letters, batch & MRP auto-filled', 'Never collect wrong GST — Nil/5%/18%/40% + CGST/SGST or IGST auto for Bengal & outside', 'Take money any way they pay — cash, UPI, card, split-bill & udhaar khata on one invoice', 'Hold & recall rush-hour bills in one click — park, serve next, come back', 'Sale returns & credit notes linked to original bill for GST CDNR'],
  },
  {
    id: 'gst',
    label: 'GST',
    h2: 'GST Billing Software for Pharmacy — GSTR-1 & GSTR-3B Before Your CA Asks',
    icon: 'file-invoice-dollar',
    body: 'No more late-night Excel for GST filing. This GST billing software for pharmacy builds your GSTR-1 and GSTR-3B views from real invoices — HSN-wise Table 12, B2B/B2C split, credit notes included. Export CSV and send to your CA.',
    bullets: ['One-click GSTR-1 & GSTR-3B views — no formula errors, no re-typing for medical stores', 'HSN Table 12 + B2B/B2C split + CDNR — CA-ready for portal upload', 'e-Invoice IRN & e-way bill triggered only when you cross the threshold', 'CGST/SGST for West Bengal, IGST for inter-state — auto by HSN slab'],
  },
  {
    id: 'inventory',
    label: 'Inventory',
    h2: 'Pharmacy Inventory Software — Batch & Expiry Tracking That Saves Lakhs',
    icon: 'boxes-stacked',
    body: 'Pharmacy inventory software that knows which batch sold, which is about to expire, and which rack needs re-order — before you write off stock. Schemes, free quantity, supplier dues — all visible from one dashboard.',
    bullets: ['Batch expiry tracking software — batch + expiry on every purchase, sale & return', 'Expiry dashboard flags next 30/60/90 days — batch-wise and rack-wise alerts', 'Schemes & free quantity auto-added on purchase — scheme & bonus strips handled', 'Barcode & bulk Excel import in minutes — print labels, scan at sale', 'Stock tally in one evening — adjustments, physical checks & inter-branch transfer'],
  },
  {
    id: 'reports',
    label: 'Reports',
    h2: 'Wholesale Billing & Owner Reports — Profit on Your Phone',
    icon: 'chart-line',
    body: 'Wholesale pharmacy billing and retail reporting in one place. Check today\u2019s sale from home, chase party-wise udhaar before month-end, and know your real profit per branch — without calling the accountant.',
    bullets: ['Wholesale billing + daily sale & profit on mobile — branch-wise margins', 'Recover udhaar faster — party khata with credit days & overdue alerts', 'Track every rupee out — payments & kharchi against supplier/party', 'One login for all branches — consolidated view for chains from Kolkata to Siliguri'],
  },
];

const testimonials = [
  { name: 'Amitava Ghosh', shop: 'Ghosh Medical Hall — College Street, Kolkata', tag: 'Retail · 18 yrs', quote: 'GSTR file korte 2 din lagto, ekhon 20 minute. GST 2.0 slab niye aar tension nei.', trans: 'It took 2 days to file GSTR — now 20 minutes. No more GST 2.0 tension.' },
  { name: 'Sk. Riazuddin', shop: 'Rahmania Pharmacy — Howrah Maidan', tag: 'Wholesale + Retail', quote: 'Expiry list agey khata dekhe khujtam. Ekhon dashboard-ei dekhiye dey — 3 lakh taka loss beche geche.', trans: 'We used to hunt expiry in the khata. Now the dashboard shows it — saved \u20B93 lakh.' },
  { name: 'Mithu Das', shop: 'Das Pharma Chain — Siliguri', tag: '2 Branches', quote: 'Dui dokan er stock ek phone-e dekhi. Siliguri theke Jalpaiguri transfer ek click-e.', trans: 'Both shops\u2019 stock on one phone. Siliguri \u2192 Jalpaiguri transfer in one click.' },
];

const comparisonRows = [
  { task: 'Billing a customer', old: 'Write by hand, GST by calculator, rush-hour mistakes', now: 'Scan \u2192 auto GST 2.0 \u2192 print in 3 sec', save: '~2 min \u2192 10 sec' },
  { task: 'Finding near-expiry stock', old: 'Flip pages, check strips one by one', now: 'Dashboard flags 30/60/90 days, batch-wise', save: '4 hrs/mo \u2192 2 min' },
  { task: 'Month-end GST filing', old: '1–2 days rebuilding Excel for CA', now: 'One-click GSTR-1/3B + HSN CSV export', save: '2 days \u2192 20 min' },
  { task: 'Udhaar & outstanding', old: 'Phone calls, khata diary, missed dues', now: 'Party khata with credit days & overdue alerts', save: 'Recover 30% faster' },
  { task: 'Opening a 2nd shop', old: 'New khata, new software, no link', now: 'Same login, stock transfer, one report', save: '1 week \u2192 1 day' },
];

const pricing = [
  { name: 'Starter', sub: 'For your first shop', price: 799, popular: false, cta: 'Start Free Trial', features: ['1 Branch · 2 Users', 'Unlimited bills', 'GST 2.0 + Rule 46 invoices', 'Batch & expiry tracking', 'GSTR-1 / 3B reports'] },
  { name: 'Growth', sub: 'For busy retail + wholesale', price: 1299, popular: true, cta: 'Book a Free Demo', features: ['Everything in Starter', '5 Users', 'Wholesale + udhaar khata', 'Prescription registry', 'Barcode printing', 'WhatsApp priority support'] },
  { name: 'Enterprise', sub: 'For chains & hospitals', price: null, popular: false, cta: 'Talk to Kolkata Team', features: ['Everything in Growth', 'Unlimited branches & users', 'Multi-branch stock transfer', 'Role permissions & audit log', 'Priority onboarding & SLA'] },
];

const districts = ['Kolkata', 'Howrah', 'Hooghly', 'North 24 Parganas', 'South 24 Parganas', 'Bardhaman', 'Asansol', 'Durgapur', 'Siliguri', 'Jalpaiguri', 'Kharagpur', 'Haldia'];

export default function Landing() {
  const [activeFeature, setActiveFeature] = useState('billing');
  const [openFaq, setOpenFaq] = useState(0);
  const [faqQuery, setFaqQuery] = useState('');
  const [yearly, setYearly] = useState(true);
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const [mobileNav, setMobileNav] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [statsInView, setStatsInView] = useState(false);
  const statsRef = useRef(null);
  const [billQtys, setBillQtys] = useState([2, 1, 3]);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrolled(window.scrollY > 8);
          const h = document.documentElement;
          setScrollProgress(h.scrollTop / (h.scrollHeight - h.clientHeight || 1));
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsInView(true); }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const id = setInterval(() => setTestimonialIdx(i => (i + 1) % testimonials.length), 4200);
    return () => clearInterval(id);
  }, []);

  const filteredFaqs = faqs.filter(f => f.q.toLowerCase().includes(faqQuery.toLowerCase()) || f.a.toLowerCase().includes(faqQuery.toLowerCase()));

  const billItems = [
    { name: 'Azithral 500', hsn: '30042019', mrp: 45, rate: 42.86 },
    { name: 'Dolo 650', hsn: '30049069', mrp: 30, rate: 28.57 },
    { name: 'Betadine 100ml', hsn: '30049099', mrp: 120, rate: 114.29 },
  ];
  const billRows = billItems.map((it, i) => ({ ...it, qty: billQtys[i] }));
  const billTotal = billRows.reduce((s, r) => s + r.qty * r.mrp, 0);

  const activeF = features.find(f => f.id === activeFeature) || features[0];

  return (
    <>
      <Head>
        <title>Pharmacy Billing Software Kolkata | GST 2.0 Ready — CalcuttaRx</title>
        <meta name="description" content="Pharmacy billing software for Kolkata chemists — GST 2.0 (Nil/5%/18%/40%), batch & expiry tracking, GSTR-1/3B & Schedule H. Medical store POS from ₹799/mo. 14-day free trial." />
        <link rel="canonical" href={SITE + '/'} />
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
        <meta name="author" content="Calcutta Node" />
        <meta name="geo.region" content="IN-WB" />
        <meta name="geo.placename" content="Kolkata" />
        <meta name="ICBM" content="22.5726, 88.3639" />
        <meta name="geo.position" content="22.5726;88.3639" />
        <meta property="og:locale" content="en_IN" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="CalcuttaRx" />
        <meta property="og:url" content={SITE + '/'} />
        <meta property="og:title" content="Pharmacy Billing Software Kolkata | GST 2.0 POS — CalcuttaRx" />
        <meta property="og:description" content="Cloud pharmacy billing for West Bengal chemists — GST 2.0 (Nil/5/18/40%), batch/expiry & GSTR-1/3B. Built in Kolkata. From ₹799/mo." />
        <meta property="og:image" content={SITE + '/og-cover-1200x630.jpg'} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:image:alt" content="CalcuttaRx — Pharmacy Billing Software for Kolkata chemists" />
        <meta property="og:image:secure_url" content={SITE + '/og-cover-1200x630.jpg'} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Pharmacy Billing Software Kolkata | GST 2.0 POS — CalcuttaRx" />
        <meta name="twitter:description" content="Bill at counter speed. Invoices that pass every GST check. Built for Bengal chemists." />
        <meta name="twitter:image" content={SITE + '/og-cover-1200x630.jpg'} />
        <meta name="twitter:image:alt" content="CalcuttaRx — Cloud Pharmacy Billing" />
        <link rel="alternate" hrefLang="en-IN" href={SITE + '/'} />
        <link rel="alternate" hrefLang="bn-IN" href={SITE + '/'} />
        <link rel="alternate" hrefLang="x-default" href={SITE + '/'} />
      </Head>

      <script dangerouslySetInnerHTML={{ __html: `try{if(localStorage.getItem('token'))location.replace('/dashboard')}catch(e){}` }} />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@graph': [
          { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' }] },
          {
            '@type': 'SoftwareApplication',
            name: 'CalcuttaRx',
            applicationCategory: 'BusinessApplication',
            applicationSubCategory: 'Pharmacy Management System',
            operatingSystem: 'Web',
            url: SITE + '/',
            description: 'Cloud pharmacy billing software for West Bengal chemists — GST 2.0 invoices, batch & expiry tracking, GSTR-1/3B & Schedule H compliance.',
            image: SITE + '/og-cover-1200x630.jpg',
            screenshot: SITE + '/og-cover-1200x630.jpg',
            featureList: 'GST 2.0 auto slabs (Nil/5/18/40), Rule 46 invoices, Batch & expiry alerts, GSTR-1/3B reports, Prescription capture, UPI/Card split payments, Multi-branch',
            inLanguage: 'en-IN',
            isAccessibleForFree: true,
            datePublished: '2025-01-15',
            author: { '@id': SITE + '/#org' },
            publisher: { '@id': SITE + '/#org' },
            offers: { '@type': 'AggregateOffer', lowPrice: '0', highPrice: '1299', priceCurrency: 'INR', availability: 'https://schema.org/InStock', priceValidUntil: '2027-01-01', seller: { '@id': SITE + '/#org' } },
            aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.8', bestRating: '5', worstRating: '1', reviewCount: '47' },
          },
          {
            '@type': 'Organization',
            '@id': SITE + '/#org',
            name: 'Calcutta Node',
            alternateName: 'CalcuttaRx',
            legalName: 'Calcutta Node',
            url: SITE + '/',
            logo: { '@type': 'ImageObject', url: SITE + '/logo.png', width: 1254, height: 1254 },
            sameAs: ['https://www.instagram.com/calcuttanode/', 'https://www.linkedin.com/in/danishshoaib-in/', 'https://wa.me/918584885450'],
            address: { '@type': 'PostalAddress', streetAddress: '22, College Street', addressLocality: 'Kolkata', addressRegion: 'West Bengal', postalCode: '700073', addressCountry: 'IN' },
            contactPoint: [{ '@type': 'ContactPoint', contactType: 'customer support', telephone: '+91-85848-85450', email: 'calcuttanode@gmail.com', availableLanguage: ['en', 'bn', 'hi'], areaServed: 'IN-WB', url: SITE + '/' }],
          },
          {
            '@type': 'LocalBusiness',
            '@id': SITE + '/#localbusiness',
            name: 'CalcuttaRx — Calcutta Node',
            alternateName: 'CalcuttaRx',
            url: SITE + '/',
            telephone: '+91-85848-85450',
            email: 'calcuttanode@gmail.com',
            priceRange: '\u20B9799 - \u20B91299',
            foundingDate: '2025',
            founder: { '@type': 'Person', name: 'Danish Shoaib', sameAs: 'https://www.linkedin.com/in/danishshoaib-in/' },
            parentOrganization: { '@id': SITE + '/#org' },
            address: { '@type': 'PostalAddress', streetAddress: '22, College Street', addressLocality: 'Kolkata', addressRegion: 'West Bengal', postalCode: '700073', addressCountry: 'IN' },
            geo: { '@type': 'GeoCoordinates', latitude: 22.5726, longitude: 88.3639 },
            areaServed: [{ '@type': 'City', name: 'Kolkata' }, { '@type': 'City', name: 'Howrah' }, { '@type': 'City', name: 'Hooghly' }, { '@type': 'AdministrativeArea', name: 'North 24 Parganas' }, { '@type': 'AdministrativeArea', name: 'South 24 Parganas' }, { '@type': 'City', name: 'Asansol' }, { '@type': 'City', name: 'Siliguri' }, { '@type': 'City', name: 'Durgapur' }, { '@type': 'AdministrativeArea', name: 'West Bengal' }],
            sameAs: ['https://www.instagram.com/calcuttanode/', 'https://www.linkedin.com/in/danishshoaib-in/', 'https://wa.me/918584885450'],
            aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.8', bestRating: '5', worstRating: '1', reviewCount: '47' },
            openingHoursSpecification: [{ '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], opens: '10:00', closes: '19:00' }],
            hasOfferCatalog: {
              '@type': 'OfferCatalog',
              name: 'CalcuttaRx Plans',
              itemListElement: [
                { '@type': 'Offer', name: 'Starter — Pharmacy Billing Software', price: '799', priceCurrency: 'INR', availability: 'https://schema.org/InStock', url: SITE + '/#pricing', description: '1 branch, 2 users, unlimited bills' },
                { '@type': 'Offer', name: 'Growth — Wholesale + Retail', price: '1299', priceCurrency: 'INR', availability: 'https://schema.org/InStock', url: SITE + '/#pricing' },
                { '@type': 'Offer', name: '14-day Free Trial', price: '0', priceCurrency: 'INR', availability: 'https://schema.org/InStock', description: '14-day free trial, no card, includes migration & training', url: SITE + '/#pricing' },
              ],
            },
          },
          { '@type': 'FAQPage', inLanguage: 'en-IN', mainEntity: faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
          ...testimonials.map(t => ({
            '@type': 'Review',
            itemReviewed: { '@id': SITE + '/#localbusiness' },
            author: { '@type': 'Person', name: t.name },
            reviewBody: `${t.quote} — ${t.trans}`,
            reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5', worstRating: '1' },
            locationCreated: { '@type': 'Place', name: t.shop },
          })),
        ]
      }) }} />

      <div className="min-h-screen grad-mesh">
        {/* Sticky Nav */}
        <header className={`sticky top-0 z-40 transition-all duration-200 ${scrolled ? 'bg-white/85 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-700/60 shadow-soft' : 'bg-transparent border-b border-transparent'}`}>
          <div className="max-w-6xl mx-auto flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <img src="/logo-mark.png" alt="CalcuttaRx — pharmacy billing software Kolkata logo" width="512" height="512" loading="eager" fetchPriority="high" decoding="async" className="h-11 sm:h-12 w-auto drop-shadow-sm flex-shrink-0" />
              <div className="flex flex-col leading-tight min-w-0">
                <BrandWordmark className="text-lg sm:text-xl" />
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 tracking-wide">Pharmacy Billing · GST · POS</span>
              </div>
            </div>
            <nav className="hidden md:flex items-center gap-1.5">
              <a href="#features" className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 px-2.5 py-1.5 rounded-lg hover:bg-white/60">Features</a>
              <a href="#pricing" className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 px-2.5 py-1.5 rounded-lg hover:bg-white/60">Pricing</a>
              <a href="#faq" className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 px-2.5 py-1.5 rounded-lg hover:bg-white/60">FAQ</a>
            </nav>
            <div className="flex items-center gap-2">
              <a href="/login" className="hidden sm:inline-flex btn btn-secondary btn-sm">Sign In</a>
              <a href="/register" className="btn btn-primary btn-sm">Start Free</a>
              <button onClick={() => setMobileNav(v => !v)} aria-label={mobileNav ? 'Close menu' : 'Open menu'} className="md:hidden w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600"><i className={`fas ${mobileNav ? 'fa-xmark' : 'fa-bars'} text-sm`}></i></button>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500 transition-all duration-150" style={{ width: `${scrollProgress * 100}%` }} />
          {mobileNav && (
            <div className="md:hidden border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-5 py-3 space-y-1 animate-slide-in">
              <a href="#features" onClick={() => setMobileNav(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50"> <i className="fas fa-layer-group text-pharma-500 text-xs"></i> Features</a>
              <a href="#who" onClick={() => setMobileNav(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50"> <i className="fas fa-store text-pharma-500 text-xs"></i> Who it&apos;s for</a>
              <a href="#pricing" onClick={() => setMobileNav(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50"> <i className="fas fa-tags text-pharma-500 text-xs"></i> Pricing</a>
              <a href="#faq" onClick={() => setMobileNav(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50"> <i className="fas fa-circle-question text-pharma-500 text-xs"></i> FAQ</a>
              <a href="/login" className="btn btn-secondary w-full justify-center mt-2">Sign In</a>
            </div>
          )}
        </header>

        {/* Hero — two columns */}
        <section className="max-w-6xl mx-auto px-5 pt-10 sm:pt-14 pb-10 sm:pb-14">
          <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-8 lg:gap-10 items-center">
            <div className="text-center lg:text-left">
              <span className="inline-flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> GST 2.0 Ready · Built in Kolkata</span>
              <h1 className="mt-5 text-[30px] sm:text-5xl font-extrabold tracking-tight leading-[1.05] text-slate-900 dark:text-white">
                Pharmacy Billing Software<br className="hidden sm:block" /> for Kolkata Chemists.<br />
                <span className="text-transparent bg-clip-text grad-hero animate-gradient-x">Billing at Counter Speed.</span>
              </h1>
              <p className="mt-4 text-[14px] sm:text-[15px] text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl mx-auto lg:mx-0">
                <BrandWordmark className="text-slate-800 dark:text-white" /> is pharmacy billing software built in Kolkata for West Bengal medical stores. Replace your Marg/Tally dongle with one fast browser counter — pharmacy POS that auto-picks GST 2.0 slabs (Nil, 5%, 18%, 40%) by HSN, prints Rule 46 invoices, tracks batch &amp; expiry, and captures Schedule H prescriptions. From College Street to Siliguri, 300+ chemists bill in 3 seconds and file GSTR-1/3B without Excel. Works on any laptop — no installation.
              </p>
              <div className="mt-7 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-center lg:justify-start">
                <a href="/register" className="btn btn-primary btn-glow px-7 py-3 text-[15px] justify-center"><i className="fas fa-bolt"></i> Start Free Trial — No Card</a>
                <a href="https://wa.me/918584885450?text=Hi!%20I%20want%20a%20CalcuttaRx%20demo%20for%20my%20pharmacy." target="_blank" rel="noopener noreferrer" className="btn btn-secondary px-7 py-3 text-[15px] justify-center"><i className="fab fa-whatsapp" style={{ color: '#25D366' }}></i> Book Demo on WhatsApp</a>
              </div>
              <p className="mt-3 text-xs text-slate-400">No card required · Free Marg data import &amp; staff training · Bangla · Hindi · English</p>
              <div className="mt-4 flex flex-wrap items-center gap-2 justify-center lg:justify-start text-[11px] font-semibold text-slate-500">
                <span className="inline-flex items-center gap-1.5"><i className="fas fa-check text-emerald-500"></i> Thermal 80mm</span>
                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                <span className="inline-flex items-center gap-1.5"><i className="fas fa-check text-emerald-500"></i> UPI / Card / Split</span>
                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                <span className="inline-flex items-center gap-1.5"><i className="fas fa-check text-emerald-500"></i> Works in any browser</span>
              </div>
            </div>

            {/* Interactive bill preview */}
            <div className="relative lg:pl-2">
              <div className="absolute -top-3 -right-2 sm:right-0 w-24 h-24 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none"></div>
              <div className="absolute -bottom-4 -left-2 w-28 h-28 bg-indigo-400/15 rounded-full blur-2xl pointer-events-none"></div>
              <div className="relative glass-card p-4 sm:p-5 shadow-card-hover">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img src="/logo-mark.png" alt="" width="64" height="64" loading="lazy" decoding="async" className="h-7 w-auto" aria-hidden="true" />
                    <BrandWordmark className="text-sm" />
                    <span className="hidden sm:inline text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">INV-2026-0142</span>
                  </div>
                  <span className="status-chip status-chip-success text-[10px]"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> PAID · UPI</span>
                </div>
                <div className="mt-4 space-y-2">
                  {billRows.map((r, i) => (
                    <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                      <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 flex items-center justify-center flex-shrink-0"><i className="fas fa-pills text-pharma-500 text-xs"></i></div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{r.name}</p>
                        <p className="text-[10px] font-mono text-slate-400">HSN {r.hsn} · 5% GST</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button aria-label="Decrease quantity" onClick={() => setBillQtys(q => q.map((v, j) => j === i ? Math.max(1, v - 1) : v))} className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-500 hover:text-slate-800">−</button>
                        <span className="w-6 text-center text-xs font-bold font-mono">{r.qty}</span>
                        <button aria-label="Increase quantity" onClick={() => setBillQtys(q => q.map((v, j) => j === i ? v + 1 : v))} className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-500 hover:text-slate-800">+</button>
                      </div>
                      <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-100 w-16 text-right">₹{(r.qty * r.mrp).toFixed(0)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 px-1"><span>Subtotal (MRP incl. GST)</span><span className="font-mono font-semibold">₹{billTotal.toFixed(2)}</span></div>
                <div className="mt-2 rounded-xl grad-hero text-white p-3 flex items-center justify-between">
                  <span className="text-xs font-bold tracking-widest uppercase opacity-90">Total — Paid via UPI</span>
                  <span className="text-lg font-extrabold font-mono">₹{billTotal.toFixed(2)}</span>
                </div>
                <p className="mt-2 text-center text-[10px] text-slate-400">Tap +/− to change qty — total &amp; GST update live · Thermal 80mm prints the same</p>
              </div>
              <div className="hidden sm:flex items-center gap-2 mt-3 justify-center lg:justify-start">
                <span className="status-chip status-chip-success text-[11px]"><i className="fas fa-check text-[10px]"></i> CGST/SGST auto</span>
                <span className="status-chip text-[11px]"><i className="fas fa-print text-[10px]"></i> Thermal ready</span>
                <span className="status-chip text-[11px]"><i className="fas fa-camera text-[10px]"></i> Rx attached</span>
              </div>
            </div>
          </div>
        </section>

        {/* Stats bar */}
        <section ref={statsRef} className="max-w-5xl mx-auto px-5 pb-10">
          <h2 className="sr-only">Why 300+ Bengal chemists chose pharmacy billing software CalcuttaRx</h2>
          <div className="glass-accent p-5 sm:p-6 flex flex-wrap justify-around gap-6 text-center">
            {[
              { n: statsInView ? 300 : 0, suffix: '+', label: 'Bengal chemists onboarded', sub: 'Kolkata → Siliguri' },
              { n: statsInView ? 98 : 0, suffix: '%', label: 'GSTR filed on time', sub: 'after switching' },
              { n: statsInView ? 3 : 0, suffix: ' sec', label: 'Avg. bill time', sub: 'scan → print' },
              { n: statsInView ? 0 : 0, custom: 'Nil · 5% · 18% · 40%', label: 'GST 2.0 slabs · auto', sub: 'by HSN' },
            ].map((s, i) => (
              <div key={i} className="min-w-[120px]">
                <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-mono">{s.custom ?? `${s.n}${s.suffix}`}</p>
                <p className="text-[11px] font-bold tracking-widest uppercase text-slate-500 mt-1">{s.label}</p>
                <p className="text-[10px] text-slate-400">{s.sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="max-w-5xl mx-auto px-5 pb-16">
          <div className="text-center mb-8">
            <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-pharma-600">From Khata to Cloud</p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">How Bengal Chemists Switch Pharmacy Billing in One Afternoon</h2>
            <p className="mt-2 text-sm text-slate-500 max-w-xl mx-auto">No engineer visit. Share your old file — we do the rest. Pharmacy billing software onboarding in 3 steps.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { n: '01', icon: 'file-arrow-up', t: 'Import Your Stock', d: 'Share CSV / Excel / Marg backup. We clean HSN, batches & expiry. Most medical stores done before lunch.', chip: 'CSV · Excel · Marg' },
              { n: '02', icon: 'cart-shopping', t: 'Bill at Counter Speed', d: 'Open browser, scan or type, print. GST 2.0 auto, Rule 46 printed, prescription photo in one tap.', chip: 'Scan → Bill → Print 3s' },
              { n: '03', icon: 'file-export', t: 'Export & File GSTR', d: 'One-click GSTR-1/3B + HSN Table 12 + CDNR CSV — hand to your CA and done.', chip: 'One click → Send to CA' },
            ].map(s => (
              <div key={s.n} className="relative app-card p-6 pt-7 overflow-hidden">
                <span className="absolute top-3 right-3 text-3xl font-black text-slate-100 dark:text-slate-800 select-none">{s.n}</span>
                <div className="w-10 h-10 rounded-xl grad-hero text-white flex items-center justify-center mb-3"><i className={`fas fa-${s.icon} text-sm`}></i></div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100">{s.t}</h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{s.d}</p>
                <span className="inline-block mt-3 text-[10px] font-mono font-bold px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">{s.chip}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Feature tabs */}
        <section id="features" className="max-w-5xl mx-auto px-5 pb-16">
          <div className="text-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Pharmacy Billing &amp; GST Features — Everything at the Counter</h2>
            <p className="mt-2 text-sm text-slate-500">Tap a tab — see the real screen behind it. Pharmacy POS, GST billing, inventory &amp; reports.</p>
          </div>
          <div className="flex gap-2 overflow-x-auto crx-nav-scroll pb-2 -mx-1 px-1">
            {features.map(f => (
              <button key={f.id} onClick={() => setActiveFeature(f.id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${activeFeature === f.id ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'}`}>
                <i className={`fas fa-${f.icon} text-[11px]`}></i> {f.label}
              </button>
            ))}
          </div>
          <div key={activeFeature} className="mt-4 glass-card p-6 sm:p-8 animate-fade-up">
            <div className="flex items-start gap-3">
              <span className="color-block color-block-md grad-hero text-white flex-shrink-0"><i className={`fas fa-${activeF.icon}`}></i></span>
              <div>
                <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">{activeF.h2}</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{activeF.body}</p>
              </div>
            </div>
            <ul className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5">
              {activeF.bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300"><i className="fas fa-circle-check text-emerald-500 mt-0.5 flex-shrink-0 text-xs"></i><span>{b}</span></li>
              ))}
            </ul>
          </div>
        </section>

        {/* Who it's for */}
        <section id="who" className="max-w-5xl mx-auto px-5 pb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2 text-center">Made for Medical Stores in West Bengal — Retail, Wholesale &amp; Chains</h2>
          <p className="text-sm text-slate-500 text-center mb-6 max-w-2xl mx-auto">Whether you run a para medicine shop or a wholesale hub in Bagri Market — this medical store billing software fits your counter.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              ['store', 'Retail Chemist', 'Fast POS for the evening rush, prescription photo & expiry alerts. Ideal from Shyambazar to Siliguri.'],
              ['truck', 'Wholesaler', 'Bulk invoicing, credit days, party khata & delivery challans. 500 bills before lunch.'],
              ['hospital-user', 'Hospital Dispensary', 'Patient + doctor + Schedule H prescription linked per dispense. H/H1 validation & audit trail.'],
              ['code-branch', '2–20 Store Chain', 'One owner login, per-branch stock, consolidated P&L. Pharmacy chain software.'],
            ].map(([icon, t, d], i) => (
              <div key={i} className="app-card app-card-hover p-5">
                <div className="color-block color-block-sm grad-brand text-white mb-3"><i className={`fas fa-${icon} text-xs`}></i></div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{t}</h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Service area — local SEO */}
        <section className="max-w-5xl mx-auto px-5 pb-16">
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Pharmacy Billing Software Near You — Across Bengal</h2>
          <p className="text-sm text-slate-500 mt-1">Kolkata-built, Bengal-supported. Onboarding in Bangla/Hindi/English + free data import from Marg/Excel. Same-day demo on WhatsApp.</p>
          <ul className="mt-4 flex flex-wrap gap-2 text-xs">
            {districts.map(c => <li key={c} className="px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium">{c}</li>)}
          </ul>
          <p className="text-xs text-slate-400 mt-3">Search: <em>chemist billing software near me, medical store POS Kolkata, pharmacy GST software Howrah</em> — CalcuttaRx serves all 23 districts from Kolkata.</p>
        </section>

        {/* Comparison */}
        <section className="max-w-5xl mx-auto px-5 pb-16">
          <div className="text-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Register Khata vs <BrandWordmark className="align-middle" /> Cloud</h2>
            <p className="text-sm text-slate-500 mt-1">Same chemist. Same shop. 10 hours saved every week.</p>
          </div>
          <div className="app-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold tracking-widest uppercase text-slate-500">
                    <th className="text-left px-4 py-3 font-bold">Kaam</th>
                    <th className="text-left px-4 py-3">Register / Desktop</th>
                    <th className="text-left px-4 py-3 bg-emerald-50/60 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300">CalcuttaRx Cloud</th>
                    <th className="hidden sm:table-cell text-left px-4 py-3">Time Saved</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {comparisonRows.map(r => (
                    <tr key={r.task} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-100">{r.task}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs leading-relaxed">{r.old}</td>
                      <td className="px-4 py-3 bg-emerald-50/40 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-300 font-medium text-xs">{r.now}</td>
                      <td className="hidden sm:table-cell px-4 py-3"><span className="badge badge-success text-[10px]">{r.save}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-center text-xs text-slate-400 mt-3">If you still close the shutter to do hisaab — it&apos;s time to switch. <a href="/register" className="text-pharma-600 font-semibold hover:underline">Start free trial →</a></p>
        </section>

        {/* Pricing */}
        <section id="pricing" className="max-w-5xl mx-auto px-5 pb-16">
          <div className="text-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Pharmacy Billing Software Price in Kolkata — No Hidden AMC</h2>
            <p className="text-sm text-slate-500 mt-1">Start free. Pay per shop. Scale when you open your next counter. Pharmacy billing software price from ₹799.</p>
            <div className="mt-4 inline-flex items-center gap-3 p-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all ${!yearly ? 'bg-white dark:bg-slate-700 shadow text-slate-800 dark:text-white' : 'text-slate-500'}`}>Monthly</span>
              <button onClick={() => setYearly(v => !v)} aria-label="Toggle yearly billing" className={`relative w-11 h-6 rounded-full transition-colors ${yearly ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${yearly ? 'left-5' : 'left-0.5'}`}></span>
              </button>
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${yearly ? 'bg-white dark:bg-slate-700 shadow text-slate-800 dark:text-white' : 'text-slate-500'}`}>Yearly <span className="hidden sm:inline-flex badge badge-success text-[9px]">Save 20%</span></span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
            {pricing.map(p => (
              <div key={p.name} className={`relative app-card p-6 flex flex-col ${p.popular ? 'ring-2 ring-emerald-500 shadow-glow scale-[1.02] md:-mt-2 md:mb-2' : ''}`}>
                {p.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 badge badge-success text-[10px] whitespace-nowrap">Most Popular</span>}
                <h3 className="font-extrabold text-slate-900 dark:text-white">{p.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{p.sub}</p>
                <p className="mt-4">
                  {p.price ? <><span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-mono">₹{yearly ? Math.round(p.price * 0.8) : p.price}</span><span className="text-xs text-slate-500">/shop/mo</span>{yearly && <span className="ml-2 text-xs line-through text-slate-400">₹{p.price}</span>}</> : <span className="text-2xl font-extrabold text-slate-900 dark:text-white">Custom</span>}
                </p>
                <p className="text-[10px] text-slate-400 mt-1">{p.price ? (yearly ? 'Billed yearly · Save 20%' : 'Billed monthly') : 'For chains & hospitals'}</p>
                <ul className="mt-4 space-y-2 flex-1">
                  {p.features.map(f => <li key={f} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300"><i className="fas fa-check text-emerald-500 text-[10px]"></i>{f}</li>)}
                </ul>
                <a href={p.price ? '/register' : 'https://wa.me/918584885450'} className={`mt-5 btn w-full justify-center ${p.popular ? 'btn-primary' : 'btn-secondary'}`}>{p.cta}</a>
                <span className="sr-only" data-price-monthly={p.price ?? ''} data-price-yearly={p.price ? Math.round(p.price * 0.8) : ''}></span>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-slate-400 mt-4">All plans: FREE migration · FREE staff training · Bangla/Hindi/English support · No invoice caps like Marg — unlimited bills</p>
        </section>

        {/* Testimonials */}
        <section className="max-w-3xl mx-auto px-5 pb-16">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white text-center">Bengal Chemists Trust <BrandWordmark className="align-middle" /></h2>
          <p className="text-sm text-slate-500 text-center mt-1">Not Mumbai software with Bengal pricing. Built here, supported here. Rated 4.8/5</p>
          <div className="mt-6 relative overflow-hidden">
            <div className="flex transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]" style={{ transform: `translateX(-${testimonialIdx * 100}%)` }}>
              {testimonials.map(t => (
                <div key={t.name} className="min-w-full px-1">
                  <div className="glass-card p-6">
                    <div className="flex gap-1 text-amber-400 text-xs mb-3">{[1,2,3,4,5].map(i => <i key={i} className="fas fa-star"></i>)}<span className="ml-2 text-[11px] font-bold text-slate-500">5.0</span></div>
                    <p className="text-[15px] font-semibold text-slate-800 dark:text-slate-100 leading-relaxed" lang="bn">“{t.quote}”</p>
                    <p className="text-xs text-slate-500 mt-1">{t.trans}</p>
                    <div className="mt-4 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full grad-hero text-white flex items-center justify-center text-xs font-bold">{t.name.split(' ').map(w=>w[0]).join('').slice(0,2)}</div>
                      <div><p className="text-xs font-bold text-slate-800 dark:text-slate-100">{t.name}</p><p className="text-[11px] text-slate-500">{t.shop} · {t.tag}</p></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-2 mt-4">
              {testimonials.map((_, i) => (
                <button key={i} onClick={() => setTestimonialIdx(i)} aria-label={`Go to testimonial ${i+1}`} className={`h-1.5 rounded-full transition-all ${i === testimonialIdx ? 'w-6 bg-emerald-500' : 'w-1.5 bg-slate-300 dark:bg-slate-600'}`}></button>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="max-w-3xl mx-auto px-5 pb-16">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2 text-center">Chemists Ask. We Answer Straight.</h2>
          <p className="text-sm text-slate-500 text-center mb-4">GST 2.0, Marg migration, Schedule H, pricing — answered for medical stores in West Bengal</p>
          <div className="max-w-md mx-auto mb-5">
            <div className="relative">
              <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
              <input value={faqQuery} onChange={e => setFaqQuery(e.target.value)} placeholder="Search GST, stock, price, Marg..." className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400" />
            </div>
          </div>
          <div className="space-y-3">
            {filteredFaqs.length === 0 && <p className="text-center text-sm text-slate-400 py-6">No matching questions — try &quot;GST&quot; or &quot;price&quot;</p>}
            {filteredFaqs.map((f, i) => {
              const isOpen = openFaq === i;
              return (
                <div key={i} className={`glass-card overflow-hidden transition-all ${isOpen ? 'shadow-card-hover border-emerald-200 dark:border-emerald-700/40' : ''}`}>
                  <button onClick={() => setOpenFaq(isOpen ? -1 : i)} className="w-full flex items-start justify-between gap-3 p-5 text-left">
                    <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm leading-snug">{f.q}</span>
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${isOpen ? 'bg-emerald-500 text-white rotate-180' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}><i className="fas fa-chevron-down text-[11px]"></i></span>
                  </button>
                  <div className={`grid transition-all duration-300 ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                    <div className="overflow-hidden"><p className="px-5 pb-5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{f.a}</p></div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Final CTA */}
        <section className="max-w-4xl mx-auto px-5 pb-10 text-center">
          <div className="rounded-3xl grad-hero p-8 sm:p-12 shadow-glow relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl animate-float-slow pointer-events-none"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-white/10 blur-2xl animate-float-slower pointer-events-none"></div>
            <h2 className="relative text-2xl sm:text-4xl font-extrabold text-white tracking-tight">Move Your Counter to Cloud This Week.</h2>
            <p className="relative text-white/85 mt-3 max-w-xl mx-auto text-sm sm:text-base">Free migration, one-day setup, and a Kolkata team that picks up on WhatsApp — not a Mumbai call centre.</p>
            <div className="relative mt-7 flex flex-col sm:flex-row justify-center gap-3">
              <a href="/register" className="btn bg-white text-emerald-700 hover:bg-emerald-50 px-8 py-3 text-sm font-bold justify-center"><i className="fas fa-arrow-right"></i> Create Free Account</a>
              <a href="https://wa.me/918584885450?text=Hi!%20I%20want%20a%20CalcuttaRx%20demo" target="_blank" rel="noopener noreferrer" className="btn border border-white/60 text-white hover:bg-white/10 px-8 py-3 text-sm justify-center"><i className="fab fa-whatsapp"></i> Talk on WhatsApp — 85848 85450</a>
            </div>
            <p className="relative mt-4 text-xs text-white/70">Join 300+ Bengal chemists · Avg. setup 4 hours · Rating 4.8/5</p>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/60 bg-white/50 dark:bg-slate-900/40 backdrop-blur-md">
          <div className="max-w-5xl mx-auto px-5 py-10 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <img src="/logo-mark.png" alt="CalcuttaRx — pharmacy billing software Kolkata logo" width="512" height="512" loading="lazy" decoding="async" className="h-11 w-auto drop-shadow-sm flex-shrink-0" />
                <div className="flex flex-col leading-tight">
                  <BrandWordmark className="text-lg" />
                  <span className="text-[10px] font-semibold text-slate-500 tracking-wide">Pharmacy Billing · GST · POS</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed"><BrandWordmark className="text-slate-700 dark:text-slate-300 text-xs" /> — Bengal-er chemist-er jonno. Cloud-e billing. GST-e tension-free.</p>
              <p className="text-xs text-slate-400 mt-1">Cloud pharmacy billing built in Kolkata, for West Bengal. Bill faster. Waste less. File GST without fear.</p>
              <address className="not-italic mt-3 text-xs text-slate-500 leading-relaxed">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Calcutta Node</span> — 22, College Street, Kolkata 700073, West Bengal<br />
                <a href="tel:+918584885450" className="hover:text-pharma-600 font-mono">+91 85848 85450</a> · <a href="mailto:calcuttanode@gmail.com" className="hover:text-pharma-600">calcuttanode@gmail.com</a>
              </address>
              <div className="mt-3 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 h-32">
                <iframe title="CalcuttaRx — Kolkata location map" src="https://www.openstreetmap.org/export/embed.html?bbox=88.350%2C22.560%2C88.380%2C22.585&layer=mapnik&marker=22.5726%2C88.3639" className="w-full h-full border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe>
              </div>
            </div>
            <div>
              <p className="font-bold text-slate-700 dark:text-slate-200 mb-2 text-xs uppercase tracking-wider">Product</p>
              <ul className="space-y-1.5 text-xs text-slate-500">
                <li><a className="hover:text-pharma-600" href="#features">GST Billing &amp; POS — Pharmacy Software</a></li>
                <li><a className="hover:text-pharma-600" href="#how">How It Works</a></li>
                <li><a className="hover:text-pharma-600" href="#pricing">Pharmacy Billing Software Price</a></li>
                <li><a className="hover:text-pharma-600" href="/login">Customer Login</a></li>
              </ul>
            </div>
            <div>
              <p className="font-bold text-slate-700 dark:text-slate-200 mb-2 text-xs uppercase tracking-wider">Company</p>
              <ul className="space-y-1.5 text-xs text-slate-500">
                <li>A <a className="font-semibold text-slate-700 dark:text-slate-300 hover:text-pharma-600" href="https://calcuttanode.vercel.app/about" rel="noopener noreferrer">Calcutta Node SaaS Product</a> · Kolkata</li>
                <li><a href="https://wa.me/918584885450" rel="noopener noreferrer" className="hover:text-pharma-600">WhatsApp Support — +91 85848 85450</a></li>
                <li><a className="hover:text-pharma-600" href="https://www.instagram.com/calcuttanode/" rel="noopener noreferrer">Instagram</a> · <a className="hover:text-pharma-600" href="https://www.linkedin.com/in/danishshoaib-in/" rel="noopener noreferrer">LinkedIn</a></li>
                <li><a className="hover:text-pharma-600" href="mailto:calcuttanode@gmail.com">calcuttanode@gmail.com</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/70 dark:border-slate-800 py-4 text-center text-[11px] text-slate-400 px-5">
            © {new Date().getFullYear()} <BrandWordmark className="text-slate-700 dark:text-slate-300" /> · A Calcutta Node Product · Kolkata, West Bengal · Built for chemists, not coders. · <span lang="bn">বাংলা সাপোর্ট</span> available
          </div>
        </footer>

        <div className="fixed bottom-0 inset-x-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-700 p-3 flex gap-2 md:hidden z-40 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <a href="/register" className="btn btn-primary flex-1 justify-center"><i className="fas fa-bolt"></i> Start Free</a>
          <a href="https://wa.me/918584885450" target="_blank" rel="noopener noreferrer" className="btn btn-secondary flex-1 justify-center"><i className="fab fa-whatsapp" style={{ color: '#25D366' }}></i> WhatsApp</a>
        </div>
        <div className="h-16 md:hidden" aria-hidden="true"></div>
      </div>
    </>
  );
}
