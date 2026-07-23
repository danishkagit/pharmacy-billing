const express = require('express');
const router = express.Router();
const Prescription = require('../models/Prescription');
const { hasPermission } = require('../middleware/rbac');

router.get('/', async (req, res) => {
  try {
    const { search, doctor, patient, from, to, page = 1, limit = 50 } = req.query;
    const filter = { companyRef: req.company._id };
    if (req.activeBranch) filter.branch = req.activeBranch;
    if (search) {
      filter.$or = [
        { prescriptionNo: { $regex: search, $options: 'i' } },
        { patientName: { $regex: search, $options: 'i' } },
        { doctorName: { $regex: search, $options: 'i' } }
      ];
    }
    if (doctor) filter.doctor = doctor;
    if (patient) filter.patient = patient;
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }
    const total = await Prescription.countDocuments(filter);
    const prescriptions = await Prescription.find(filter).populate('doctor', 'name hospital').populate('patient', 'name phone').sort({ date: -1 }).skip((page - 1) * parseInt(limit)).limit(parseInt(limit));
    res.json({ success: true, data: prescriptions, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const prescription = await Prescription.findOne({ _id: req.params.id, companyRef: req.company._id }).populate('doctor', 'name hospital').populate('patient', 'name phone');
    if (!prescription) return res.status(404).json({ success: false, error: 'Prescription not found' });
    res.json({ success: true, data: prescription });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', hasPermission('compliance'), async (req, res) => {
  try {
    const count = await Prescription.countDocuments({ companyRef: req.company._id });
    const rxNo = `RX${String(count + 1).padStart(6, '0')}`;
    const prescription = await Prescription.create({
      ...req.body,
      prescriptionNo: req.body.prescriptionNo || rxNo,
      companyRef: req.company._id,
      branch: req.activeBranch || req.branch?._id,
      createdBy: req.user._id
    });
    res.status(201).json({ success: true, data: prescription });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', hasPermission('compliance'), async (req, res) => {
  try {
    const prescription = await Prescription.findOneAndUpdate({ _id: req.params.id, companyRef: req.company._id }, req.body, { new: true, runValidators: true });
    if (!prescription) return res.status(404).json({ success: false, error: 'Prescription not found' });
    res.json({ success: true, data: prescription });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
