const mongoose = require('mongoose');

const interBranchTransferSchema = new mongoose.Schema({
  transferNo: { type: String, required: true, trim: true, index: true },
  fromBranch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  toBranch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  challanNo: { type: String, trim: true },
  transferDate: { type: Date, default: Date.now },
  items: [{
    medicine: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
    medicineName: String,
    batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
    batchNo: String,
    expiryDate: Date,
    qty: { type: Number, required: true },
    rate: { type: Number, default: 0 },
    amount: { type: Number, default: 0 }
  }],
  totalItems: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  status: { type: String, enum: ['draft', 'pending', 'approved', 'in_transit', 'received', 'cancelled'], default: 'pending' },
  receivedAt: { type: Date },
  receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String },
  companyRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('InterBranchTransfer', interBranchTransferSchema);
