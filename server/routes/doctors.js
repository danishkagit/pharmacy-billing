const express = require('express');
const router = express.Router();
const Doctor = require('../models/Doctor');

router.get('/', async (req, res) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const filter = { companyRef: req.company._id };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { regNo: { $regex: search, $options: 'i' } },
        { hospital: { $regex: search, $options: 'i' } },
        { specialization: { $regex: search, $options: 'i' } }
      ];
    }
    const total = await Doctor.countDocuments(filter);
    const doctors = await Doctor.find(filter).sort({ name: 1 }).skip((page - 1) * parseInt(limit)).limit(parseInt(limit));
    res.json({ success: true, data: doctors, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ _id: req.params.id, companyRef: req.company._id });
    if (!doctor) return res.status(404).json({ success: false, error: 'Doctor not found' });
    res.json({ success: true, data: doctor });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const doctor = await Doctor.create({ ...req.body, companyRef: req.company._id });
    res.status(201).json({ success: true, data: doctor });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findOneAndUpdate({ _id: req.params.id, companyRef: req.company._id }, req.body, { new: true, runValidators: true });
    if (!doctor) return res.status(404).json({ success: false, error: 'Doctor not found' });
    res.json({ success: true, data: doctor });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findOneAndUpdate({ _id: req.params.id, companyRef: req.company._id }, { isActive: false }, { new: true });
    if (!doctor) return res.status(404).json({ success: false, error: 'Doctor not found' });
    res.json({ success: true, message: 'Doctor deactivated' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
