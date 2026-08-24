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
  drugLicenseCategory: { type: String, enum: ['retail', 'wholesale', 'both'], default: 'retail' },
  logo: { type: String },
  // Registered pharmacist — signature printed on sales bills
  pharmacistName: { type: String, trim: true },
  pharmacistRegNo: { type: String, trim: true, uppercase: true },
  pharmacistSignature: { type: String },
  invoicePrefix: { type: String, default: 'PH' },
  invoiceNote: { type: String, default: 'Thank you for your business!' },
  gstType: { type: String, enum: ['regular', 'composition'], default: 'regular' },
  dlNoWholesale: { type: String, trim: true, uppercase: true },
  bankName: { type: String, trim: true },
  bankAccountNo: { type: String, trim: true },
  bankIfsc: { type: String, trim: true, uppercase: true },
  upiId: { type: String, trim: true },
  // Invoice template settings
  invoiceTemplate: { type: String, enum: ['a4', 'a5', 'thermal80', 'thermal58'], default: 'a4' },
  showHsnOnPrint: { type: Boolean, default: true },
  showExpiryOnPrint: { type: Boolean, default: true },
  showMrpOnPrint: { type: Boolean, default: true },
  billCopies: { type: Number, default: 1, min: 1, max: 3 },
  printAfterSave: { type: Boolean, default: false },
  declarationNote: { type: String, default: 'Goods once sold will not be taken back or exchanged.' },
  scheduleWarningNote: { type: String, default: 'Schedule H/H1 drugs to be sold only against the prescription of a Registered Medical Practitioner.' },
  // GST engine settings
  taxMode: { type: String, enum: ['mrp_inclusive', 'exclusive'], default: 'mrp_inclusive' },
  autoRoundOff: { type: Boolean, default: true },
  enableEInvoice: { type: Boolean, default: false },
  ewayThreshold: { type: Number, default: 50000 },
  discountSlabs: {
    type: [{
      minMRP: { type: Number, default: 0 },
      discountPercent: { type: Number, default: 0 }
    }],
    default: [{ minMRP: 0, discountPercent: 10 }, { minMRP: 100, discountPercent: 15 }]
  },
  isActive: { type: Boolean, default: true },
  // Subscription — 14-day free trial stamped at registration (no card required)
  plan: { type: String, enum: ['trial', 'starter', 'growth', 'enterprise'], default: 'trial', index: true },
  trialEndDate: { type: Date },
  planExpiresAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Company', companySchema);
