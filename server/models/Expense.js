const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  category: { type: String, required: true, trim: true, index: true },
  subCategory: { type: String, trim: true },
  amount: { type: Number, required: true, min: 0 },
  gstAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  expenseDate: { type: Date, default: Date.now },
  paymentMode: { type: String, enum: ['cash', 'upi', 'card', 'bank_transfer', 'cheque', 'other'], default: 'cash' },
  vendor: { type: String, trim: true },
  billNo: { type: String, trim: true },
  gstin: { type: String, trim: true },
  description: { type: String },
  receiptImage: { type: String },
  isReimbursable: { type: Boolean, default: false },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  companyRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

expenseSchema.index({ expenseDate: -1, branch: 1 });

module.exports = mongoose.model('Expense', expenseSchema);
