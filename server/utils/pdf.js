const PDFDocument = require('pdfkit-table');
const path = require('path');
const fs = require('fs');

function generateInvoice(invoice, type = 'retail') {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const leftMargin = 40;
    const pageWidth = 525;

    doc.fontSize(18).font('Helvetica-Bold').text(invoice.companyRef?.name || 'Pharmacy', leftMargin, 40, { align: 'center' });
    doc.fontSize(10).font('Helvetica').text(invoice.companyRef?.address || '', { align: 'center' });
    doc.fontSize(9).text(`GST: ${invoice.companyRef?.gstin || ''} | DL: ${invoice.companyRef?.dlNo || ''} | Phone: ${invoice.companyRef?.phone || ''}`, { align: 'center' });

    doc.moveDown(0.5);
    doc.moveTo(leftMargin, doc.y).lineTo(leftMargin + pageWidth, doc.y).stroke();
    doc.moveDown(0.5);

    const title = type === 'wholesale' ? 'WHOLESALE INVOICE' : 'RETAIL INVOICE';
    doc.fontSize(14).font('Helvetica-Bold').text(title, { align: 'center' });
    doc.moveDown(0.5);

    const invoiceNo = invoice.invoiceNo || 'N/A';
    const invoiceDate = invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString('en-IN') : 'N/A';

    doc.fontSize(9).font('Helvetica');
    doc.text(`Invoice No: ${invoiceNo}`, leftMargin);
    doc.text(`Date: ${invoiceDate}`, leftMargin + 200);
    doc.text(`Customer: ${invoice.customerName || 'Walk-in'}`, leftMargin + 380);
    doc.text(`Payment: ${invoice.paymentMode || 'cash'}`, leftMargin + 380);

    if (invoice.customerGstin) {
      doc.text(`GSTIN: ${invoice.customerGstin}`, leftMargin);
    }
    if (invoice.prescriptionNo) {
      doc.text(`Prescription: ${invoice.prescriptionNo}`, leftMargin);
    }

    doc.moveDown(0.5);
    const tableTop = doc.y;

    const headers = ['#', 'Medicine', 'Batch', 'Exp', 'Qty', 'Rate', 'Disc%', 'GST', 'Amount'];
    const colWidths = [20, 140, 60, 55, 30, 45, 35, 40, 55];
    let xPos = leftMargin;

    doc.fontSize(8).font('Helvetica-Bold');
    doc.rect(leftMargin, tableTop - 4, pageWidth, 16).fill('#f0f0f0').stroke();
    doc.fill('#000');
    headers.forEach((h, i) => {
      doc.text(h, xPos + 2, tableTop, { width: colWidths[i], align: i === 0 ? 'center' : 'left' });
      xPos += colWidths[i];
    });

    let yPos = tableTop + 16;
    doc.fontSize(8).font('Helvetica');
    (invoice.items || []).forEach((item, idx) => {
      if (yPos > 720) {
        doc.addPage();
        yPos = 40;
      }
      xPos = leftMargin;
      const row = [
        String(idx + 1),
        item.medicineName || '',
        item.batchNo || '',
        item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('en-IN') : '',
        String(item.qty || 0),
        String(item.rate || 0),
        String(item.discountPercent || 0),
        String(item.gstRate || 0) + '%',
        String(item.amount || 0)
      ];
      row.forEach((val, i) => {
        doc.text(val, xPos + 2, yPos, { width: colWidths[i], align: i === 0 ? 'center' : 'left' });
        xPos += colWidths[i];
      });
      yPos += 14;
    });

    doc.moveTo(leftMargin, yPos + 4).lineTo(leftMargin + pageWidth, yPos + 4).stroke();
    yPos += 10;

    doc.fontSize(10).font('Helvetica-Bold');
    doc.text(`Subtotal: ₹${(invoice.subtotal || 0).toFixed(2)}`, leftMargin + 350, yPos);
    yPos += 14;
    if (invoice.discountAmount) {
      doc.text(`Discount: -₹${(invoice.discountAmount || 0).toFixed(2)}`, leftMargin + 350, yPos);
      yPos += 14;
    }
    if (invoice.cgst) {
      doc.text(`CGST: ₹${(invoice.cgst || 0).toFixed(2)}`, leftMargin + 350, yPos);
      yPos += 14;
    }
    if (invoice.sgst) {
      doc.text(`SGST: ₹${(invoice.sgst || 0).toFixed(2)}`, leftMargin + 350, yPos);
      yPos += 14;
    }
    if (invoice.igst) {
      doc.text(`IGST: ₹${(invoice.igst || 0).toFixed(2)}`, leftMargin + 350, yPos);
      yPos += 14;
    }
    doc.fontSize(12).text(`Total: ₹${(invoice.totalAmount || 0).toFixed(2)}`, leftMargin + 350, yPos);
    yPos += 20;

    doc.fontSize(8).font('Helvetica');
    doc.text(invoice.companyRef?.invoiceNote || 'Thank you for your business!', leftMargin, yPos);

    doc.end();
  });
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
