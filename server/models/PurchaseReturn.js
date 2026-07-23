const mongoose = require('mongoose');

const purchaseReturnSchema = new mongoose.Schema({
  returnNo: { type: String, required: true, trim: true, index: true },
  purchaseInvoice: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseInvoice' },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  returnDate: { type: Date, default: Date.now },
  reason: { type: String, enum: ['expired', 'damaged', 'excess', 'other'], default: 'other' },
  items: [{
    medicine: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
    medicineName: String,
    batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
    batchNo: String,
    expiryDate: Date,
    qty: { type: Number, required: true },
    rate: { type: Number, required: true },
    amount: { type: Number, default: 0 },
    gstAmount: { type: Number, default: 0 }
  }],
  subtotal: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  debitNoteNo: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'completed'], default: 'pending' },
  notes: { type: String },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  companyRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('PurchaseReturn', purchaseReturnSchema);
