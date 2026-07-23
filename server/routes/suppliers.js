const express = require('express');
const router = express.Router();
const Supplier = require('../models/Supplier');
const { hasPermission } = require('../middleware/rbac');

router.get('/', async (req, res) => {
  try {
    const { search, isActive, page = 1, limit = 50 } = req.query;
    const filter = { companyRef: req.company._id };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    const total = await Supplier.countDocuments(filter);
    const suppliers = await Supplier.find(filter)
      .sort({ name: 1 })
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit));
    res.json({ success: true, data: suppliers, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const supplier = await Supplier.findOne({ _id: req.params.id, companyRef: req.company._id });
    if (!supplier) return res.status(404).json({ success: false, error: 'Supplier not found' });
    res.json({ success: true, data: supplier });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', hasPermission('purchase'), async (req, res) => {
  try {
    const supplier = await Supplier.create({ ...req.body, companyRef: req.company._id });
    res.status(201).json({ success: true, data: supplier });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', hasPermission('purchase'), async (req, res) => {
  try {
    const supplier = await Supplier.findOneAndUpdate(
      { _id: req.params.id, companyRef: req.company._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!supplier) return res.status(404).json({ success: false, error: 'Supplier not found' });
    res.json({ success: true, data: supplier });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:id', hasPermission('purchase'), async (req, res) => {
  try {
    const supplier = await Supplier.findOneAndUpdate(
      { _id: req.params.id, companyRef: req.company._id },
      { isActive: false },
      { new: true }
    );
    if (!supplier) return res.status(404).json({ success: false, error: 'Supplier not found' });
    res.json({ success: true, message: 'Supplier deactivated' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/:id/schemes', hasPermission('purchase'), async (req, res) => {
  try {
    const supplier = await Supplier.findOne({ _id: req.params.id, companyRef: req.company._id });
    if (!supplier) return res.status(404).json({ success: false, error: 'Supplier not found' });
    supplier.schemes.push(req.body);
    await supplier.save();
    res.json({ success: true, data: supplier });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
