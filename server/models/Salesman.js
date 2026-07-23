const mongoose = require('mongoose');

const salesmanSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true, trim: true },
  employeeCode: { type: String, trim: true },
  phone: { type: String, trim: true },
  email: { type: String, trim: true },
  territory: [{ type: String }],
  branches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Branch' }],
  targets: [{
    month: { type: String },
    year: { type: Number },
    targetAmount: { type: Number, default: 0 },
    achievedAmount: { type: Number, default: 0 }
  }],
  commissionRate: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  companyRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Salesman', salesmanSchema);
