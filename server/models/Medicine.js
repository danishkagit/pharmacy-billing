const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, index: true },
  composition: { type: String, trim: true },
  manufacturer: { type: String, trim: true, index: true },
  category: { type: String, enum: ['tablet', 'capsule', 'syrup', 'injection', 'ointment', 'drop', 'inhaler', 'powder', 'cream', 'lotion', 'sachet', 'other'], default: 'other' },
  packSize: { type: String, trim: true },
  unit: { type: String, default: 'nos' },
  hsn: { type: String, trim: true },
  gstRate: { type: Number, default: 12, min: 0, max: 28 },
  schedule: { type: String, enum: ['OTC', 'H', 'H1', 'X'], default: 'OTC', index: true },
  mrp: { type: Number, default: 0, min: 0 },
  reorderLevel: { type: Number, default: 0, min: 0 },
  rackLocation: { type: String, trim: true },
  preferredSupplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  isNarcotic: { type: Boolean, default: false },
  requiresPrescription: { type: Boolean, default: function () { return this.schedule !== 'OTC'; } },
  isActive: { type: Boolean, default: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true }
}, { timestamps: true });

medicineSchema.index({ name: 'text', composition: 'text', manufacturer: 'text' });

module.exports = mongoose.model('Medicine', medicineSchema);
