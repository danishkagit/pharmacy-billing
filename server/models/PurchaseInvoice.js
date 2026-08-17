const mongoose = require('mongoose');

const purchaseInvoiceSchema = new mongoose.Schema({
  invoiceNo: { type: String, required: true, trim: true, index: true },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  purchaseOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseOrder' },
  invoiceDate: { type: Date, default: Date.now },
  receivedDate: { type: Date, default: Date.now },
  billFile: { type: String },
  batches: [{
    medicine: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
    medicineName: String,
    batchNo: { type: String, required: true },
    mfgDate: Date,
    expiryDate: { type: Date, required: true },
    mrp: { type: Number, required: true },
    rate: { type: Number, required: true },
    qty: { type: Number, required: true },
    freeQty: { type: Number, default: 0 },
    schemeDisc: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },
    gstAmount: { type: Number, default: 0 }
  }],
  subtotal: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  igst: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  freight: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  paymentStatus: { type: String, enum: ['pending', 'partial', 'paid'], default: 'pending' },
  notes: { type: String },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  companyRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('PurchaseInvoice', purchaseInvoiceSchema);
