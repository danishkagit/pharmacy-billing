const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const { hasPermission } = require('../middleware/rbac');

router.get('/', async (req, res) => {
  try {
    const { category, from, to, paymentMode, page = 1, limit = 50 } = req.query;
    const filter = { companyRef: req.company._id, branch: req.activeBranch || req.branch?._id };
    if (category) filter.category = category;
    if (paymentMode) filter.paymentMode = paymentMode;
    if (from || to) { filter.expenseDate = {}; if (from) filter.expenseDate.$gte = new Date(from); if (to) filter.expenseDate.$lte = new Date(new Date(to).setHours(23,59,59,999)); }
    const total = await Expense.countDocuments(filter);
    const expenses = await Expense.find(filter).sort({ expenseDate: -1 }).skip((page - 1) * parseInt(limit)).limit(parseInt(limit));
    const totals = await Expense.aggregate([{ $match: filter }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]);
    const categories = await Expense.distinct('category', { companyRef: req.company._id });
    res.json({ success: true, data: expenses, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)), totalAmount: totals[0]?.total || 0, categories });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, companyRef: req.company._id });
    if (!expense) return res.status(404).json({ success: false, error: 'Expense not found' });
    res.json({ success: true, data: expense });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', hasPermission('accounting'), async (req, res) => {
  try {
    const totalAmount = (req.body.amount || 0) + (req.body.gstAmount || 0);
    const expense = await Expense.create({
      ...req.body,
      totalAmount: req.body.totalAmount || totalAmount,
      branch: req.activeBranch || req.branch?._id,
      companyRef: req.company._id,
      createdBy: req.user._id
    });
    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', hasPermission('accounting'), async (req, res) => {
  try {
    const expense = await Expense.findOneAndUpdate({ _id: req.params.id, companyRef: req.company._id }, req.body, { new: true, runValidators: true });
    if (!expense) return res.status(404).json({ success: false, error: 'Expense not found' });
    res.json({ success: true, data: expense });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:id', hasPermission('accounting'), async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, companyRef: req.company._id });
    if (!expense) return res.status(404).json({ success: false, error: 'Expense not found' });
    res.json({ success: true, message: 'Expense deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
