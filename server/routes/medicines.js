const express = require('express');
const router = express.Router();
const Medicine = require('../models/Medicine');
const { hasPermission } = require('../middleware/rbac');

router.get('/', async (req, res) => {
  try {
    const { search, schedule, category, manufacturer, page = 1, limit = 50, isActive } = req.query;
    const filter = { company: req.company._id };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { composition: { $regex: search, $options: 'i' } },
        { manufacturer: { $regex: search, $options: 'i' } }
      ];
    }
    if (schedule) filter.schedule = schedule;
    if (category) filter.category = category;
    if (manufacturer) filter.manufacturer = { $regex: manufacturer, $options: 'i' };
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    const total = await Medicine.countDocuments(filter);
    const medicines = await Medicine.find(filter)
      .populate('preferredSupplier', 'name')
      .sort({ name: 1 })
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit));
    res.json({ success: true, data: medicines, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const medicine = await Medicine.findOne({ _id: req.params.id, company: req.company._id }).populate('preferredSupplier', 'name');
    if (!medicine) return res.status(404).json({ success: false, error: 'Medicine not found' });
    res.json({ success: true, data: medicine });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', hasPermission('inventory'), async (req, res) => {
  try {
    const medicine = await Medicine.create({ ...req.body, company: req.company._id });
    res.status(201).json({ success: true, data: medicine });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', hasPermission('inventory'), async (req, res) => {
  try {
    const medicine = await Medicine.findOneAndUpdate(
      { _id: req.params.id, company: req.company._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!medicine) return res.status(404).json({ success: false, error: 'Medicine not found' });
    res.json({ success: true, data: medicine });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:id', hasPermission('inventory'), async (req, res) => {
  try {
    const medicine = await Medicine.findOneAndUpdate(
      { _id: req.params.id, company: req.company._id },
      { isActive: false },
      { new: true }
    );
    if (!medicine) return res.status(404).json({ success: false, error: 'Medicine not found' });
    res.json({ success: true, message: 'Medicine deactivated' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/batch/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ success: true, data: [] });
    const medicines = await Medicine.find({
      company: req.company._id,
      isActive: true,
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { composition: { $regex: q, $options: 'i' } },
        { manufacturer: { $regex: q, $options: 'i' } }
      ]
    }).select('name composition manufacturer schedule hsn gstRate mrp requiresPrescription').limit(20);
    res.json({ success: true, data: medicines });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
