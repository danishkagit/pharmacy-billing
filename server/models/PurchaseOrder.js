const mongoose = require('mongoose');

const purchaseOrderSchema = new mongoose.Schema({
  poNo: { type: String, required: true, trim: true, index: true },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  orderDate: { type: Date, default: Date.now },
  expectedDate: { type: Date },
  items: [{
    medicine: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
    medicineName: String,
    qty: { type: Number, required: true, min: 1 },
    rate: { type: Number, default: 0 },
    amount: { type: Number, default: 0 }
  }],
  subtotal: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  status: { type: String, enum: ['draft', 'pending', 'approved', 'received', 'cancelled'], default: 'pending' },
  notes: { type: String },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  companyRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
