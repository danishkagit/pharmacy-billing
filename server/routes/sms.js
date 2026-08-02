const express = require('express');
const router = express.Router();
const { sendSMS, sendWhatsApp } = require('../utils/sms');
const SmsLog = require('../models/SmsLog');

router.post('/send', async (req, res) => {
  try {
    const { recipient, message, type, channel } = req.body;
    if (!recipient || !message) return res.status(400).json({ success: false, error: 'Recipient and message required' });
    let result;
    if (channel === 'whatsapp' || req.body.useWhatsApp) {
      result = await sendWhatsApp(recipient, message, type || 'other', null, null, req.activeBranch, req.company._id, req.user._id);
    } else {
      result = await sendSMS(recipient, message, type || 'other', null, null, req.activeBranch, req.company._id, req.user._id);
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/logs', async (req, res) => {
  try {
    const { type, from, to, page = 1, limit = 50 } = req.query;
    const filter = { companyRef: req.company._id };
    if (req.activeBranch) filter.branch = req.activeBranch;
    if (type) filter.type = type;
    if (from || to) { filter.createdAt = {}; if (from) filter.createdAt.$gte = new Date(from); if (to) filter.createdAt.$lte = new Date(new Date(to).setHours(23,59,59,999)); }
    const total = await SmsLog.countDocuments(filter);
    const logs = await SmsLog.find(filter).sort({ createdAt: -1 }).skip((page - 1) * parseInt(limit)).limit(parseInt(limit));
    res.json({ success: true, data: logs, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
