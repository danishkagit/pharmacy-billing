import Document, { Html, Head, Main, NextScript } from 'next/document';

export default class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          <meta name="theme-color" content="#04121B" />
          <meta name="description" content="CalcuttaRx — GST-ready pharmacy billing & management suite by Calcutta Node. Retail POS, batch/expiry inventory, GSTR-1/3B, e-invoice." />
          <link rel="icon" type="image/svg+xml" href="/logo.svg" />
          <link rel="apple-touch-icon" href="/logo.svg" />
          <title>CalcuttaRx — Pharmacy Billing Suite</title>
          <meta property="og:title" content="CalcuttaRx — Pharmacy Billing Suite" />
          <meta property="og:description" content="GST 2.0-ready billing, batch-wise inventory and compliance for Indian pharmacies. Built by Calcutta Node." />
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
