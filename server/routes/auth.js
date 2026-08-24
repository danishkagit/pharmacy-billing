const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Company = require('../models/Company');
const Branch = require('../models/Branch');
const { sendSMS } = require('../utils/sms');

router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, companyName, gstin, dlNo, drugLicenseCategory } = req.body;
    if (!name || !email || !password || !companyName) {
      return res.status(400).json({ success: false, error: 'Name, email, password, and company name required' });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, error: 'Email already registered' });
    const company = await Company.create({
      name: companyName, gstin, dlNo, drugLicenseCategory: 'retail',
      plan: 'trial',
      trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    });
    const branch = await Branch.create({
      name: 'Head Office',
      company: company._id,
      isHeadOffice: true,
      gstin,
      dlNo,
      invoicePrefix: (companyName.substring(0, 2).toUpperCase() || 'PH')
    });
    const user = await User.create({
      name, email, phone, password,
      role: 'owner',
      company: company._id,
      branch: branch._id,
      permissions: { billing: true, purchase: true, inventory: true, returns: true, accounting: true, reports: true, staff: true, settings: true, compliance: true, allBranches: true }
    });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
    res.status(201).json({ success: true, data: { user, company, branch, token } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password required' });
    }
    const user = await User.findOne({ email }).populate('company branch');
    if (!user) return res.status(401).json({ success: false, error: 'Invalid credentials' });
    if (!user.isActive) return res.status(401).json({ success: false, error: 'Account is deactivated' });
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ success: false, error: 'Invalid credentials' });
    user.lastLogin = new Date();
    await user.save();
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
    res.json({ success: true, data: { user, company: user.company, branch: user.branch, token } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/me', async (req, res) => {
  try {
    const header = req.header('Authorization');
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'No token' });
    }
    const token = header.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).populate('company branch');
    if (!user) return res.status(401).json({ success: false, error: 'User not found' });
    res.json({ success: true, data: { user, company: user.company, branch: user.branch } });
  } catch (error) {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'Email required' });
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    const generic = { success: true, message: 'If this account exists with a registered phone number, an OTP has been sent via SMS. It is valid for 10 minutes.' };
    if (!user || !user.isActive) return res.json(generic);

    // Fail closed — without SMS delivery there must be no usable reset path.
    if (!user.phone) return res.json(generic);
    const otp = crypto.randomInt(100000, 1000000).toString();
    user.resetOtpHash = crypto.createHash('sha256').update(otp).digest('hex');
    user.resetOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    user.resetOtpAttempts = 0;
    await user.save();

    const sms = await sendSMS(user.phone, `Your CalcuttaRx password reset OTP is ${otp}. Valid for 10 minutes. Never share this code.`, 'otp');
    if (!sms.success) {
      user.resetOtpHash = undefined;
      user.resetOtpExpiry = undefined;
      await user.save();
      return res.json({ success: true, message: 'If this account exists, password reset by OTP is currently unavailable (SMS delivery not configured). Please contact your pharmacy owner or WhatsApp support at 85848 85450.' });
    }
    res.json(generic);
  } catch (error) {
    console.error('Forgot password error:', error.message);
    res.status(500).json({ success: false, error: 'Something went wrong. Please try again.' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, error: 'Email, OTP, and new password required' });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    // Uniform error — never reveal whether the email or the OTP was wrong.
    const invalid = { success: false, error: 'Invalid or expired OTP' };
    if (!user || !user.resetOtpHash || !user.resetOtpExpiry || user.resetOtpExpiry < new Date()) {
      return res.status(400).json(invalid);
    }
    if ((user.resetOtpAttempts || 0) >= 5) {
      return res.status(429).json({ success: false, error: 'Too many attempts. Request a new OTP.' });
    }
    const hashedOtp = crypto.createHash('sha256').update(String(otp).trim()).digest('hex');
    if (hashedOtp !== user.resetOtpHash) {
      user.resetOtpAttempts = (user.resetOtpAttempts || 0) + 1;
      await user.save();
      return res.status(400).json(invalid);
    }
    user.password = newPassword;
    user.resetOtpHash = undefined;
    user.resetOtpExpiry = undefined;
    user.resetOtpAttempts = 0;
    await user.save();
    res.json({ success: true, message: 'Password reset successfully. You can now sign in.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/change-password', async (req, res) => {
  try {
    const header = req.header('Authorization');
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'No token' });
    }
    const token = header.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Current and new password required' });
    }
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ success: false, error: 'User not found' });
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ success: false, error: 'Current password is incorrect' });
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
