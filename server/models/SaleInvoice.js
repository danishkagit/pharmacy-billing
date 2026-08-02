const mongoose = require('mongoose');

const saleInvoiceSchema = new mongoose.Schema({
  invoiceNo: { type: String, required: true, trim: true, index: true },
  type: { type: String, enum: ['retail', 'wholesale'], default: 'retail', index: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  customerName: { type: String, trim: true },
  customerPhone: { type: String, trim: true },
  customerGstin: { type: String, trim: true },
  prescription: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription' },
  prescriptionNo: { type: String, trim: true },
  doctorName: { type: String, trim: true },
  patientName: { type: String, trim: true },
  invoiceDate: { type: Date, default: Date.now },
  dueDate: { type: Date },
  items: [{
    medicine: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
    medicineName: String,
    batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
    batchNo: String,
    expiryDate: Date,
    mrp: { type: Number, default: 0 },
    rate: { type: Number, required: true },
    qty: { type: Number, required: true, min: 1 },
    gstRate: { type: Number, default: 12 },
    gstAmount: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    discountPercent: { type: Number, default: 0 },
    schedule: { type: String, enum: ['OTC', 'H', 'H1', 'X'], default: 'OTC' }
  }],
  subtotal: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  cgst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  igst: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  roundOff: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  paymentMode: { type: String, enum: ['cash', 'upi', 'card', 'credit', 'mixed', 'other'], default: 'cash' },
  paymentStatus: { type: String, enum: ['pending', 'partial', 'paid', 'cancelled'], default: 'paid' },
  paidAmount: { type: Number, default: 0 },
  changeAmount: { type: Number, default: 0 },
  loyaltyPointsEarned: { type: Number, default: 0 },
  isScheduleH1: { type: Boolean, default: false },
  isScheduleX: { type: Boolean, default: false },
  isDeliveryOrder: { type: Boolean, default: false },
  deliveryAddress: { type: String },
  notes: { type: String },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
  companyRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

saleInvoiceSchema.index({ invoiceDate: -1, branch: 1 });
saleInvoiceSchema.index({ customer: 1, invoiceDate: -1 });

module.exports = mongoose.model('SaleInvoice', saleInvoiceSchema);
