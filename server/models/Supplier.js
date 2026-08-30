const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, index: true },
  company: { type: String, trim: true },
  gstin: { type: String, trim: true, uppercase: true },
  pan: { type: String, trim: true, uppercase: true },
  dlNo: { type: String, trim: true, uppercase: true },
  dlNoWholesale: { type: String, trim: true, uppercase: true },
  address: { type: String, trim: true },
  city: { type: String, trim: true },
  state: { type: String, trim: true },
  pincode: { type: String, trim: true },
  phone: { type: String, trim: true },
  email: { type: String, trim: true },
  zone: { type: String, trim: true },
  creditDays: { type: Number, default: 0 },
  creditLimit: { type: Number, default: 0 },
  defaultDiscountPercent: { type: Number, default: 0 },
  openingBalance: { type: Number, default: 0 },
  schemes: [{
    name: String,
    type: { type: String, enum: ['cd', 'td', 'free_qty', 'bonus'], default: 'cd' },
    value: Number,
    validFrom: Date,
    validTo: Date,
    isActive: { type: Boolean, default: true }
  }],
  companyRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Supplier', supplierSchema);
