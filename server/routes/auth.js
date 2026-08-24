const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Company = require('../models/Company');
const Branch = require('../models/Branch');
const emailUtil = require('../utils/email');
const linotp = require('../utils/linotp');

function maskEmail(email) {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0]}*@${domain}`;
  return `${local[0]}${'*'.repeat(local.length - 2)}${local.slice(-1)}@${domain}`;
}

function normalizePhone(raw) {
  const digits = String(raw || '').replace(/[^0-9]/g, '');
  return digits.length >= 10 ? digits.slice(-10) : '';
}

function linotpUsername(user) {
  return linotp.USERNAME_FIELD === 'phone' && user.phone
    ? normalizePhone(user.phone)
    : user.email;
}

// ── Registration ─────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, companyName, gstin, dlNo, drugLicenseCategory } = req.body;
    if (!name || !email || !password || !companyName) {
      return res.status(400).json({ success: false, error: 'Name, email, password, and company name required' });
    }
    const cleanEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) return res.status(400).json({ success: false, error: 'Email already registered' });

    const company = await Company.create({
      name: companyName,
      gstin,
      dlNo,
      drugLicenseCategory: drugLicenseCategory || 'retail',
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

    // Verification token & OTP
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationOtp = crypto.randomInt(100000, 1000000).toString();
    const verificationOtpHash = crypto.createHash('sha256').update(verificationOtp).digest('hex');

    const user = await User.create({
      name,
      email: cleanEmail,
      phone,
      password,
      role: 'owner',
      company: company._id,
      branch: branch._id,
      permissions: {
        billing: true, purchase: true, inventory: true, returns: true,
        accounting: true, reports: true, staff: true, settings: true,
        compliance: true, allBranches: true
      },
      isEmailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
      emailVerificationOtpHash: verificationOtpHash
    });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const verifyUrl = `${clientUrl}/verify-email?token=${verificationToken}&email=${encodeURIComponent(cleanEmail)}`;

    // Send verification email in background
    emailUtil.sendVerificationEmail(cleanEmail, verificationOtp, verifyUrl, name).catch(err => {
      console.error('Failed to send verification email:', err.message);
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });

    res.status(201).json({
      success: true,
      data: { user, company, branch, token },
      message: 'Account created successfully. A verification code has been sent to your email.'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ── Email & Password Login ───────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password required' });
    }
    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail }).populate('company branch');
    if (!user) return res.status(401).json({ success: false, error: 'Invalid credentials' });
    if (!user.isActive) return res.status(401).json({ success: false, error: 'Account is deactivated' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ success: false, error: 'Invalid credentials' });

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
    res.json({ success: true, data: { user, company: user.company, branch: user.branch, token } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ── Current User ─────────────────────────────────────────────────────────────
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

// ── Email Verification Endpoints ─────────────────────────────────────────────
router.post('/verify-email/request', async (req, res) => {
  try {
    let email = req.body.email;
    const header = req.header('Authorization');

    if (!email && header && header.startsWith('Bearer ')) {
      try {
        const token = header.replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const u = await User.findById(decoded.id);
        if (u) email = u.email;
      } catch (e) {}
    }

    if (!email) return res.status(400).json({ success: false, error: 'Email address required' });

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.json({
        success: true,
        message: 'If an account exists with this email, a verification code has been sent.'
      });
    }

    if (user.isEmailVerified) {
      return res.json({ success: true, message: 'This email is already verified.' });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationOtp = crypto.randomInt(100000, 1000000).toString();
    user.emailVerificationToken = verificationToken;
    user.emailVerificationOtpHash = crypto.createHash('sha256').update(verificationOtp).digest('hex');
    user.emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const verifyUrl = `${clientUrl}/verify-email?token=${verificationToken}&email=${encodeURIComponent(cleanEmail)}`;

    await emailUtil.sendVerificationEmail(cleanEmail, verificationOtp, verifyUrl, user.name);

    res.json({
      success: true,
      message: `Verification code sent to ${cleanEmail}. Valid for 24 hours.`
    });
  } catch (error) {
    console.error('Verify email request error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to send verification email' });
  }
});

router.post('/verify-email/confirm', async (req, res) => {
  try {
    const { email, otp, token } = req.body;
    let user = null;

    if (token) {
      user = await User.findOne({
        emailVerificationToken: token,
        emailVerificationExpiry: { $gt: new Date() }
      });
    } else if (email && otp) {
      const cleanEmail = email.toLowerCase().trim();
      const candidate = await User.findOne({ email: cleanEmail });
      if (candidate && candidate.emailVerificationOtpHash && candidate.emailVerificationExpiry > new Date()) {
        const hash = crypto.createHash('sha256').update(String(otp).trim()).digest('hex');
        if (hash === candidate.emailVerificationOtpHash) {
          user = candidate;
        }
      }
    }

    if (!user) {
      return res.status(400).json({ success: false, error: 'Invalid or expired verification code or link.' });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpiry = undefined;
    user.emailVerificationOtpHash = undefined;
    await user.save();

    res.json({ success: true, message: 'Email verified successfully! You now have full access.' });
  } catch (error) {
    console.error('Verify email confirm error:', error.message);
    res.status(500).json({ success: false, error: 'Verification failed' });
  }
});

// ── Forgot Password ──────────────────────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, error: 'Email required' });
    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });
    const generic = {
      success: true,
      message: 'If this account exists, an OTP code has been dispatched. Please check your inbox or LinOTP authenticator.'
    };
    if (!user || !user.isActive) return res.json(generic);

    // LinOTP Authentication if configured
    if (linotp.isConfigured()) {
      try {
        await linotp.triggerChallenge(linotpUsername(user));
        return res.json(generic);
      } catch (e) {
        console.error('LinOTP challenge failed:', e.message);
      }
    }

    // Free & Open-Source Email OTP
    const otp = crypto.randomInt(100000, 1000000).toString();
    user.resetOtpHash = crypto.createHash('sha256').update(otp).digest('hex');
    user.resetOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    user.resetOtpAttempts = 0;
    await user.save();

    await emailUtil.sendPasswordResetOtp(user.email, otp, user.name);
    res.json(generic);
  } catch (error) {
    console.error('Forgot password error:', error.message);
    res.status(500).json({ success: false, error: 'Something went wrong. Please try again.' });
  }
});

// ── Reset Password ───────────────────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, error: 'Email, OTP, and new password required' });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }
    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });
    const invalid = { success: false, error: 'Invalid or expired OTP code' };
    if (!user) return res.status(400).json(invalid);

    if ((user.resetOtpAttempts || 0) >= 5) {
      return res.status(429).json({ success: false, error: 'Too many attempts. Request a new OTP.' });
    }

    let ok = false;
    if (linotp.isConfigured()) {
      ok = await linotp.validateOtp(linotpUsername(user), otp).catch(() => false);
    } else {
      if (user.resetOtpHash && user.resetOtpExpiry && user.resetOtpExpiry >= new Date()) {
        const hashedOtp = crypto.createHash('sha256').update(String(otp).trim()).digest('hex');
        if (hashedOtp === user.resetOtpHash) {
          ok = true;
        }
      }
    }

    if (!ok) {
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
    console.error('Reset password error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ── Open-Source OTP Login (Email OTP / LinOTP) ──────────────────────────────
router.post('/otp/request', async (req, res) => {
  try {
    const input = String(req.body.identifier || req.body.email || req.body.phone || '').trim();
    if (!input) {
      return res.status(400).json({ success: false, error: 'Please enter your registered email address or mobile number' });
    }

    let user = null;
    if (input.includes('@')) {
      user = await User.findOne({ isActive: true, email: input.toLowerCase() });
    } else {
      const phoneDigits = normalizePhone(input);
      if (phoneDigits) {
        user = await User.findOne({ isActive: true, phone: new RegExp(phoneDigits + '$') });
      }
    }

    const genericMsg = 'If this account is registered, a 6-digit one-time code has been sent. It is valid for 10 minutes.';

    if (!user) {
      return res.json({ success: true, message: genericMsg });
    }

    // Rate-limiting: 1 request per 60 seconds
    if (user.otpLastSentAt && Date.now() - new Date(user.otpLastSentAt).getTime() < 60 * 1000) {
      const remainingSecs = Math.ceil((60000 - (Date.now() - new Date(user.otpLastSentAt).getTime())) / 1000);
      return res.status(429).json({
        success: false,
        error: `Please wait ${remainingSecs} seconds before requesting another code.`
      });
    }

    // LinOTP Authentication if configured
    if (linotp.isConfigured()) {
      try {
        await linotp.triggerChallenge(linotpUsername(user));
        user.loginOtpAttempts = 0;
        user.otpLastSentAt = new Date();
        await user.save();
        return res.json({ success: true, message: 'LinOTP challenge dispatched. Enter your code to sign in.' });
      } catch (e) {
        console.error('LinOTP challenge trigger error:', e.message);
      }
    }

    // Free Open-Source Email OTP
    const otp = crypto.randomInt(100000, 1000000).toString();
    user.loginOtpHash = crypto.createHash('sha256').update(otp).digest('hex');
    user.loginOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    user.loginOtpAttempts = 0;
    user.otpLastSentAt = new Date();
    await user.save();

    await emailUtil.sendLoginOtp(user.email, otp, user.name);

    res.json({
      success: true,
      message: `OTP sent to ${maskEmail(user.email)}. It is valid for 10 minutes.`,
      emailMasked: maskEmail(user.email)
    });
  } catch (error) {
    console.error('OTP request error:', error.message);
    res.status(500).json({ success: false, error: 'Something went wrong. Please try again.' });
  }
});

router.post('/otp/verify', async (req, res) => {
  try {
    const { otp } = req.body;
    const input = String(req.body.identifier || req.body.email || req.body.phone || '').trim();
    const invalid = { success: false, error: 'Invalid or expired OTP code' };

    if (!input || !otp || String(otp).trim().length < 4) {
      return res.status(400).json(invalid);
    }

    let user = null;
    if (input.includes('@')) {
      user = await User.findOne({ isActive: true, email: input.toLowerCase() }).populate('company branch');
    } else {
      const phoneDigits = normalizePhone(input);
      if (phoneDigits) {
        user = await User.findOne({ isActive: true, phone: new RegExp(phoneDigits + '$') }).populate('company branch');
      }
    }

    if (!user) return res.status(401).json(invalid);

    if ((user.loginOtpAttempts || 0) >= 5) {
      return res.status(429).json({ success: false, error: 'Too many failed attempts. Request a new OTP.' });
    }

    let ok = false;
    if (linotp.isConfigured()) {
      ok = await linotp.validateOtp(linotpUsername(user), otp).catch(() => false);
    } else {
      if (user.loginOtpHash && user.loginOtpExpiry && user.loginOtpExpiry >= new Date()) {
        const hashed = crypto.createHash('sha256').update(String(otp).trim()).digest('hex');
        if (hashed === user.loginOtpHash) {
          ok = true;
        }
      }
    }

    if (!ok) {
      user.loginOtpAttempts = (user.loginOtpAttempts || 0) + 1;
      await user.save();
      return res.status(401).json(invalid);
    }

    // Reset OTP states upon successful verification
    user.loginOtpHash = undefined;
    user.loginOtpExpiry = undefined;
    user.loginOtpAttempts = 0;
    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });

    res.json({
      success: true,
      data: { user, company: user.company, branch: user.branch, token },
      message: 'Signed in successfully.'
    });
  } catch (error) {
    console.error('OTP verify error:', error.message);
    res.status(500).json({ success: false, error: 'Something went wrong. Please try again.' });
  }
});

// ── Change Password (Authenticated) ──────────────────────────────────────────
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
