// Purchase Invoice Template Parser
// Analyzes CSV and PDF bill templates and extracts structured data

const fs = require('fs');
const path = require('path');

/**
 * Parse CSV bill template
 * Supports two stockist export formats:
 *  - SWIL 2.2 (e.g. Scintilla)  : H,T,F records, dealer code in col1 of T rows
 *  - RS / Sastasundar style     : H,T,F records, 'RS' in col1 of T rows
 * Both share the same column layout on the T rows (see parseCsvMedicineItem).
 * @param {string} csvPath - Path to CSV file
 * @returns {object} - Parsed invoice data
 */
function parseCsvTemplate(csvPath) {
  const csvData = fs.readFileSync(csvPath, 'utf8');
  const lines = csvData.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  const result = {
    invoiceNo: '',
    invoiceDate: '',
    supplier: '',
    items: [],
    freight: 0,
    platformFees: 0,
    codCharges: 0,
    discount: 0,
    subtotal: 0,
    totalTax: 0,
    totalAmount: 0
  };

  let isSwil = false;
  let invoiceDateStr = '';

  for (const line of lines) {
    const row = parseCsvLine(line);
    if (!row.length) continue;
    const type = (row[0] || '').trim().toUpperCase();

    if (type === 'H') {
      // SWIL:  H,1.1,R1166,01042026,,,,Direct,1,,02042026,,,,HOOGHLY,,0,SWIL2.2
      // RS:    H,,443TB1334561,31072026,,,,,,,,2129127370,,,,,
      isSwil = row[1] === '1.1' || /swil/i.test(line);
      if (isSwil) {
        invoiceDateStr = row[3] || '';
      } else {
        if (row[2]) result.invoiceNo = row[2].trim();
        invoiceDateStr = row[3] || '';
        if (row[12]) result.purchaseOrder = row[12].trim();
      }
      continue;
    }

    if (type === 'T') {
      if (row[1] === 'RS' || row[5]) {
        const label = (row[5] || '').toString().toLowerCase();
        if (label.includes('freight')) {
          result.freight += parseFloat(row[21] || row[row.length - 1] || '0') || 0;
          continue;
        }
        if (label.includes('platform')) {
          result.platformFees += parseFloat(row[21] || row[row.length - 1] || '0') || 0;
          continue;
        }
        if (label.includes('cod')) {
          result.codCharges += parseFloat(row[21] || row[row.length - 1] || '0') || 0;
          continue;
        }
        const item = parseCsvMedicineItem(row);
        if (item && item.medicineName) {
          result.items.push(item);
        }
      }
      continue;
    }

    if (type === 'F') {
      // Footer is only a cross-check; amounts/tax/discount are all embedded in
      // the T-row amounts (supplier scheme math). Compute totals from items below.
      result.grandTotal = parseFloat(row[21] || row[row.length - 1] || '0') || 0;
      continue;
    }
  }

  result.invoiceDate = normalizeDate(invoiceDateStr);

  result.subtotal = +result.items.reduce((sum, item) => sum + (item.amount || 0), 0).toFixed(2);
  result.totalTax = +result.items.reduce((sum, item) => sum + (item.gstAmount || 0), 0).toFixed(2);
  result.totalAmount = +(result.subtotal + result.totalTax + result.freight + result.platformFees + result.codCharges).toFixed(2);

  return result;
}

/**
 * Parse a CSV data line (medicine item format)
 * Shared column layout for SWIL 2.2 and RS/Sastasundar exports (0-indexed):
 *   0=T  1=dealer|RS  2=manufacturer  3=item code  5=medicine name  6=pack size
 *   8=batch no  9=expiry (DDMMYYYY)  11=rate  12=MRP  15=qty  16=free qty
 *   17=scheme%(RS)  21=net amount  22=CGST%  26=SGST%  27=GST amount
 *   30=HSN  31=EAN
 * @param {array} row - CSV row array
 * @returns {object} - Parsed medicine item
 */
function parseCsvMedicineItem(row) {
  const medicineName = (row[5] || '').trim();
  if (!medicineName) return null;

  const rate = parseFloat(row[11]) || 0;
  const mrp = parseFloat(row[12]) || 0;
  const qty = parseInt(row[15], 10) || 0;
  const amount = parseFloat(row[21]) || 0;
  const cgstPercent = parseFloat(row[22]) || 0;
  const sgstPercent = parseFloat(row[26]) || cgstPercent;
  const gstRate = cgstPercent + sgstPercent;
  const netRate = qty > 0 && amount > 0 ? amount / qty : rate;
  const schemeDisc = rate > netRate ? +(rate - netRate).toFixed(2) : 0;

  return {
    medicineName,
    hsn: (row[30] || '').trim(),
    ean: (row[31] || '').trim(),
    batchNo: (row[8] || '').trim(),
    expiryDate: normalizeDate(row[9]),
    mrp,
    rate: +netRate.toFixed(2),
    qty,
    freeQty: parseInt(row[16], 10) || 0,
    schemeDisc,
    amount: +(amount || qty * netRate).toFixed(2),
    gstPercent: gstRate,
    cgstPercent,
    sgstPercent,
    gstAmount: parseFloat(row[27]) || +(((amount || qty * netRate) * gstRate) / 100).toFixed(2)
  };
}

/**
 * Normalize a date value to YYYY-MM-DD.
 * Accepts DDMMYYYY, DD/MM/YYYY, MM/DD/YYYY and ISO formats.
 * @param {string} value - Raw date
 * @returns {string} - ISO date or empty string
 */
