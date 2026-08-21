// GST 2.0 (56th Council, effective 22-Sep-2025) — slabs Nil / 5% / 18% / 40%.
export const GST_SLABS = [0, 5, 18, 40];
export const DEFAULT_MEDICINE_GST = 5;
export const GST_EFFECTIVE_DATE = '2025-09-22';

// State codes (first two digits of GSTIN) for auto inter-state detection.
export const STATE_CODES = {
  '01': 'Jammu & Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab', '04': 'Chandigarh',
  '05': 'Uttarakhand', '06': 'Haryana', '07': 'Delhi', '08': 'Rajasthan', '09': 'Uttar Pradesh',
  '10': 'Bihar', '11': 'Sikkim', '12': 'Arunachal Pradesh', '13': 'Nagaland', '14': 'Manipur',
  '15': 'Mizoram', '16': 'Tripura', '17': 'Meghalaya', '18': 'Assam', '19': 'West Bengal',
  '20': 'Jharkhand', '21': 'Odisha', '22': 'Chhattisgarh', '23': 'Madhya Pradesh',
  '24': 'Gujarat', '26': 'Dadra & Nagar Haveli & Daman & Diu', '27': 'Maharashtra',
  '29': 'Karnataka', '30': 'Goa', '31': 'Lakshadweep', '32': 'Kerala', '33': 'Tamil Nadu',
  '34': 'Puducherry', '35': 'Andaman & Nicobar Islands', '36': 'Telangana', '37': 'Andhra Pradesh',
  '38': 'Ladakh', '97': 'Other Territory'
};

export function stateCodeFromGstin(gstin) {
  return String(gstin || '').slice(0, 2).toUpperCase();
}

export function isInterStateSupply(sellerGstin, buyerGstin) {
  if (!sellerGstin || !buyerGstin || String(buyerGstin).length < 2) return false;
  return stateCodeFromGstin(sellerGstin) !== stateCodeFromGstin(buyerGstin);
}

// Inclusive-of-tax breakdown (pharma MRP billing default):
// taxable = net × 100 / (100 + rate)
export function inclusiveBreakup(netAmount, gstRate, interState = false) {
  const rate = Number(gstRate) || 0;
  const taxable = +(netAmount / (1 + rate / 100)).toFixed(2);
  const tax = +(netAmount - taxable).toFixed(2);
  if (interState) return { taxable, igst: tax, cgst: 0, sgst: 0, totalTax: tax };
  const cgst = +(tax / 2).toFixed(2);
  return { taxable, cgst, sgst: +(tax - cgst).toFixed(2), igst: 0, totalTax: tax };
}

function numberToWords(num) {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const two = n => (n < 20 ? ones[n] : `${tens[Math.floor(n / 10)]}${n % 10 ? ' ' + ones[n % 10] : ''}`);
  const three = n => {
    const h = Math.floor(n / 100), rest = n % 100;
    return `${h ? ones[h] + ' Hundred' : ''}${h && rest ? ' ' : ''}${rest ? two(rest) : ''}`;
  };
  let n = Math.floor(Math.abs(num));
  if (n === 0) return 'Zero';
  const parts = [];
  const crore = Math.floor(n / 10000000); n %= 10000000;
  const lakh = Math.floor(n / 100000); n %= 100000;
  const thousand = Math.floor(n / 1000); n %= 1000;
  if (crore) parts.push(`${three(crore)} Crore`);
  if (lakh) parts.push(`${two(lakh)} Lakh`);
  if (thousand) parts.push(`${two(thousand)} Thousand`);
  if (n) parts.push(three(n));
  return parts.join(' ');
}

export function amountInWords(amount) {
  const value = Number(amount) || 0;
  const rupees = Math.floor(value);
  const paise = Math.round((value - rupees) * 100);
  let words = `Rupees ${numberToWords(rupees)}`;
  if (paise > 0) words += ` and ${numberToWords(paise)} Paise`;
  return `${words} Only`;
}

// Rate-wise summary rows from invoice items (inclusive amounts).
export function rateWiseSummary(items, interState = false) {
  const map = {};
  (items || []).forEach(it => {
    const rate = Number(it.gstRate) || 0;
    if (!map[rate]) map[rate] = { gstRate: rate, qty: 0, taxableValue: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0 };
    const amount = it.amount != null ? it.amount : ((it.qty || 0) * (it.rate || 0));
    const taxable = it.taxableValue != null ? it.taxableValue : amount / (1 + rate / 100);
    const tax = amount - taxable;
    map[rate].qty += it.qty || 0;
    map[rate].taxableValue += taxable;
    if (interState || it.igstAmount > 0) map[rate].igst += tax;
    else { map[rate].cgst += tax / 2; map[rate].sgst += tax - tax / 2; }
    map[rate].totalTax += tax;
  });
  return Object.values(map)
    .map(r => ({ ...r, taxableValue: +r.taxableValue.toFixed(2), cgst: +r.cgst.toFixed(2), sgst: +r.sgst.toFixed(2), igst: +r.igst.toFixed(2), totalTax: +r.totalTax.toFixed(2) }))
    .sort((a, b) => a.gstRate - b.gstRate);
}
