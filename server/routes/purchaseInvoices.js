const express = require('express');
const router = express.Router();
const PurchaseInvoice = require('../models/PurchaseInvoice');
const Batch = require('../models/Batch');
const Supplier = require('../models/Supplier');
const Medicine = require('../models/Medicine');
const { hasPermission } = require('../middleware/rbac');

router.get('/', async (req, res) => {
  try {
    const { supplier, from, to, paymentStatus, page = 1, limit = 50 } = req.query;
    const filter = { companyRef: req.company._id, branch: req.activeBranch || req.branch?._id };
    if (supplier) filter.supplier = supplier;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (from || to) { filter.invoiceDate = {}; if (from) filter.invoiceDate.$gte = new Date(from); if (to) filter.invoiceDate.$lte = new Date(new Date(to).setHours(23,59,59,999)); }
    const total = await PurchaseInvoice.countDocuments(filter);
    const invoices = await PurchaseInvoice.find(filter).populate('supplier', 'name company gstin dlNo').sort({ invoiceDate: -1 }).skip((page - 1) * parseInt(limit)).limit(parseInt(limit));
    res.json({ success: true, data: invoices, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const invoice = await PurchaseInvoice.findOne({ _id: req.params.id, companyRef: req.company._id }).populate('supplier', 'name company gstin dlNo phone');
    if (!invoice) return res.status(404).json({ success: false, error: 'Purchase invoice not found' });
    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', hasPermission('purchase'), async (req, res) => {
  try {
    const count = await PurchaseInvoice.countDocuments({ companyRef: req.company._id });
    const invNo = `PI${String(count + 1).padStart(5, '0')}`;
    const { items, supplier: supplierId } = req.body;

    const batches = await Promise.all(items.map(async (item) => {
      const medicine = await Medicine.findById(item.medicine);
      const gstRate = medicine?.gstRate || 12;
      const amount = (item.qty || 0) * (item.rate || 0);
      const gstAmount = (amount * gstRate) / 100;
      return {
        medicine: item.medicine,
        medicineName: medicine?.name || item.medicineName || 'Unknown',
        batchNo: item.batchNo,
        mfgDate: item.mfgDate,
        expiryDate: item.expiryDate,
        mrp: item.mrp || 0,
        rate: item.rate || 0,
        qty: item.qty || 0,
        freeQty: item.freeQty || 0,
        schemeDisc: item.schemeDisc || 0,
        amount,
        gstAmount
      };
    }));

    const subtotal = batches.reduce((s, b) => s + b.amount, 0);
    const totalTax = batches.reduce((s, b) => s + b.gstAmount, 0);
    const totalAmount = subtotal + totalTax - (req.body.discountAmount || 0) + (req.body.freight || 0);

    const purchaseInvoice = await PurchaseInvoice.create({
      invoiceNo: req.body.invoiceNo || invNo,
      supplier: supplierId,
      purchaseOrder: req.body.purchaseOrder,
      invoiceDate: req.body.invoiceDate,
      receivedDate: req.body.receivedDate,
      batches,
      subtotal,
      discountAmount: req.body.discountAmount || 0,
      cgst: totalTax / 2,
      sgst: totalTax / 2,
      taxAmount: totalTax,
      freight: req.body.freight || 0,
      totalAmount,
      notes: req.body.notes,
      branch: req.activeBranch || req.branch?._id,
      companyRef: req.company._id,
      createdBy: req.user._id
    });

    for (const batch of batches) {
      if (batch.qty > 0) {
        await Batch.create({
          medicine: batch.medicine,
          batchNo: batch.batchNo,
          mfgDate: batch.mfgDate,
          expiryDate: batch.expiryDate,
          mrp: batch.mrp,
          purchaseRate: batch.rate,
          saleRate: batch.rate,
          qty: batch.qty,
          supplier: supplierId,
          branch: req.activeBranch || req.branch?._id,
          purchaseInvoice: purchaseInvoice._id,
          location: req.body.defaultLocation || ''
        });
      }
      if (batch.freeQty > 0) {
        await Batch.create({
          medicine: batch.medicine,
          batchNo: batch.batchNo + '-FREE',
          mfgDate: batch.mfgDate,
          expiryDate: batch.expiryDate,
          mrp: 0,
          purchaseRate: 0,
          saleRate: 0,
          qty: batch.freeQty,
          supplier: supplierId,
          branch: req.activeBranch || req.branch?._id,
          purchaseInvoice: purchaseInvoice._id,
          location: req.body.defaultLocation || ''
        });
      }
    }

    res.status(201).json({ success: true, data: purchaseInvoice });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', hasPermission('purchase'), async (req, res) => {
  try {
    const invoice = await PurchaseInvoice.findOneAndUpdate({ _id: req.params.id, companyRef: req.company._id }, req.body, { new: true, runValidators: true });
    if (!invoice) return res.status(404).json({ success: false, error: 'Purchase invoice not found' });
    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
