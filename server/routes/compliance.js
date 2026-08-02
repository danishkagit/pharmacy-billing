const express = require('express');
const router = express.Router();
const DrugScheduleLog = require('../models/DrugScheduleLog');

router.get('/schedule-logs', async (req, res) => {
  try {
    const { schedule, medicine, from, to, page = 1, limit = 100 } = req.query;
    const filter = { companyRef: req.company._id, branch: req.activeBranch || req.branch?._id };
    if (schedule) filter.schedule = schedule;
    if (medicine) filter.medicine = medicine;
    if (from || to) { filter.dispensedAt = {}; if (from) filter.dispensedAt.$gte = new Date(from); if (to) filter.dispensedAt.$lte = new Date(new Date(to).setHours(23,59,59,999)); }
    const total = await DrugScheduleLog.countDocuments(filter);
    const logs = await DrugScheduleLog.find(filter).populate('medicine', 'name composition schedule').populate('dispensedBy', 'name').sort({ dispensedAt: -1 }).skip((page - 1) * parseInt(limit)).limit(parseInt(limit));
    res.json({ success: true, data: logs, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/drug-license', async (req, res) => {
  try {
    const Company = require('../models/Company');
    const company = await Company.findById(req.company._id).select('dlNo dlExpiryDate fssaiNo fssaiExpiryDate drugLicenseCategory');
    res.json({ success: true, data: company });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
