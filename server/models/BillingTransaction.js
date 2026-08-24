const mongoose = require('mongoose');

// One UroPay checkout attempt for a CalcuttaRx plan subscription.
const billingTransactionSchema = new mongoose.Schema({
  companyRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  plan: { type: String, enum: ['starter', 'growth'], required: true },
  cycle: { type: String, enum: ['monthly', 'yearly'], required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  purpose: { type: String },
  merchantOrderId: { type: String },
  uroPayOrderId: { type: String, index: true },
  upiString: { type: String },
  qrCode: { type: String },
  referenceNumber: { type: String },
  status: { type: String, enum: ['created', 'utr_submitted', 'review', 'completed', 'failed'], default: 'created' },
  buyerName: { type: String },
  buyerEmail: { type: String },
  buyerPhone: { type: String },
  providerResponse: { type: Object },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('BillingTransaction', billingTransactionSchema);
