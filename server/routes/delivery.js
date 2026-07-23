const express = require('express');
const router = express.Router();
const DeliveryOrder = require('../models/DeliveryOrder');
const { hasPermission } = require('../middleware/rbac');

router.get('/', async (req, res) => {
  try {
    const { status, from, to, page = 1, limit = 50 } = req.query;
    const filter = { companyRef: req.company._id, branch: req.activeBranch || req.branch?._id };
    if (status) filter.status = status;
    if (from || to) { filter.deliveryDate = {}; if (from) filter.deliveryDate.$gte = new Date(from); if (to) filter.deliveryDate.$lte = new Date(to); }
    const total = await DeliveryOrder.countDocuments(filter);
    const orders = await DeliveryOrder.find(filter).populate('customer', 'name phone').populate('assignedTo', 'name').sort({ createdAt: -1 }).skip((page - 1) * parseInt(limit)).limit(parseInt(limit));
    res.json({ success: true, data: orders, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const order = await DeliveryOrder.findOne({ _id: req.params.id, companyRef: req.company._id });
    if (!order) return res.status(404).json({ success: false, error: 'Delivery order not found' });
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', hasPermission('billing'), async (req, res) => {
  try {
    const count = await DeliveryOrder.countDocuments({ companyRef: req.company._id });
    const doNo = `DO${String(count + 1).padStart(5, '0')}`;
    const order = await DeliveryOrder.create({
      ...req.body,
      doNo: req.body.doNo || doNo,
      branch: req.activeBranch || req.branch?._id,
      companyRef: req.company._id,
      createdBy: req.user._id
    });
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updates = { ...req.body };
    if (req.body.status === 'delivered') {
      updates.deliveredAt = new Date();
    }
    const order = await DeliveryOrder.findOneAndUpdate({ _id: req.params.id, companyRef: req.company._id }, updates, { new: true });
    if (!order) return res.status(404).json({ success: false, error: 'Delivery order not found' });
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
