const mongoose = require('mongoose');

const stockAdjustmentSchema = new mongoose.Schema({
  adjustmentNo: { type: String, required: true, trim: true, index: true },
  type: { type: String, enum: ['write_off', 'damage', 'physical_count', 'theft', 'return_to_supplier', 'other'], required: true },
  items: [{
    medicine: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
    medicineName: String,
    batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
    batchNo: String,
    expiryDate: Date,
    qtyBefore: { type: Number, required: true },
    qtyAfter: { type: Number, required: true },
    difference: { type: Number, required: true },
    rate: { type: Number },
    amount: { type: Number }
  }],
  totalAmount: { type: Number, default: 0 },
  reason: { type: String, required: true },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  companyRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('StockAdjustment', stockAdjustmentSchema);
