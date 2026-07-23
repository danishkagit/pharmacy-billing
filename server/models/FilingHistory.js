const mongoose = require('mongoose');

const filingHistorySchema = new mongoose.Schema({
  type: { type: String, enum: ['GSTR1', 'GSTR3B', 'EINVOICE', 'EWAYBILL'], required: true },
  period: { type: String, required: true },
  year: { type: Number, required: true },
  month: { type: Number, required: true },
  filedDate: { type: Date, default: Date.now },
  filedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  totalSales: { type: Number, default: 0 },
  totalTax: { type: Number, default: 0 },
  totalPurchases: { type: Number, default: 0 },
  totalInputTax: { type: Number, default: 0 },
  netTaxLiability: { type: Number, default: 0 },
  status: { type: String, enum: ['draft', 'filed', 'verified', 'error'], default: 'filed' },
  gstin: { type: String },
  referenceNo: { type: String },
  errorLog: { type: String },
  companyRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true }
}, { timestamps: true });

filingHistorySchema.index({ type: 1, year: -1, month: -1 });

module.exports = mongoose.model('FilingHistory', filingHistorySchema);
