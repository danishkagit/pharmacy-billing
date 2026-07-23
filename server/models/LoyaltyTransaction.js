const mongoose = require('mongoose');

const loyaltyTransactionSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  type: { type: String, enum: ['earned', 'redeemed', 'expired', 'adjusted'], required: true },
  points: { type: Number, required: true },
  saleInvoice: { type: mongoose.Schema.Types.ObjectId, ref: 'SaleInvoice' },
  reference: { type: String },
  expiryDate: { type: Date },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  companyRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true }
}, { timestamps: true });

module.exports = mongoose.model('LoyaltyTransaction', loyaltyTransactionSchema);
