const mongoose = require('mongoose');

const narcoticsRegisterSchema = new mongoose.Schema({
  date: { type: Date, required: true, default: Date.now, index: true },
  medicine: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
  medicineName: { type: String, required: true },
  batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
  batchNo: { type: String },
  openingQty: { type: Number, required: true, min: 0 },
  receivedQty: { type: Number, default: 0 },
  soldQty: { type: Number, default: 0, min: 0 },
  closingQty: { type: Number, min: 0 },
  patientName: { type: String, required: true },
  patientAddress: { type: String },
  doctorName: { type: String, required: true },
  doctorRegNo: { type: String },
  prescriptionNo: { type: String, required: true },
  saleInvoice: { type: mongoose.Schema.Types.ObjectId, ref: 'SaleInvoice' },
  dispensedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId },
  notes: { type: String },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  companyRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true }
}, { timestamps: true });

narcoticsRegisterSchema.index({ date: -1, medicine: 1 });

module.exports = mongoose.model('NarcoticsRegister', narcoticsRegisterSchema);
