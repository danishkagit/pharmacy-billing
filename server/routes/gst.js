const express = require('express');
const router = express.Router();
const SaleInvoice = require('../models/SaleInvoice');
const PurchaseInvoice = require('../models/PurchaseInvoice');
const FilingHistory = require('../models/FilingHistory');

router.get('/gstr1', async (req, res) => {
  try {
    const { month, year } = req.query;
    const m = parseInt(month) || (new Date().getMonth() + 1);
    const y = parseInt(year) || new Date().getFullYear();
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 1);
    const invoices = await SaleInvoice.find({
      companyRef: req.company._id,
      branch: req.activeBranch || req.branch?._id,
      invoiceDate: { $gte: start, $lt: end },
      paymentStatus: { $ne: 'cancelled' }
    }).populate('customer', 'name gstin').sort({ invoiceDate: -1 });
    const b2b = invoices.filter(i => i.customerGstin);
    const b2c = invoices.filter(i => !i.customerGstin);
    const hsnSummary = {};
    invoices.forEach(inv => {
      inv.items.forEach(item => {
        const key = item.gstRate || 12;
        if (!hsnSummary[key]) hsnSummary[key] = { gstRate: key, taxableValue: 0, cgst: 0, sgst: 0, igst: 0, qty: 0 };
        hsnSummary[key].qty += item.qty;
        hsnSummary[key].taxableValue += item.amount;
        hsnSummary[key].cgst += (item.gstAmount || 0) / 2;
        hsnSummary[key].sgst += (item.gstAmount || 0) / 2;
      });
    });
    res.json({
      success: true,
      data: {
        summary: { totalInvoices: invoices.length, b2b: b2b.length, b2c: b2c.length, totalSales: invoices.reduce((s, i) => s + i.totalAmount, 0) },
        b2b: b2b.map(i => ({ gstin: i.customerGstin, name: i.customerName, invoiceNo: i.invoiceNo, date: i.invoiceDate, taxable: i.subtotal, tax: i.taxAmount, total: i.totalAmount })),
        b2c: b2c.map(i => ({ invoiceNo: i.invoiceNo, date: i.invoiceDate, taxable: i.subtotal, tax: i.taxAmount, total: i.totalAmount })),
        hsnSummary: Object.values(hsnSummary)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/gstr3b', async (req, res) => {
  try {
    const { month, year } = req.query;
    const m = parseInt(month) || (new Date().getMonth() + 1);
    const y = parseInt(year) || new Date().getFullYear();
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 1);
    const salesAgg = await SaleInvoice.aggregate([
      { $match: { companyRef: req.company._id, invoiceDate: { $gte: start, $lt: end }, paymentStatus: { $ne: 'cancelled' }, branch: req.activeBranch ? { $eq: req.activeBranch } : { $exists: true } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.gstRate', taxableValue: { $sum: '$items.amount' }, totalTax: { $sum: '$items.gstAmount' }, qty: { $sum: '$items.qty' } } }
    ]);
    const purchaseAgg = await PurchaseInvoice.aggregate([
      { $match: { companyRef: req.company._id, invoiceDate: { $gte: start, $lt: end }, branch: req.activeBranch ? { $eq: req.activeBranch } : { $exists: true } } },
      { $unwind: '$batches' },
      { $group: { _id: null, taxableValue: { $sum: '$batches.amount' }, totalTax: { $sum: '$batches.gstAmount' } } }
    ]);
    res.json({
      success: true,
      data: {
        period: `${m}/${y}`,
        sales: { summary: salesAgg, totalTaxable: salesAgg.reduce((s, r) => s + r.taxableValue, 0), totalTax: salesAgg.reduce((s, r) => s + r.totalTax, 0) },
        purchases: { taxableValue: purchaseAgg[0]?.taxableValue || 0, totalTax: purchaseAgg[0]?.totalTax || 0 },
        netTaxLiability: (salesAgg.reduce((s, r) => s + r.totalTax, 0) || 0) - (purchaseAgg[0]?.totalTax || 0)
      }
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
