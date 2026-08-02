const express = require('express');
const router = express.Router();
const StockAdjustment = require('../models/StockAdjustment');
const { hasPermission } = require('../middleware/rbac');

router.get('/', async (req, res) => {
  try {
    const { type, status, page = 1, limit = 50 } = req.query;
    const filter = { companyRef: req.company._id, branch: req.activeBranch || req.branch?._id };
    if (type) filter.type = type;
    if (status) filter.status = status;
    const total = await StockAdjustment.countDocuments(filter);
    const adjustments = await StockAdjustment.find(filter).sort({ createdAt: -1 }).skip((page - 1) * parseInt(limit)).limit(parseInt(limit));
    res.json({ success: true, data: adjustments, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const adjustment = await StockAdjustment.findOne({ _id: req.params.id, companyRef: req.company._id });
    if (!adjustment) return res.status(404).json({ success: false, error: 'Stock adjustment not found' });
    res.json({ success: true, data: adjustment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
