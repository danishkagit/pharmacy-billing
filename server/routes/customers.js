const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const { hasPermission } = require('../middleware/rbac');

router.get('/', async (req, res) => {
  try {
    const { search, type, isActive, page = 1, limit = 50 } = req.query;
    const filter = { companyRef: req.company._id };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (type) filter.type = type;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    const total = await Customer.countDocuments(filter);
    const customers = await Customer.find(filter).sort({ name: 1 }).skip((page - 1) * parseInt(limit)).limit(parseInt(limit));
    res.json({ success: true, data: customers, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, companyRef: req.company._id });
    if (!customer) return res.status(404).json({ success: false, error: 'Customer not found' });
    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const customer = await Customer.create({ ...req.body, companyRef: req.company._id, type: 'retail' });
    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ success: false, error: 'Customer with this phone already exists' });
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, companyRef: req.company._id },
      { ...req.body, type: 'retail' },
      { new: true, runValidators: true }
    );
    if (!customer) return res.status(404).json({ success: false, error: 'Customer not found' });
    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, companyRef: req.company._id },
      { isActive: false },
      { new: true }
    );
    if (!customer) return res.status(404).json({ success: false, error: 'Customer not found' });
    res.json({ success: true, message: 'Customer deactivated' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id/ledger', async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, error: 'Customer not found' });
    const SaleInvoice = require('../models/SaleInvoice');
    const Payment = require('../models/Payment');
    const SaleReturn = require('../models/SaleReturn');
    const invoices = await SaleInvoice.find({ customer: req.params.id, branch: req.activeBranch || { $exists: true } }).sort({ invoiceDate: -1 });
    const payments = await Payment.find({ party: req.params.id, partyType: 'customer', branch: req.activeBranch || { $exists: true } }).sort({ paymentDate: -1 });
    const returns = await SaleReturn.find({ customer: req.params.id, branch: req.activeBranch || { $exists: true } }).sort({ returnDate: -1 });
    let balance = customer.openingBalance || 0;
    const entries = [];
    invoices.forEach(inv => {
      balance += inv.totalAmount;
      entries.push({ date: inv.invoiceDate, type: 'sale', description: `Invoice ${inv.invoiceNo}`, debit: inv.totalAmount, credit: 0, balance });
    });
    payments.forEach(p => {
      balance -= p.amount;
      entries.push({ date: p.paymentDate, type: 'payment', description: `Payment ${p.mode} ${p.reference || ''}`, debit: 0, credit: p.amount, balance });
    });
    returns.forEach(r => {
      balance -= r.totalAmount;
      entries.push({ date: r.returnDate, type: 'return', description: `Return ${r.returnNo}`, debit: 0, credit: r.totalAmount, balance });
    });
    entries.sort((a, b) => new Date(a.date) - new Date(b.date));
    res.json({ success: true, data: { customer, entries, currentBalance: balance } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
