const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, trim: true },
  email: { type: String, trim: true },
  dob: { type: Date },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  abhaId: { type: String, trim: true },
  bloodGroup: { type: String, trim: true },
  address: { type: String, trim: true },
  city: { type: String, trim: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  chronicConditions: [{ type: String }],
  allergies: [{ type: String }],
  medicationHistory: [{
    medicine: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine' },
    prescription: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription' },
    dosage: String,
    duration: String,
    prescribedDate: Date
  }],
  companyRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Patient', patientSchema);
