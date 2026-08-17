const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  legalName: { type: String, trim: true },
  address: { type: String, trim: true },
  city: { type: String, trim: true },
  state: { type: String, trim: true },
  pincode: { type: String, trim: true },
  phone: { type: String, trim: true },
  email: { type: String, trim: true },
  gstin: { type: String, trim: true, uppercase: true },
  pan: { type: String, trim: true, uppercase: true },
  dlNo: { type: String, trim: true, uppercase: true },
  fssaiNo: { type: String, trim: true },
  dlExpiryDate: { type: Date },
  fssaiExpiryDate: { type: Date },
  drugLicenseCategory: { type: String, enum: ['retail', 'wholesale', 'both'], default: 'both' },
  logo: { type: String },
  invoicePrefix: { type: String, default: 'PH' },
  invoiceNote: { type: String, default: 'Thank you for your business!' },
  gstType: { type: String, enum: ['regular', 'composition'], default: 'regular' },
  upiId: { type: String, trim: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Company', companySchema);