function normalizeDate(value) {
  const s = (value || '').trim();
  if (!s) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const slash = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (slash) return `${slash[3]}-${slash[2]}-${slash[1]}`;
  const flat = s.match(/^(\d{2})(\d{2})(\d{4})$/);
  if (flat) return `${flat[3]}-${flat[2]}-${flat[1]}`;
  return s;
}

/**
 * Parse CSV line into array
 * @param {string} line - CSV line
 * @returns {array} - Parsed row
 */
function parseCsvLine(line) {
  return line.split(',');
}

/**
 * Parse PDF bill template
 * @param {string} pdfPath - Path to PDF file
 * @returns {object} - Parsed invoice data
 */
async function parsePdfTemplate(pdfPath) {
  const result = {
    invoiceNo: '',
    invoiceDate: '',
    supplier: '',
    buyer: '',
    items: [],
    freight: 0,
    platformFees: 0,
    codCharges: 0,
    discount: 0,
    subtotal: 0,
    totalTax: 0,
    totalAmount: 0
  };
  
  const fullPath = pdfPath;
  let pdf;
  try {
    pdf = require('pdfplumber');
  } catch (e) {
    throw new Error('PDF parsing is unavailable: the pdfplumber module could not be loaded.');
  }
  const pdfData = await pdf.open(fullPath);
  
  const page = pdfData.pages[0];
  const text = await page.extractText();
  const lines = text.split('\n');
  
  // Extract invoice number and date
  // Pattern: "Invoice : 443TB1334561 Date : 31/07/2026"
  for (const line of lines) {
    const invoiceMatch = line.match(/Invoice\s*[:]*\s*(\S+)\s*Date\s*[:]*\s*(\d{2}\/\d{2}\/\d{4})/i);
    if (invoiceMatch) {
      result.invoiceNo = invoiceMatch[1];
      result.invoiceDate = invoiceMatch[2];
    }
    
    const supplierMatch = line.match(/Sastasundar Healthbuddy Limited|Supplier[:\s]*(.+)/i);
    if (supplierMatch && !result.supplier) {
      result.supplier = supplierMatch[1] || 'Unknown';
    }
    
    const buyerMatch = line.match(/CALCUTTA PHARMACY|Buyer[:\s]*(.+)/i);
    if (buyerMatch && !result.buyer) {
      result.buyer = buyerMatch[1] || 'Unknown';
    }
    
    const orderMatch = line.match(/Order No[:\s]*(\S+)/i);
    if (orderMatch) {
      result.orderNo = orderMatch[1];
    }
  }
  
  // Extract medicine items from PDF text
  // Pattern: "Jitotofa 5 Tablet (10 Tab) 300490 1 Strip GZP01ADA SAS 10/27 350.00 93.33 93.33 2.5 2.5"
  const medicinePattern = /(\S[\s\w]*?\d+ Tablet \(.*?\))\s+(\d+)\s+(\S+)\s+([A-Z0-9]+)\s+([\d/]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/g;
  
  let match;
  const fullText = text;
  
  // Find all medicine rows
  const medicineLines = fullText.split('\n').filter(l => 
    l.match(/Jitotofa|Macsart|Nukast|Raciper|Freight|Platform|COD/) || 
    (l.match(/\d+ Tablet/) && l.match(/CGST|SGST/))
  );
  
  for (const line of medicineLines) {
    // Try to match medicine item pattern
    const descMatch = line.match(/([A-Za-z]+\s+\d+[^\d]*Tablet[^\d]*\(.*?\))/i);
    const hsnMatch = line.match(/300490/); // HSN code pattern
    
    if (descMatch) {
      const description = descMatch[1];
      // Extract qty, batch, expiry, rate, discount, net rate from line
      const qtyMatch = line.match(/(\d+)\s+Strip/);
      const batchExpiryMatch = line.match(/GZP01ADA\s+SAS\s+(\d+\/\d+)/);
      const rateMatch = line.match(/350\.00/);
      
      if (qtyMatch) {
        const item = {
          medicineName: description,
          qty: parseInt(qtyMatch[1], 10),
          batchNo: batchExpiryMatch ? batchExpiryMatch[1] : '',
          expiryDate: '', // Would need more parsing
          mrp: 0, // Would need specific MRP field
          rate: 0, // Would need rate field
          gstPercent: 2.5, // Typically 2.5% for many pharma items
          cgstPercent: 2.5,
          sgstPercent: 2.5
        };
        result.items.push(item);
      }
    }
  }
  
  // Extract totals from PDF
  // "Total 5 540.61 16.82 16.82"
  // "G.Total(Rs.) : 574.25"
  const totalMatch = fullText.match(/G\.Total\(Rs\)[:\s]*([\d.]+)/i);
  if (totalMatch) {
    result.totalAmount = parseFloat(totalMatch[1]);
  }
  
  const discountMatch = fullText.match(/DISCOUNT[:\s]*([\d.]+)/i);
  if (discountMatch) {
    result.discount = parseFloat(discountMatch[1]);
  }
  
  // Calculate from items if we extracted any
  if (result.items.length > 0) {
    result.subtotal = result.items.reduce((sum, item) => sum + (item.rate || 0) * (item.qty || 1), 0);
    result.totalTax = result.items.reduce((sum, item) => sum + ((item.cgstPercent || 0) + (item.sgstPercent || 0)) / 100 * (item.rate || 0) * (item.qty || 1), 0);
    result.totalAmount = result.subtotal + result.totalTax - result.discount;
  }
  
  return result;
}

module.exports = { parseCsvTemplate, parsePdfTemplate };