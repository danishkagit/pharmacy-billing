const express = require('express');
const router = express.Router();
const SaleInvoice = require('../models/SaleInvoice');
const PurchaseInvoice = require('../models/PurchaseInvoice');
const SaleReturn = require('../models/SaleReturn');
const Medicine = require('../models/Medicine');
const FilingHistory = require('../models/FilingHistory');
const { rbac } = require('../middleware/rbac');
const {
  GST_SLABS, GST_EFFECTIVE_DATE, DEFAULT_MEDICINE_GST,
  HSN_DEFAULT_RATES, SPECIAL_RATE_NOTES, suggestGstRate
} = require('../utils/gstSlabs');

// B2CL threshold: inter-state B2C invoices > ₹1,00,000 (w.e.f. 01-Aug-2024)
const B2CL_THRESHOLD = 100000;

function monthRange(month, year) {
  const m = parseInt(month) || (new Date().getMonth() + 1);
  const y = parseInt(year) || new Date().getFullYear();
  return { m, y, start: new Date(y, m - 1, 1), end: new Date(y, m, 1) };
}

function rateWiseSummary(items, isInterStateDefault = false) {
  const map = {};
  for (const it of items) {
    const rate = it.gstRate || 0;
    if (!map[rate]) {
      map[rate] = { gstRate: rate, taxableValue: 0, cgst: 0, sgst: 0, igst: 0, totalTax: 0, qty: 0 };
    }
    map[rate].qty += it.qty || 0;
    map[rate].taxableValue += it.taxableValue != null ? it.taxableValue : (it.amount - (it.gstAmount || 0));
    if (it.igstAmount && it.igstAmount > 0) {
      map[rate].igst += it.igstAmount;
    } else {
      map[rate].cgst += (it.gstAmount || 0) / 2;
      map[rate].sgst += (it.gstAmount || 0) / 2;
    }
    map[rate].totalTax += it.gstAmount || 0;
  }
  return Object.values(map).map(r => ({
    ...r,
    cgst: +r.cgst.toFixed(2), sgst: +r.sgst.toFixed(2), igst: +r.igst.toFixed(2),
    taxableValue: +r.taxableValue.toFixed(2), totalTax: +r.totalTax.toFixed(2)
  })).sort((a, b) => a.gstRate - b.gstRate);
}

