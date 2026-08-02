const express = require('express');
const router = express.Router();
const PurchaseOrder = require('../models/PurchaseOrder');
const { hasPermission } = require('../middleware/rbac');

router.get('/', async (req, res) => {
  try {
    const { supplier, status, from, to, page = 1, limit = 50 } = req.query;
    const filter = { companyRef: req.company._id, branch: req.activeBranch || req.branch?._id };
    if (supplier) filter.supplier = supplier;
    if (status) filter.status = status;
    if (from || to) { filter.orderDate = {}; if (from) filter.orderDate.$gte = new Date(from); if (to) filter.orderDate.$lte = new Date(new Date(to).setHours(23,59,59,999)); }
    const total = await PurchaseOrder.countDocuments(filter);
    const orders = await PurchaseOrder.find(filter).populate('supplier', 'name company gstin').sort({ orderDate: -1 }).skip((page - 1) * parseInt(limit)).limit(parseInt(limit));
    res.json({ success: true, data: orders, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const order = await PurchaseOrder.findOne({ _id: req.params.id, companyRef: req.company._id }).populate('supplier', 'name company gstin phone');
    if (!order) return res.status(404).json({ success: false, error: 'Purchase order not found' });
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', hasPermission('purchase'), async (req, res) => {
  try {
    const count = await PurchaseOrder.countDocuments({ companyRef: req.company._id });
    const poNo = `PO${String(count + 1).padStart(5, '0')}`;
    const items = req.body.items.map(item => ({
      ...item,
      amount: (item.qty || 0) * (item.rate || 0)
    }));
    const subtotal = items.reduce((sum, i) => sum + i.amount, 0);
    const order = await PurchaseOrder.create({
      ...req.body,
      poNo: req.body.poNo || poNo,
      items,
      subtotal,
      totalAmount: subtotal - (req.body.discount || 0),
      companyRef: req.company._id,
      branch: req.activeBranch || req.branch?._id,
      createdBy: req.user._id
    });
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', hasPermission('purchase'), async (req, res) => {
  try {
    const order = await PurchaseOrder.findOneAndUpdate({ _id: req.params.id, companyRef: req.company._id }, req.body, { new: true, runValidators: true });
    if (!order) return res.status(404).json({ success: false, error: 'Purchase order not found' });
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:id', hasPermission('purchase'), async (req, res) => {
  try {
    const order = await PurchaseOrder.findOneAndUpdate({ _id: req.params.id, companyRef: req.company._id }, { status: 'cancelled' }, { new: true });
    if (!order) return res.status(404).json({ success: false, error: 'Purchase order not found' });
    res.json({ success: true, message: 'Purchase order cancelled' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
