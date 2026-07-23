const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');

router.get('/', async (req, res) => {
  try {
    const { search, doctor, page = 1, limit = 50 } = req.query;
    const filter = { companyRef: req.company._id };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { abhaId: { $regex: search, $options: 'i' } }
      ];
    }
    if (doctor) filter.doctor = doctor;
    const total = await Patient.countDocuments(filter);
    const patients = await Patient.find(filter).populate('doctor', 'name hospital specialization').sort({ name: 1 }).skip((page - 1) * parseInt(limit)).limit(parseInt(limit));
    res.json({ success: true, data: patients, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const patient = await Patient.findOne({ _id: req.params.id, companyRef: req.company._id }).populate('doctor', 'name hospital');
    if (!patient) return res.status(404).json({ success: false, error: 'Patient not found' });
    res.json({ success: true, data: patient });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const patient = await Patient.create({ ...req.body, companyRef: req.company._id });
    res.status(201).json({ success: true, data: patient });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const patient = await Patient.findOneAndUpdate({ _id: req.params.id, companyRef: req.company._id }, req.body, { new: true, runValidators: true });
    if (!patient) return res.status(404).json({ success: false, error: 'Patient not found' });
    res.json({ success: true, data: patient });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const patient = await Patient.findOneAndUpdate({ _id: req.params.id, companyRef: req.company._id }, { isActive: false }, { new: true });
    if (!patient) return res.status(404).json({ success: false, error: 'Patient not found' });
    res.json({ success: true, message: 'Patient deactivated' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
