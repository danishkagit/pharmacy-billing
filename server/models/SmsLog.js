const mongoose = require('mongoose');

const smsLogSchema = new mongoose.Schema({
  recipient: { type: String, required: true },
  type: { type: String, enum: ['invoice', 'payment_receipt', 'payment_reminder', 'expiry_alert', 'refill_reminder', 'low_stock', 'promotional', 'otp', 'other'], required: true },
  channel: { type: String, enum: ['sms', 'whatsapp'], default: 'sms' },
  message: { type: String, required: true },
  referenceId: { type: mongoose.Schema.Types.ObjectId },
  referenceModel: { type: String },
  status: { type: String, enum: ['sent', 'delivered', 'failed', 'pending'], default: 'pending' },
  providerResponse: { type: mongoose.Schema.Types.Mixed },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  companyRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('SmsLog', smsLogSchema);
