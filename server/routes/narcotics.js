const express = require('express');
const router = express.Router();
const NarcoticsRegister = require('../models/NarcoticsRegister');
const { hasPermission } = require('../middleware/rbac');

router.get('/', async (req, res) => {
  try {
    const { medicine, from, to, page = 1, limit = 100 } = req.query;
    const filter = { companyRef: req.company._id, branch: req.activeBranch || req.branch?._id };
    if (medicine) filter.medicine = medicine;
    if (from || to) { filter.date = {}; if (from) filter.date.$gte = new Date(from); if (to) filter.date.$lte = new Date(to); }
    const total = await NarcoticsRegister.countDocuments(filter);
    const entries = await NarcoticsRegister.find(filter).populate('medicine', 'name composition manufacturer').populate('dispensedBy', 'name').sort({ date: -1 }).skip((page - 1) * parseInt(limit)).limit(parseInt(limit));
    res.json({ success: true, data: entries, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const entry = await NarcoticsRegister.findOne({ _id: req.params.id, companyRef: req.company._id }).populate('medicine', 'name composition').populate('dispensedBy', 'name');
    if (!entry) return res.status(404).json({ success: false, error: 'Narcotics register entry not found' });
    res.json({ success: true, data: entry });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
