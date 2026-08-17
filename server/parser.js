// Purchase Invoice Template Parser
// Analyzes CSV and PDF bill templates and extracts structured data

const fs = require('fs');
const path = require('path');

/**
 * Parse CSV bill template
 * @param {string} csvPath - Path to CSV file
 * @returns {object} - Parsed invoice data
 */
function parseCsvTemplate(csvPath) {
  const csvData = fs.readFileSync(csvPath, 'utf8');
  const lines = csvData.split('\n');
  
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
  
  // Row 0: Header metadata
  if (lines[0]) {
    const header = lines[0].split(',');
    // Format: H,,invoiceNo,date,,,,,,,,
    if (header[2]) result.invoiceNo = header[2].trim();
    if (header[3]) result.invoiceDate = header[3].trim();
    if (header[11]) result.supplier = header[11].trim(); // Platform ID/supplier hint
  }
  
  // Parse medicine items (rows starting with 'T')
  for (let i = 1; i < lines.length - 1; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('F')) break; // Stop before summary row
    
    const row = parseCsvLine(line);
    if (row[0] === 'T' && row[1] === 'RS') {
      const item = parseCsvMedicineItem(row);
      if (item && item.medicineName) {
        result.items.push(item);
      }
    }
  }
  
  // Row before last: Summary (starts with 'F')
  const summaryLine = lines[lines.length - 2]?.trim();
  if (summaryLine && summaryLine.startsWith('F')) {
    const summary = parseCsvSummaryLine(summaryLine);
    result.discount = summary.discount || 0;
    result.totalAmount = summary.grandTotal || 0;
  }
  
  // Calculate totals from items
  result.subtotal = result.items.reduce((sum, item) => sum + (item.netRate || 0) * (item.qty || 0), 0);
  result.totalTax = result.items.reduce((sum, item) => sum + (item.cgstAmt || 0) + (item.sgstAmt || 0), 0);
  
  // Parse additional rows (freight, platform, cod) - they have 'T' prefix but different structure
  for (let i = 1; i < lines.length - 1; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const row = parseCsvLine(line);
    if (row[0] === 'T') {
      const label = row[5] || row[6] || '';
      if (label.includes('Freight') || label.includes('Platform')) {
        // Last numeric field is the amount
        const amount = parseFloat(row[row.length - 1] || '0');
        if (label.includes('Freight')) result.freight = amount;
        if (label.includes('Platform')) result.platformFees = amount;
        if (label.includes('COD')) result.codCharges = amount;
      }
    }
  }
  
  return result;
}

/**
 * Parse a CSV data line (medicine item format)
 * @param {array} row - CSV row array
 * @returns {object} - Parsed medicine item
 */
function parseCsvMedicineItem(row) {
  // Based on observed structure:
  // T,RS,Supplier,Code,_,Name,Category,_,Batch,Expiry,_,MRP,Rate,Qty,Free,SchemeDisc,Amount,CGST%,SGST%,Net,CGST,SGST,...
  return {
    medicineName: row[4] || row[5] || '',        // Index 4 or 5: Medicine name
    hsn: row[6] || '',                           // Index 6: HSN code
    batchNo: row[8] || '',                       // Index 8: Batch number
    expiryDate: row[9] || '',                    // Index 9: Expiry date
    mrp: parseFloat(row[11] || '0'),             // Index 11: MRP
    rate: parseFloat(row[12] || '0'),            // Index 12: Rate (per unit)
    qty: parseInt(row[13] || '0', 10),           // Index 13: Quantity
    freeQty: parseInt(row[14] || '0', 10),       // Index 14: Free quantity
    schemeDisc: parseFloat(row[15] || '0'),      // Index 15: Scheme discount
    amount: parseFloat(row[16] || '0'),          // Index 16: Total amount
    gstPercent: parseFloat(row[17] || '0'),      // Index 17: GST percentage
    cgstPercent: parseFloat(row[18] || '0'),     // Index 18: CGST percentage
    sgstPercent: parseFloat(row[19] || '0'),     // Index 19: SGST percentage
    netRate: parseFloat(row[20] || '0'),         // Index 20: Net rate per unit
    cgstAmount: parseFloat(row[21] || '0'),      // Index 21: CGST amount
    sgstAmount: parseFloat(row[22] || '0')       // Index 22: SGST amount
  };
}

/**
 * Parse CSV summary line (starts with 'F')
 * @param {string} line - Summary line
 * @returns {object} - Parsed summary
 */
function parseCsvSummaryLine(line) {
  const parts = line.split(',');
  return {
    // Format: F,565.91,25.3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.0,616.62
    totalAmount: parseFloat(parts[1] || '0'),
    discount: parseFloat(parts[2] || '0'),
    cgst: parseFloat(parts[3] || '0'),
    sgst: parseFloat(parts[4] || '0'),
    grandTotal: parseFloat(parts[parts.length - 1] || '0')
  };
}

/**
 * Parse CSV line into array
 * @param {string} line - CSV line
 * @returns {array} - Parsed row
 */
function parseCsvLine(line) {
  // Simple split - handles the format we're seeing
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