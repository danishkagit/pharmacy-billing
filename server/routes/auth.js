const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Company = require('../models/Company');
const Branch = require('../models/Branch');

router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, companyName, gstin, dlNo, drugLicenseCategory } = req.body;
    if (!name || !email || !password || !companyName) {
      return res.status(400).json({ success: false, error: 'Name, email, password, and company name required' });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, error: 'Email already registered' });
    const company = await Company.create({ name: companyName, gstin, dlNo, drugLicenseCategory: 'retail' });
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
    if (!user) {
      return res.json({ success: true, message: 'If an account exists for this email, a reset token has been generated.' });
    }
    const resetToken = crypto.randomBytes(24).toString('hex');
    user.resetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();
    res.json({
      success: true,
      message: 'Password reset token generated (valid for 1 hour). Use it to set a new password.',
      resetToken
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    if (!email || !token || !newPassword) {
      return res.status(400).json({ success: false, error: 'Email, reset token, and new password required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      resetToken: hashedToken,
      resetTokenExpiry: { $gt: new Date() }
    });
    if (!user) return res.status(400).json({ success: false, error: 'Invalid or expired reset token' });
    user.password = newPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
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
