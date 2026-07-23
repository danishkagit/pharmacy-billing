const express = require('express');
const router = express.Router();
const Salesman = require('../models/Salesman');
const { hasPermission } = require('../middleware/rbac');

router.get('/', async (req, res) => {
  try {
    const salesmen = await Salesman.find({ companyRef: req.company._id, isActive: true }).populate('branches', 'name').sort({ name: 1 });
    res.json({ success: true, data: salesmen });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const salesman = await Salesman.findOne({ _id: req.params.id, companyRef: req.company._id }).populate('branches', 'name');
    if (!salesman) return res.status(404).json({ success: false, error: 'Salesman not found' });
    res.json({ success: true, data: salesman });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', hasPermission('staff'), async (req, res) => {
  try {
    const salesman = await Salesman.create({ ...req.body, companyRef: req.company._id });
    res.status(201).json({ success: true, data: salesman });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', hasPermission('staff'), async (req, res) => {
  try {
    const salesman = await Salesman.findOneAndUpdate({ _id: req.params.id, companyRef: req.company._id }, req.body, { new: true, runValidators: true });
    if (!salesman) return res.status(404).json({ success: false, error: 'Salesman not found' });
    res.json({ success: true, data: salesman });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:id', hasPermission('staff'), async (req, res) => {
  try {
    const salesman = await Salesman.findOneAndUpdate({ _id: req.params.id, companyRef: req.company._id }, { isActive: false }, { new: true });
    if (!salesman) return res.status(404).json({ success: false, error: 'Salesman not found' });
    res.json({ success: true, message: 'Salesman deactivated' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;