const PDFDocument = require('pdfkit-table');
const path = require('path');
const fs = require('fs');
const { amountInWords } = require('./gstSlabs');

function money(n) {
  const v = Number(n) || 0;
  const neg = v < 0 ? '-' : '';
  return `${neg}\u20B9${Math.abs(v).toFixed(2)}`;
}

// GST tax invoice (Rule 46) + D&C Rules r.65(5) pharma fields.
// onDocReady(doc) is invoked BEFORE any content is written so callers can
// attach pipe targets / collectors safely.
function generateInvoice(invoice, options = {}, onDocReady = null) {
  const company = invoice.companyRef || options.company || {};
  const doc = new PDFDocument({ size: 'A4', margin: 36 });
  const leftMargin = 36;
  const pageWidth = doc.page.width - leftMargin * 2;
  const isComposition = company.gstType === 'composition';
  const title = isComposition ? 'BILL OF SUPPLY' : 'TAX INVOICE';
  const copies = Math.max(1, Math.min(3, company.billCopies || 1));
  const copyLabels = ['Original for Recipient', 'Duplicate for Supplier', 'Triplicate'];
  if (typeof onDocReady === 'function') onDocReady(doc);

  const showHsn = company.showHsnOnPrint !== false;
  const showExp = company.showExpiryOnPrint !== false;

  for (let copyIdx = 0; copyIdx < copies; copyIdx++) {
    let y = 40;

    // ---- Header ----
    doc.fontSize(16).font('Helvetica-Bold').text(company.name || 'Pharmacy', leftMargin, y, { align: 'center', width: pageWidth });
    y = doc.y + 2;
    doc.fontSize(8).font('Helvetica')
      .text([company.address, company.city, company.state, company.pincode].filter(Boolean).join(', '), { align: 'center', width: pageWidth });
    const regLines = [
      [company.gstin ? `GSTIN: ${company.gstin}` : '', company.pan ? `PAN: ${company.pan}` : ''].filter(Boolean).join('  |  '),
      [
        company.dlNo && !isComposition ? `DL(Retail): ${company.dlNo}` : '',
        company.dlNoWholesale && (invoice.type === 'wholesale' || company.drugLicenseCategory === 'wholesale') ? `DL(Wholesale): ${company.dlNoWholesale}` : ''
      ].filter(Boolean).join('  |  '),
      [company.phone ? `Ph: ${company.phone}` : '', company.email].filter(Boolean).join('  |  ')
    ].filter(Boolean);
    regLines.forEach(l => { doc.fontSize(8).text(l, { align: 'center', width: pageWidth }); });
    y = doc.y + 4;
    doc.moveTo(leftMargin, y).lineTo(leftMargin + pageWidth, y).stroke();
    y += 14;

    doc.fontSize(11).font('Helvetica-Bold').text(title, leftMargin, y, { align: 'center', width: pageWidth });
    if (copies > 1) {
      doc.fontSize(7).font('Helvetica').text(copyLabels[copyIdx] || '', leftMargin, y - 10, { align: 'right', width: pageWidth });
    }
    y = doc.y + 12;

    // ---- Buyer / invoice meta ----
    doc.fontSize(8).font('Helvetica-Bold');
    doc.text(`Invoice No: ${invoice.invoiceNo}`, leftMargin, y);
    doc.text(`Date: ${invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString('en-IN') : '-'}`, leftMargin + 150, y);
    doc.text(`Payment: ${String(invoice.paymentMode || 'cash').toUpperCase()}`, leftMargin + 280, y);
    doc.text(`Place of Supply: ${invoice.placeOfSupply || (invoice.customerGstin ? String(invoice.customerGstin).slice(0, 2) : company.state || '-')}`, leftMargin + 380, y);
    y += 12;
    doc.font('Helvetica');
    doc.text(`Billed To: ${invoice.customerName || 'Walk-in Customer'}`, leftMargin, y);
    if (invoice.customerGstin) doc.text(`GSTIN: ${invoice.customerGstin}`, leftMargin + 200, y);
    if (invoice.customerPhone) doc.text(`Ph: ${invoice.customerPhone}`, leftMargin + 360, y);
    y += 11;
    const rxBits = [
      invoice.prescriptionNo ? `Rx: ${invoice.prescriptionNo}` : '',
      invoice.doctorName ? `Dr. ${invoice.doctorName}` : '',
      invoice.patientName ? `Patient: ${invoice.patientName}` : ''
    ].filter(Boolean).join('   ');
    if (rxBits) { doc.fontSize(8).font('Helvetica').text(rxBits, leftMargin, y); y += 11; }

    y += 4;

    // ---- Items table ----
    const headers = ['#', 'Medicine', ...(showHsn ? ['HSN'] : []), 'Batch', ...(showExp ? ['Exp'] : []), 'Qty', 'MRP', 'Rate', 'Disc%', 'Taxable', 'GST%', 'Amount'];
    const colWidths = [16, 118, ...(showHsn ? [32] : []), 42, ...(showExp ? [36] : []), 22, 34, 36, 26, 46, 26, 50];
    const totalW = colWidths.reduce((a, b) => a + b, 0);

    doc.rect(leftMargin, y, totalW, 14).fill('#eef2f5').stroke();
    doc.fill('#000').fontSize(7).font('Helvetica-Bold');
    let x = leftMargin;
    headers.forEach((h, i) => {
      doc.text(h, x + 2, y + 4, { width: colWidths[i], align: i === 0 ? 'center' : (i === 1 ? 'left' : 'right') });
      x += colWidths[i];
    });
    y += 14;
    doc.fontSize(7).font('Helvetica');

    const hsnAgg = {};
    (invoice.items || []).forEach((item, idx) => {
      if (y > 700) { doc.addPage(); y = 40; }
      const gstRate = item.gstRate || 0;
      const taxable = item.taxableValue != null ? item.taxableValue : (item.amount || 0) - (item.gstAmount || 0);
      const key = `${item.hsn || '3004'}|${gstRate}`;
      if (!hsnAgg[key]) hsnAgg[key] = { hsn: item.hsn || '3004', gstRate, taxableValue: 0, tax: 0 };
      hsnAgg[key].taxableValue += taxable;
      hsnAgg[key].tax += item.gstAmount || 0;
      x = leftMargin;
      const expStr = item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('en-IN', { month: '2-digit', year: '2-digit' }) : '-';
      const row = [
        String(idx + 1),
        String(item.medicineName || '').slice(0, 34),
        ...(showHsn ? [item.hsn || '3004'] : []),
        item.batchNo || '-',
        ...(showExp ? [expStr] : []),
        String(item.qty || 0),
        String(item.mrp ?? ''),
        String(item.rate ?? ''),
        `${item.discountPercent || 0}%`,
        taxable.toFixed(2),
        gstRate ? `${gstRate}%` : 'NIL',
        (item.amount || 0).toFixed(2)
      ];
      row.forEach((val, i) => {
        doc.text(val, x + 2, y + 3, { width: colWidths[i], align: i === 0 ? 'center' : (i === 1 ? 'left' : 'right') });
        x += colWidths[i];
      });
      y += 13;
    });

    y += 4;
    doc.moveTo(leftMargin, y).lineTo(leftMargin + totalW, y).stroke();
    y += 10;

    // ---- Totals ----
    const totalsX = leftMargin + totalW - 210;
    const label = (t, v, bold = false) => {
      doc.fontSize(bold ? 9 : 8).font(bold ? 'Helvetica-Bold' : 'Helvetica');
      doc.text(t, totalsX, y);
      doc.text(v, totalsX + 140, y, { width: 70, align: 'right' });
      y += 12;
    };
    const itemDiscountTotal = (invoice.items || []).reduce((s, i) => s + (i.discount || 0), 0);
    label(`Subtotal`, money(invoice.subtotal));
    if (itemDiscountTotal > 0) label(`Item Discount`, `- ${money(itemDiscountTotal)}`);
    if (invoice.customerDiscount > 0) label(`Customer Discount (${invoice.customerDiscountPercent || 0}%)`, `- ${money(invoice.customerDiscount)}`);
    if ((invoice.taxAmount || 0) >= 0 && !isComposition) label(`Taxable Value`, money(invoice.subtotal - invoice.taxAmount));
    if (!isComposition) {
      if (invoice.cgst > 0) label('CGST', money(invoice.cgst));
      if (invoice.sgst > 0) label('SGST', money(invoice.sgst));
      if (invoice.igst > 0) label('IGST', money(invoice.igst));
    }
    if (invoice.roundOff) label('Round Off', `${invoice.roundOff > 0 ? '+' : ''}${money(invoice.roundOff)}`);
    doc.moveTo(totalsX, y).lineTo(totalsX + 210, y).stroke();
    y += 3;
    doc.fontSize(11).font('Helvetica-Bold');
    doc.text('Grand Total', totalsX, y);
    doc.text(money(invoice.totalAmount), totalsX + 140, y, { width: 70, align: 'right' });
    y += 16;

    // ---- Amount in words ----
    doc.fontSize(7.5).font('Helvetica-Bold').text('Amount in Words:', leftMargin, y);
    doc.fontSize(7.5).font('Helvetica').text(amountInWords(invoice.totalAmount), leftMargin + 75, y, { width: totalW - 80 });
    y = doc.y + 8;

    // ---- HSN/rate-wise summary ----
    const aggList = Object.values(hsnAgg);
    if (!isComposition && aggList.length) {
      doc.fontSize(8).font('Helvetica-Bold').text('Rate-wise Tax Summary', leftMargin, y);
      y += 13;
      doc.fontSize(7).font('Helvetica-Bold');
      doc.text('HSN', leftMargin, y);
      doc.text('Taxable', leftMargin + 90, y, { width: 70, align: 'right' });
      doc.text('GST%', leftMargin + 165, y, { width: 35, align: 'right' });
      doc.text('CGST', leftMargin + 205, y, { width: 65, align: 'right' });
      doc.text('SGST', leftMargin + 275, y, { width: 65, align: 'right' });
      doc.text('IGST', leftMargin + 345, y, { width: 65, align: 'right' });
      doc.text('Total Tax', leftMargin + 415, y, { width: 60, align: 'right' });
      y += 11;
      doc.font('Helvetica');
      aggList.forEach(r => {
        const half = invoice.igst > 0 ? 0 : r.tax / 2;
        doc.text(r.hsn, leftMargin, y);
        doc.text(r.taxableValue.toFixed(2), leftMargin + 90, y, { width: 70, align: 'right' });
        doc.text(`${r.gstRate}%`, leftMargin + 165, y, { width: 35, align: 'right' });
        doc.text(half.toFixed(2), leftMargin + 205, y, { width: 65, align: 'right' });
        doc.text(half.toFixed(2), leftMargin + 275, y, { width: 65, align: 'right' });
        doc.text((invoice.igst > 0 ? r.tax : 0).toFixed(2), leftMargin + 345, y, { width: 65, align: 'right' });
        doc.text(r.tax.toFixed(2), leftMargin + 415, y, { width: 60, align: 'right' });
        y += 11;
      });
      y += 4;
    }

    // ---- Bank / UPI + declarations + signature ----
    if (y > 690) { doc.addPage(); y = 40; }
    const bankBits = [
      company.bankName ? `Bank: ${company.bankName}` : '',
      company.bankAccountNo ? `A/c: ${company.bankAccountNo}` : '',
      company.bankIfsc ? `IFSC: ${company.bankIfsc}` : '',
      company.upiId ? `UPI: ${company.upiId}` : ''
    ].filter(Boolean).join('  |  ');
    if (bankBits) { doc.fontSize(7.5).font('Helvetica-Bold').text(bankBits, leftMargin, y); y = doc.y + 6; }

    const declarations = [];
    if (isComposition) declarations.push('Composition taxable person — not entitled to collect tax on supplies.');
    if (invoice.isScheduleH1 && company.scheduleWarningNote !== false) declarations.push(company.scheduleWarningNote || 'Schedule H/H1 drugs to be sold only against the prescription of a Registered Medical Practitioner.');
    if (invoice.isScheduleX) declarations.push('Contains Schedule X drug — entry recorded in narcotics register.');
    declarations.push(company.declarationNote || 'Goods once sold will not be taken back or exchanged.');
    declarations.push('All prices are inclusive of taxes as per MRP where applicable. E.&O.E.');
    doc.fontSize(7).font('Helvetica');
    declarations.forEach(d => { doc.text(`* ${d}`, leftMargin, y, { width: totalW - 160 }); y = doc.y + 3; });

    doc.fontSize(8).font('Helvetica-Bold').text(`For ${company.name || 'Pharmacy'}`, leftMargin + totalW - 150, y + 6, { width: 150, align: 'center' });
    doc.fontSize(7).font('Helvetica').text('Authorised Signatory', leftMargin + totalW - 150, y + 40, { width: 150, align: 'center' });

    if (copyIdx < copies - 1) {
      doc.addPage();
    }
  }

  doc.end();
  return doc;
}

