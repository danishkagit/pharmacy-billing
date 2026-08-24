const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['admin', 'pharmacist', 'cashier', 'salesman', 'owner'], default: 'cashier' },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', default: null },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  permissions: {
    billing: { type: Boolean, default: true },
    purchase: { type: Boolean, default: false },
    inventory: { type: Boolean, default: false },
    returns: { type: Boolean, default: false },
    accounting: { type: Boolean, default: false },
    reports: { type: Boolean, default: false },
    staff: { type: Boolean, default: false },
    settings: { type: Boolean, default: false },
    compliance: { type: Boolean, default: false },
    allBranches: { type: Boolean, default: false }
  },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  resetOtpHash: { type: String },
  resetOtpExpiry: { type: Date },
  resetOtpAttempts: { type: Number, default: 0 }
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
