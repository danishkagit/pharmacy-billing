const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  medicine: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true, index: true },
  batchNo: { type: String, required: true, trim: true },
  mfgDate: { type: Date },
  expiryDate: { type: Date, required: true, index: true },
  mrp: { type: Number, required: true, min: 0 },
  purchaseRate: { type: Number, required: true, min: 0 },
  saleRate: { type: Number, min: 0 },
  qty: { type: Number, required: true, min: 0, default: 0 },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
  purchaseInvoice: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseInvoice' },
  location: { type: String, trim: true },
  isExpired: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'expired', 'damaged', 'returned'], default: 'active' }
}, { timestamps: true });

batchSchema.index({ medicine: 1, branch: 1, expiryDate: 1 });
batchSchema.index({ batchNo: 1, medicine: 1 }, { unique: true });

batchSchema.methods.isExpiringSoon = function (days = 30) {
  if (!this.expiryDate) return false;
  const now = new Date();
  const diffDays = Math.ceil((this.expiryDate - now) / (1000 * 60 * 60 * 24));
  return diffDays <= days && diffDays > 0;
};

module.exports = mongoose.model('Batch', batchSchema);