function generateExpiryReport(items) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    doc.fontSize(16).font('Helvetica-Bold').text('Expiry Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(9).text(`Generated: ${new Date().toLocaleString('en-IN')}`, { align: 'center' });
    doc.moveDown();

    const headers = ['Medicine', 'Batch No', 'Expiry', 'Qty', 'MRP', 'Days Left'];
    const colWidths = [150, 80, 80, 50, 50, 60];
    const leftMargin = 40;

    doc.fontSize(9).font('Helvetica-Bold');
    let xPos = leftMargin;
    headers.forEach((h, i) => {
      doc.text(h, xPos + 2, doc.y, { width: colWidths[i] });
      xPos += colWidths[i];
    });
    doc.moveDown(0.3);
    doc.fontSize(8).font('Helvetica');

    items.forEach(item => {
      const remaining = Math.ceil((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
      xPos = leftMargin;
      const row = [item.medicineName || '', item.batchNo || '', new Date(item.expiryDate).toLocaleDateString('en-IN'), String(item.qty), String(item.mrp || 0), String(remaining)];
      row.forEach((val, i) => {
        doc.text(val, xPos + 2, doc.y, { width: colWidths[i] });
        xPos += colWidths[i];
      });
      doc.moveDown(0.5);
    });

    doc.end();
  });
}

module.exports = { generateInvoice, generateExpiryReport };
