const mongoose = require('mongoose');

const deliveryOrderSchema = new mongoose.Schema({
  doNo: { type: String, required: true, trim: true, index: true },
  saleInvoice: { type: mongoose.Schema.Types.ObjectId, ref: 'SaleInvoice', required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  customerName: { type: String, required: true },
  customerPhone: { type: String },
  deliveryAddress: { type: String, required: true },
  deliveryDate: { type: Date },
  items: [{
    medicineName: String,
    qty: Number,
    rate: Number
  }],
  totalAmount: { type: Number, default: 0 },
  deliveryCharge: { type: Number, default: 0 },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedToName: { type: String },
  status: { type: String, enum: ['pending', 'assigned', 'in_transit', 'delivered', 'cancelled'], default: 'pending' },
  deliveredAt: { type: Date },
  deliveryProof: { type: String },
  notes: { type: String },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  companyRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('DeliveryOrder', deliveryOrderSchema);
