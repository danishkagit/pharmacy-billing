const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const { rbac } = require('../middleware/rbac');

router.get('/', rbac('owner', 'admin'), async (req, res) => {
  try {
    const { model, action, userId, from, to, page = 1, limit = 100 } = req.query;
    const filter = { companyRef: req.company._id };
    if (req.activeBranch) filter.branch = req.activeBranch;
    if (model) filter.model = model;
    if (action) filter.action = action;
    if (userId) filter.userId = userId;
    if (from || to) { filter.createdAt = {}; if (from) filter.createdAt.$gte = new Date(from); if (to) filter.createdAt.$lte = new Date(new Date(to).setHours(23,59,59,999)); }
    const total = await AuditLog.countDocuments(filter);
    const logs = await AuditLog.find(filter).populate('userId', 'name role').sort({ createdAt: -1 }).skip((page - 1) * parseInt(limit)).limit(parseInt(limit));
    res.json({ success: true, data: logs, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
