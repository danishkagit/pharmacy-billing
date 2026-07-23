const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: { type: String, enum: ['create', 'update', 'delete', 'login', 'logout', 'export', 'print'], required: true },
  model: { type: String, required: true },
  recordId: { type: mongoose.Schema.Types.ObjectId },
  description: { type: String },
  before: { type: mongoose.Schema.Types.Mixed },
  after: { type: mongoose.Schema.Types.Mixed },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: { type: String },
  userRole: { type: String },
  ip: { type: String },
  userAgent: { type: String },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  companyRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true }
}, { timestamps: true });

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ model: 1, recordId: 1 });
auditLogSchema.index({ companyRef: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
