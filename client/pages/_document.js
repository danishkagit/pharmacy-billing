import Document, { Html, Head, Main, NextScript } from 'next/document';

export default class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          <meta name="theme-color" content="#F8FAFC" />
          <meta name="description" content="CalcuttaRx — cloud pharmacy billing & GST inventory software for chemists in Kolkata, West Bengal. GST 2.0 invoices, batch/expiry tracking, GSTR-1/3B reports. Free trial." />
          <meta name="keywords" content="pharmacy billing software Kolkata, chemist shop billing software West Bengal, GST billing software for medical store, cloud POS pharmacy India, pharmacy inventory software, CalcuttaRx" />
          <link rel="canonical" href="https://pharmacybills.vercel.app/" />
          <meta property="og:site_name" content="CalcuttaRx" />
          <meta property="og:title" content="CalcuttaRx – Cloud Pharmacy Billing & GST Inventory Software | Kolkata" />
          <meta property="og:description" content="GST 2.0-ready billing, batch-wise stock and compliance for Indian pharmacies. Built by Calcutta Node." />
          <meta property="og:type" content="website" />
          <meta property="og:url" content="https://pharmacybills.vercel.app/" />
          <meta property="og:image" content="https://pharmacybills.vercel.app/logo.png" />
          <meta name="twitter:card" content="summary" />
          <meta name="twitter:image" content="https://pharmacybills.vercel.app/logo.png" />
          <meta name="geo.region" content="IN-WB" />
          <meta name="geo.placename" content="Kolkata" />
          <meta name="ICBM" content="22.5726, 88.3639" />
          <meta name="application-name" content="CalcuttaRx" />
          <meta name="apple-mobile-web-app-title" content="CalcuttaRx" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="msapplication-TileColor" content="#059669" />
          <link rel="icon" type="image/png" sizes="32x32" href="/logo.png" />
          <link rel="icon" type="image/png" sizes="192x192" href="/logo-mark.png" />
          <link rel="apple-touch-icon" sizes="180x180" href="/logo.png" />
          <meta property="og:image:width" content="1536" />
          <meta property="og:image:height" content="1024" />
          <meta property="og:image:alt" content="CalcuttaRx — Cloud Based Pharmacy Billing Software by Calcutta Node" />
          <meta name="twitter:image:alt" content="CalcuttaRx — Cloud Based Pharmacy Billing Software by Calcutta Node" />
          <title>CalcuttaRx – Cloud Pharmacy Billing &amp; GST Inventory Software | Kolkata</title>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
          <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
