const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');

router.get('/', async (req, res) => {
  try {
    const { type, partyType, party, mode, from, to, page = 1, limit = 50 } = req.query;
    const filter = { companyRef: req.company._id, branch: req.activeBranch || req.branch?._id };
    if (type) filter.type = type;
    if (partyType) filter.partyType = partyType;
    if (party) filter.party = party;
    if (mode) filter.mode = mode;
    if (from || to) { filter.paymentDate = {}; if (from) filter.paymentDate.$gte = new Date(from); if (to) filter.paymentDate.$lte = new Date(to); }
    const total = await Payment.countDocuments(filter);
    const payments = await Payment.find(filter).sort({ paymentDate: -1 }).skip((page - 1) * parseInt(limit)).limit(parseInt(limit));
    const totals = await Payment.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    res.json({ success: true, data: payments, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)), totalAmount: totals[0]?.total || 0 });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const payment = await Payment.findOne({ _id: req.params.id, companyRef: req.company._id });
    if (!payment) return res.status(404).json({ success: false, error: 'Payment not found' });
    res.json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const payment = await Payment.create({
      ...req.body,
      partyModel: req.body.partyType === 'customer' ? 'Customer' : 'Supplier',
      branch: req.activeBranch || req.branch?._id,
      companyRef: req.company._id,
      createdBy: req.user._id
    });
    res.status(201).json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
