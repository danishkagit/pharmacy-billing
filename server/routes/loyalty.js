const express = require('express');
const router = express.Router();
const LoyaltyTransaction = require('../models/LoyaltyTransaction');
const Customer = require('../models/Customer');

router.get('/:customerId', async (req, res) => {
  try {
    const filter = { customer: req.params.customerId, companyRef: req.company._id };
    const transactions = await LoyaltyTransaction.find(filter).sort({ createdAt: -1 }).limit(100);
    const customer = await Customer.findById(req.params.customerId).select('loyaltyPoints totalPointsEarned totalPointsRedeemed');
    res.json({ success: true, data: { transactions, customer } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/redeem', async (req, res) => {
  try {
    const { customerId, points, saleInvoiceId } = req.body;
    if (!customerId || !points) return res.status(400).json({ success: false, error: 'Customer and points required' });
    const customer = await Customer.findOne({ _id: customerId, companyRef: req.company._id });
    if (!customer) return res.status(404).json({ success: false, error: 'Customer not found' });
    if (customer.loyaltyPoints < points) return res.status(400).json({ success: false, error: 'Insufficient loyalty points' });
    customer.loyaltyPoints -= points;
    customer.totalPointsRedeemed = (customer.totalPointsRedeemed || 0) + points;
    await customer.save();
    await LoyaltyTransaction.create({
      customer: customerId, type: 'redeemed', points, saleInvoice: saleInvoiceId,
      branch: req.activeBranch, companyRef: req.company._id
    });
    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
