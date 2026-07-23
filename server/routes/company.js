const express = require('express');
const router = express.Router();
const Company = require('../models/Company');
const { rbac } = require('../middleware/rbac');

router.get('/', async (req, res) => {
  try {
    const company = await Company.findById(req.company._id);
    if (!company) return res.status(404).json({ success: false, error: 'Company not found' });
    res.json({ success: true, data: company });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/', rbac('owner', 'admin'), async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(req.company._id, req.body, { new: true, runValidators: true });
    if (!company) return res.status(404).json({ success: false, error: 'Company not found' });
    res.json({ success: true, data: company });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
