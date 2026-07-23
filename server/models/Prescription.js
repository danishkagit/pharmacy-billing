const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  prescriptionNo: { type: String, required: true, trim: true, index: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  doctorName: { type: String, trim: true },
  doctorRegNo: { type: String, trim: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
  patientName: { type: String, required: true, trim: true },
  patientPhone: { type: String, trim: true },
  medicines: [{
    medicine: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine' },
    name: String,
    dosage: String,
    duration: String,
    frequency: String,
    qty: Number,
    note: String
  }],
  date: { type: Date, default: Date.now },
  imageUrl: { type: String },
  notes: { type: String },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  companyRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Prescription', prescriptionSchema);
