const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, index: true },
  type: { type: String, enum: ['retail', 'wholesale', 'both'], default: 'retail', index: true },
  phone: { type: String, trim: true },
  email: { type: String, trim: true },
  gstin: { type: String, trim: true, uppercase: true },
  pan: { type: String, trim: true, uppercase: true },
  address: { type: String, trim: true },
  city: { type: String, trim: true },
  state: { type: String, trim: true },
  pincode: { type: String, trim: true },
  creditLimit: { type: Number, default: 0 },
  creditDays: { type: Number, default: 0 },
  openingBalance: { type: Number, default: 0 },
  loyaltyPoints: { type: Number, default: 0 },
  totalPointsEarned: { type: Number, default: 0 },
  totalPointsRedeemed: { type: Number, default: 0 },
  dob: { type: Date },
  anniversary: { type: Date },
  isChronicPatient: { type: Boolean, default: false },
  chronicConditions: [{ type: String }],
  notes: { type: String },
  companyRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

customerSchema.index({ phone: 1, companyRef: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Customer', customerSchema);
