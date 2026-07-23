const express = require('express');
const router = express.Router();
const SaleReturn = require('../models/SaleReturn');
const Batch = require('../models/Batch');
const { hasPermission } = require('../middleware/rbac');

router.get('/', async (req, res) => {
  try {
    const { customer, status, from, to, page = 1, limit = 50 } = req.query;
    const filter = { companyRef: req.company._id, branch: req.activeBranch || req.branch?._id };
    if (customer) filter.customer = customer;
    if (status) filter.status = status;
    if (from || to) { filter.returnDate = {}; if (from) filter.returnDate.$gte = new Date(from); if (to) filter.returnDate.$lte = new Date(to); }
    const total = await SaleReturn.countDocuments(filter);
    const returns = await SaleReturn.find(filter).populate('customer', 'name phone').sort({ returnDate: -1 }).skip((page - 1) * parseInt(limit)).limit(parseInt(limit));
    res.json({ success: true, data: returns, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const ret = await SaleReturn.findOne({ _id: req.params.id, companyRef: req.company._id });
    if (!ret) return res.status(404).json({ success: false, error: 'Sale return not found' });
    res.json({ success: true, data: ret });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', hasPermission('returns'), async (req, res) => {
  try {
    const count = await SaleReturn.countDocuments({ companyRef: req.company._id });
    const returnNo = `SR${String(count + 1).padStart(5, '0')}`;
    const items = req.body.items.map(i => ({ ...i, amount: (i.qty || 0) * (i.rate || 0), gstAmount: ((i.qty || 0) * (i.rate || 0) * (i.gstRate || 12)) / 100 }));
    const subtotal = items.reduce((s, i) => s + i.amount, 0);
    const taxAmount = items.reduce((s, i) => s + i.gstAmount, 0);
    const ret = await SaleReturn.create({
      ...req.body,
      returnNo: req.body.returnNo || returnNo,
      items,
      subtotal,
      taxAmount,
      totalAmount: subtotal + taxAmount,
      branch: req.activeBranch || req.branch?._id,
      companyRef: req.company._id,
      createdBy: req.user._id
    });
    for (const item of items) {
      if (item.batch) {
        await Batch.findByIdAndUpdate(item.batch, { $inc: { qty: item.qty } });
      }
    }
    res.status(201).json({ success: true, data: ret });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