router.get('/gstr1', async (req, res) => {
  try {
    const { start, end } = monthRange(req.query.month, req.query.year);
    const branchFilter = req.activeBranch ? { $eq: req.activeBranch } : { $exists: true };
    const invoices = await SaleInvoice.find({
      companyRef: req.company._id,
      invoiceDate: { $gte: start, $lt: end },
      paymentStatus: { $ne: 'cancelled' },
      branch: branchFilter
    }).populate('customer', 'name gstin').sort({ invoiceDate: -1 });

    const creditNotes = await SaleReturn.find({
      companyRef: req.company._id,
      status: { $in: ['approved', 'completed'] },
      returnDate: { $gte: start, $lt: end },
      branch: branchFilter
    }).populate('saleInvoice', 'invoiceNo customerGstin customerName');

    // Table 4 — B2B (registered buyers)
    const b2b = invoices.filter(i => i.customerGstin);
    // Inter-state detection: IGST billed, or buyer state code ≠ seller state code
    const sellerStateCode = String(req.company.gstin || '').slice(0, 2).toUpperCase();
    const invIsInter = (i) => i.igst > 0 ||
      (i.customerGstin && sellerStateCode && String(i.customerGstin).slice(0, 2).toUpperCase() !== sellerStateCode);
    // Table 5 — B2C Large: unregistered, inter-state, invoice value > threshold
    const b2cl = invoices.filter(i => !i.customerGstin && invIsInter(i) && i.totalAmount > B2CL_THRESHOLD);
    // Table 7 — B2C Small: everything else
    const b2cs = invoices.filter(i => !i.customerGstin && !(invIsInter(i) && i.totalAmount > B2CL_THRESHOLD));

    // Table 8 — nil-rated / exempt supplies (0% lines)
    let exemptTaxable = 0, exemptQty = 0;
    invoices.forEach(inv => inv.items.forEach(it => {
      if ((it.gstRate || 0) === 0) { exemptTaxable += (it.amount || 0); exemptQty += it.qty || 0; }
    }));

    // Table 12 — HSN-wise summary, bifurcated B2B / B2C per GSTN advisory (01-May-2025)
    const hsnAgg = {};
    const aggHsn = (inv, bucket) => {
      inv.items.forEach(it => {
        const hsn = String(it.hsn || '3004').slice(0, 6);
        const rate = it.gstRate || 0;
        const key = `${hsn}|${rate}`;
        if (!hsnAgg[key]) hsnAgg[key] = { hsn, gstRate: rate, uqc: 'NOS', qty: 0, taxableValue: 0, cgst: 0, sgst: 0, igst: 0, b2bValue: 0, b2cValue: 0 };
        hsnAgg[key].qty += it.qty || 0;
        const taxable = it.taxableValue != null ? it.taxableValue : (it.amount || 0) - (it.gstAmount || 0);
        hsnAgg[key].taxableValue += taxable;
        hsnAgg[key][bucket] += taxable;
        hsnAgg[key].cgst += inv.igst > 0 ? 0 : (it.gstAmount || 0) / 2;
        hsnAgg[key].sgst += inv.igst > 0 ? 0 : (it.gstAmount || 0) / 2;
        hsnAgg[key].igst += inv.igst > 0 ? (it.gstAmount || 0) : 0;
      });
    };
    b2b.forEach(i => aggHsn(i, 'b2bValue'));
    [...b2cl, ...b2cs].forEach(i => aggHsn(i, 'b2cValue'));
    const hsnSummary = Object.values(hsnAgg).map(h => ({
      ...h,
      taxableValue: +h.taxableValue.toFixed(2),
      cgst: +h.cgst.toFixed(2), sgst: +h.sgst.toFixed(2), igst: +h.igst.toFixed(2)
    })).sort((a, b) => a.hsn.localeCompare(b.hsn) || a.gstRate - b.gstRate);

    res.json({
      success: true,
      data: {
        period: `${start.toLocaleString('en-IN', { month: 'short' })} ${start.getFullYear()}`,
        summary: {
          totalInvoices: invoices.length,
          b2b: b2b.length,
          b2cl: b2cl.length,
          b2cs: b2cs.length,
          creditNotes: creditNotes.length,
          totalSales: invoices.reduce((s, i) => s + i.totalAmount, 0),
          totalTax: invoices.reduce((s, i) => s + i.taxAmount, 0),
          exemptTaxable: +exemptTaxable.toFixed(2),
          exemptQty
        },
        table4_b2b: b2b.map(i => ({
          _id: i._id,
          gstin: i.customerGstin, name: i.customerName || i.customer?.name,
          invoiceNo: i.invoiceNo, date: i.invoiceDate, value: i.totalAmount,
          taxable: +(i.subtotal - i.taxAmount).toFixed(2),
          tax: i.taxAmount,
          placeOfSupply: i.placeOfSupply || String(i.customerGstin || '').slice(0, 2),
          reverseCharge: false,
          rates: rateWiseSummary(i.items || [])
        })),
        table5_b2cl: b2cl.map(i => ({
          invoiceNo: i.invoiceNo, date: i.invoiceDate, value: i.totalAmount,
          placeOfSupply: i.placeOfSupply || '', rates: rateWiseSummary(i.items || [])
        })),
        table7_b2cs: {
          rateWise: rateWiseSummary(b2cs.flatMap(i => i.items || [])),
          count: b2cs.length,
          taxable: +(b2cs.reduce((s, i) => s + i.subtotal - i.taxAmount, 0)).toFixed(2)
        },
        table8_exempt: { taxableValue: +exemptTaxable.toFixed(2), qty: exemptQty },
        table9_cdnr: creditNotes.map(cn => ({
          creditNoteNo: cn.creditNoteNo || cn.returnNo, originalInvoiceNo: cn.saleInvoice?.invoiceNo,
          gstin: cn.saleInvoice?.customerGstin || '', name: cn.saleInvoice?.customerName || '',
          date: cn.returnDate, taxable: cn.subtotal, tax: cn.taxAmount, total: cn.totalAmount,
          reason: cn.reason
        })),
        table12_hsnSum: hsnSummary,
        documentsIssued: {
          invoices: { from: invoices[invoices.length - 1]?.invoiceNo || '', to: invoices[0]?.invoiceNo || '', count: invoices.length },
          creditNotes: { from: creditNotes[creditNotes.length - 1]?.creditNoteNo || creditNotes[creditNotes.length - 1]?.returnNo || '', to: creditNotes[0]?.creditNoteNo || creditNotes[0]?.returnNo || '', count: creditNotes.length }
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/gstr3b', async (req, res) => {
  try {
    const { start, end } = monthRange(req.query.month, req.query.year);
    const salesMatch = { companyRef: req.company._id, invoiceDate: { $gte: start, $lt: end }, paymentStatus: { $ne: 'cancelled' }, branch: req.activeBranch ? { $eq: req.activeBranch } : { $exists: true } };

    const salesAgg = await SaleInvoice.aggregate([
      { $match: salesMatch },
      { $unwind: '$items' },
      { $group: {
        _id: '$items.gstRate',
        taxableValue: { $sum: { $ifNull: ['$items.taxableValue', { $subtract: ['$items.amount', '$items.gstAmount'] }] } },
        cgst: { $sum: { $cond: [{ $gt: ['$igst', 0] }, 0, { $divide: ['$items.gstAmount', 2] }] } },
        sgst: { $sum: { $cond: [{ $gt: ['$igst', 0] }, 0, { $divide: ['$items.gstAmount', 2] }] } },
        igst: { $sum: { $cond: [{ $gt: ['$igst', 0] }, '$items.gstAmount', 0] } },
        totalTax: { $sum: '$items.gstAmount' },
        qty: { $sum: '$items.qty' }
      } },
      { $sort: { _id: 1 } }
    ]);

    const purchaseAgg = await PurchaseInvoice.aggregate([
      { $match: { companyRef: req.company._id, invoiceDate: { $gte: start, $lt: end }, branch: req.activeBranch ? { $eq: req.activeBranch } : { $exists: true } } },
      { $unwind: '$batches' },
      { $group: { _id: null, taxableValue: { $sum: '$batches.amount' }, totalTax: { $sum: '$batches.gstAmount' } } }
    ]);

    const salesTax = salesAgg.reduce((s, r) => s + r.totalTax, 0);
    const outputBreakup = salesAgg.reduce((acc, r) => ({ cgst: acc.cgst + r.cgst, sgst: acc.sgst + r.sgst, igst: acc.igst + r.igst }), { cgst: 0, sgst: 0, igst: 0 });
    const itc = { taxableValue: purchaseAgg[0]?.taxableValue || 0, totalTax: purchaseAgg[0]?.totalTax || 0 };

    res.json({
      success: true,
      data: {
        period: `${start.getMonth() + 1}/${start.getFullYear()}`,
        table3_1a: {
          slabwise: salesAgg.map(r => ({ gstRate: r._id || 0, taxableValue: +r.taxableValue.toFixed(2), cgst: +r.cgst.toFixed(2), sgst: +r.sgst.toFixed(2), igst: +r.igst.toFixed(2), qty: r.qty })),
          taxableValue: +salesAgg.reduce((s, r) => s + r.taxableValue, 0).toFixed(2),
          tax: { cgst: +outputBreakup.cgst.toFixed(2), sgst: +outputBreakup.sgst.toFixed(2), igst: +outputBreakup.igst.toFixed(2), total: +salesTax.toFixed(2) }
        },
        table3_1c: { taxableValue: +salesAgg.filter(r => (r._id || 0) === 0).reduce((s, r) => s + r.taxableValue, 0).toFixed(2), note: 'Nil-rated/exempt supplies (incl. notified life-saving drugs)' },
        table4_itc: { ...itc, note: 'Availed from GSTR-2B / IMS. Section 16(2)(aa): ITC only on accepted invoices.' },
        netTaxLiability: +(salesTax - itc.totalTax).toFixed(2),
        complianceNotes: [
          'Output tables are hard-locked to GSTR-1 since Jul-2025 — file corrections via GSTR-1A before filing 3B.',
          'E-invoicing applies at ₹5 Cr AATO (PAN level); IRN reporting window is 30 days for AATO ≥ ₹10 Cr.'
        ]
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GST 2.0 registry for client display (Settings → GST & Compliance)
router.get('/rates-info', async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        slabs: GST_SLABS,
        effectiveDate: GST_EFFECTIVE_DATE,
        defaultMedicineRate: DEFAULT_MEDICINE_GST,
        hsnRates: HSN_DEFAULT_RATES,
        specialRates: SPECIAL_RATE_NOTES,
        thresholds: {
          eInvoiceAato: 50000000,
          ewbConsignment: 50000,
          hsnDigits: { upTo5Cr: 4, above5Cr: 6 },
          compositionLimit: 15000000,
          compositionRetailerRate: 1,
          b2clThreshold: B2CL_THRESHOLD
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// One-time GST 2.0 migration: move legacy 12%/28% medicines onto post-22-Sep-2025 rates.
router.post('/update-medicine-rates', rbac('owner', 'admin'), async (req, res) => {
  try {
    const medicines = await Medicine.find({ company: req.company._id, isActive: true }).select('name hsn category gstRate');
    let updated = 0;
    const details = [];
    for (const med of medicines) {
      const suggested = suggestGstRate(med);
      if (med.gstRate !== suggested) {
        details.push({ id: med._id, name: med.name, from: med.gstRate, to: suggested });
        med.gstRate = suggested;
        await med.save();
        updated++;
      }
    }
    res.json({
      success: true,
      data: {
        scanned: medicines.length,
        updated,
        effectiveDate: GST_EFFECTIVE_DATE,
        details
      },
      message: `GST 2.0 migration applied: ${updated} of ${medicines.length} medicines re-rated to post-22-Sep-2025 slabs`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/filing-history', async (req, res) => {
  try {
    const filings = await FilingHistory.find({ companyRef: req.company._id }).sort({ filedDate: -1 }).limit(24);
    res.json({ success: true, data: filings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/filing-history', async (req, res) => {
  try {
    const filing = await FilingHistory.create({ ...req.body, companyRef: req.company._id, filedBy: req.user._id });
    res.status(201).json({ success: true, data: filing });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/generate-einvoice', async (req, res) => {
  try {
    const { invoiceId } = req.body;
    if (!invoiceId) return res.status(400).json({ success: false, error: 'Invoice ID required' });
    const invoice = await SaleInvoice.findOne({ _id: invoiceId, companyRef: req.company._id });
    if (!invoice) return res.status(404).json({ success: false, error: 'Invoice not found' });
    if (!invoice.customerGstin) return res.status(400).json({ success: false, error: 'e-Invoice requires a registered buyer (B2B with GSTIN)' });
    const irn = `${invoice.invoiceNo}-IRN-${Date.now()}`;
    const ackNo = `ACK${Date.now()}`;
    const filing = await FilingHistory.create({
      type: 'EINVOICE', period: `${new Date().getMonth() + 1}/${new Date().getFullYear()}`,
      year: new Date().getFullYear(), month: new Date().getMonth() + 1,
      totalSales: invoice.totalAmount, totalTax: invoice.taxAmount,
      status: 'filed', referenceNo: irn,
      gstin: invoice.customerGstin,
      companyRef: req.company._id, filedBy: req.user._id
    });
    res.json({ success: true, data: { irn, ackNo, filingId: filing._id } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/generate-ewaybill', async (req, res) => {
  try {
    const { invoiceId } = req.body;
    if (!invoiceId) return res.status(400).json({ success: false, error: 'Invoice ID required' });
    const invoice = await SaleInvoice.findOne({ _id: invoiceId, companyRef: req.company._id });
    if (!invoice) return res.status(404).json({ success: false, error: 'Invoice not found' });
    const threshold = req.company.ewayThreshold || 50000;
    if (invoice.totalAmount < threshold) return res.status(400).json({ success: false, error: `E-way bill not required below ₹${threshold} consignment value` });
    const ewbNo = `EWB${invoice.invoiceNo}${Date.now()}`;
    const filing = await FilingHistory.create({
      type: 'EWAYBILL', period: `${new Date().getMonth() + 1}/${new Date().getFullYear()}`,
      year: new Date().getFullYear(), month: new Date().getMonth() + 1,
      totalSales: invoice.totalAmount, totalTax: invoice.taxAmount,
      status: 'filed', referenceNo: ewbNo,
      gstin: invoice.customerGstin,
      companyRef: req.company._id, filedBy: req.user._id
    });
    res.json({ success: true, data: { ewbNo, validTill: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), filingId: filing._id } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
