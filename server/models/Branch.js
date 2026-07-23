const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  code: { type: String, trim: true, uppercase: true },
  address: { type: String, trim: true },
  city: { type: String, trim: true },
  state: { type: String, trim: true },
  pincode: { type: String, trim: true },
  phone: { type: String, trim: true },
  email: { type: String, trim: true },
  gstin: { type: String, trim: true, uppercase: true },
  dlNo: { type: String, trim: true, uppercase: true },
  invoicePrefix: { type: String, default: 'PH' },
  invoiceCounter: { type: Number, default: 0 },
  isHeadOffice: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

branchSchema.virtual('nextInvoiceNumber').get(function () {
  const prefix = this.invoicePrefix || 'PH';
  const counter = String(this.invoiceCounter + 1).padStart(5, '0');
  return `${prefix}${counter}`;
});

module.exports = mongoose.model('Branch', branchSchema);
