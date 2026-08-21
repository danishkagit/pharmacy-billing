// GST 2.0 rate registry for Indian pharmacy billing.
// 56th GST Council (03-Sep-2025) rationalised slabs to Nil / 5% / 18% / 40%
// effective 22-Sep-2025 (Notif. 09/2025-IT(R) & 09-16/2025-CT(R)). The 12% and
// 28% slabs stand abolished; virtually all medicines (Ch. 30) moved to 5%,
// with notified life-saving drugs fully exempt (Nil).

const GST_EFFECTIVE_DATE = '2025-09-22';

const GST_SLABS = [0, 5, 18, 40];

const DEFAULT_MEDICINE_GST = 5;

// Category-wise default rates for a retail/wholesale pharmacy catalogue.
const CATEGORY_GST_MAP = {
  tablet: 5,
  capsule: 5,
  syrup: 5,
  injection: 5,
  ointment: 5,
  drop: 5,
  inhaler: 5,
  powder: 5,
  cream: 5,
  lotion: 5,
  sachet: 5,
  other: 5
};

// HSN chapter defaults commonly stocked by pharmacies.
const HSN_DEFAULT_RATES = {
  '3001': 5,  // glands/organs & extracts (bulk drugs)
  '3002': 5,  // vaccines, blood, immunological products
  '3003': 5,  // medicaments, unmixed doses (APIs)
  '3004': 5,  // medicaments, mixed/put up in measured doses — the pharma mainstay
  '3005': 5,  // wadding, gauze, bandages, dressings
  '3006': 5,  // first-aid kits, pharma goods n.e.s.
  '1302': 5,  // vegetable saps/extracts (ayurvedic/herbal)
  '2106': 5,  // food/nutraceutical/health supplements
  '3304': 5,  // skin-care preparations, cosmetics
  '3306': 5,  // oral-care preparations
  '3401': 5,  // soaps
  '3808': 5,  // disinfectants
  '4015': 5,  // surgical/exam rubber gloves
  '9001': 5,  // spectacle/contact lenses
  '9003': 5,  // spectacle frames
  '9004': 5,  // corrective spectacles/goggles
  '9018': 5,  // medical/surgical instruments incl. syringes, needles, catheters
  '9019': 5,  // mechanotherapy appliances
  '9020': 5,  // breathing appliances, nebulisers
  '9021': 5,  // hearing aids, orthopaedic appliances
  '9022': 5,  // X-ray/radiotherapy apparatus
  '9025': 5,  // thermometers, BP monitors (measuring instruments)
  '9027': 5,  // diagnostic kits/reagents, glucometer strips
  '9619': 5   // sanitary napkins (Nil) / baby & adult diapers (5%)
};

// Notified items that remain outside GST or sit on special rates.
const SPECIAL_RATE_NOTES = {
  'sanitary_napkins': { hsn: '9619', rate: 0, note: 'Sanitary napkins exempt (Nil)' },
  'contraceptives': { rate: 0, note: 'Condoms/contraceptives exempt (Nil)' },
  'sunglasses': { hsn: '9004', rate: 18, note: 'Non-corrective goggles/sunglasses at 18%' },
  'carbonated_beverages': { rate: 40, note: 'Aerated sugary/caffeinated drinks at 40% demerit slab' },
  'pan_masala_gutkha': { rate: 40, note: 'Pan masala/gutkha at 40% w.e.f. 01-Feb-2026, valued on RSP' },
  'life_saving_exempt': {
    note: '36 notified life-saving drugs (cancer/rare/severe chronic) moved from 12%/5% to Nil w.e.f. 22-Sep-2025; ITC on inputs attributable must be reversed.'
  }
};

function suggestGstRate({ hsn, category } = {}) {
  if (hsn && HSN_DEFAULT_RATES[String(hsn).slice(0, 4)] !== undefined) {
    return HSN_DEFAULT_RATES[String(hsn).slice(0, 4)];
  }
  return CATEGORY_GST_MAP[category] || DEFAULT_MEDICINE_GST;
}

// Indian-format amount in words ("Rupees One Lakh Twenty Five Thousand and Fifty Paise Only")
function numberToWords(num) {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const twoDigits = (n) => {
    if (n < 20) return ones[n];
    return `${tens[Math.floor(n / 10)]}${n % 10 ? ' ' + ones[n % 10] : ''}`;
  };
  const threeDigits = (n) => {
    const h = Math.floor(n / 100);
    const rest = n % 100;
    return `${h ? ones[h] + ' Hundred' : ''}${h && rest ? ' ' : ''}${rest ? twoDigits(rest) : ''}`;
  };

  let n = Math.floor(Math.abs(num));
  if (n === 0) return 'Zero';
  const parts = [];
  const crore = Math.floor(n / 10000000); n %= 10000000;
  const lakh = Math.floor(n / 100000); n %= 100000;
  const thousand = Math.floor(n / 1000); n %= 1000;

  if (crore) parts.push(`${threeDigits(crore)} Crore`);
  if (lakh) parts.push(`${twoDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${twoDigits(thousand)} Thousand`);
  if (n) parts.push(threeDigits(n));
  return parts.join(' ');
}

function amountInWords(amount, currency = 'Rupees') {
  const value = Number(amount) || 0;
  const rupees = Math.floor(value);
  const paise = Math.round((value - rupees) * 100);
  let words = `${currency} ${numberToWords(rupees)}`;
  if (paise > 0) words += ` and ${numberToWords(paise)} Paise`;
  return `${words} Only`;
}

module.exports = {
  GST_SLABS,
  GST_EFFECTIVE_DATE,
  DEFAULT_MEDICINE_GST,
  CATEGORY_GST_MAP,
  HSN_DEFAULT_RATES,
  SPECIAL_RATE_NOTES,
  suggestGstRate,
  amountInWords,
  numberToWords
};
