const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  type: { type: String, enum: ['receipt', 'payment'], required: true, index: true },
  partyType: { type: String, enum: ['customer', 'supplier'], required: true },
  party: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'partyModel' },
  partyModel: { type: String, enum: ['Customer', 'Supplier'] },
  partyName: { type: String },
  amount: { type: Number, required: true, min: 0 },
  mode: { type: String, enum: ['cash', 'upi', 'card', 'bank_transfer', 'cheque', 'other'], default: 'cash' },
  reference: { type: String, trim: true },
  transactionId: { type: String, trim: true },
  invoices: [{
    invoiceType: { type: String, enum: ['sale', 'purchase'] },
    invoiceId: { type: mongoose.Schema.Types.ObjectId },
    invoiceNo: String,
    amount: Number
  }],
  paymentDate: { type: Date, default: Date.now },
  notes: { type: String },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  companyRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

paymentSchema.index({ paymentDate: -1, branch: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
