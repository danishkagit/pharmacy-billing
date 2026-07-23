const mongoose = require('mongoose');

const drugScheduleLogSchema = new mongoose.Schema({
  saleInvoice: { type: mongoose.Schema.Types.ObjectId, ref: 'SaleInvoice', required: true },
  medicine: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
  medicineName: { type: String },
  schedule: { type: String, enum: ['H', 'H1', 'X'], required: true },
  prescription: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription', required: true },
  prescriptionNo: { type: String },
  patientName: { type: String },
  doctorName: { type: String },
  qtyDispensed: { type: Number, required: true },
  dispensedAt: { type: Date, default: Date.now },
  dispensedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  companyRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true }
}, { timestamps: true });

drugScheduleLogSchema.index({ dispensedAt: -1, schedule: 1 });

module.exports = mongoose.model('DrugScheduleLog', drugScheduleLogSchema);
