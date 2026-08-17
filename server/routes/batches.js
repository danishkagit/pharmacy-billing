const express = require('express');
const router = express.Router();
const Batch = require('../models/Batch');
const Medicine = require('../models/Medicine');
const { hasPermission } = require('../middleware/rbac');

router.get('/', async (req, res) => {
  try {
    const { medicine, search, isExpired, expiring, expiryFrom, expiryTo, branch, supplier, page = 1, limit = 100 } = req.query;
    const filter = {};
    if (req.activeBranch) filter.branch = req.activeBranch;
    if (medicine) filter.medicine = medicine;
    if (supplier) filter.supplier = supplier;
    if (isExpired !== undefined) filter.isExpired = isExpired === 'true';
    if (expiring) {
      const days = parseInt(expiring);
      const future = new Date();
      future.setDate(future.getDate() + days);
      filter.expiryDate = { $lte: future, $gte: new Date() };
      filter.isExpired = false;
    }
    if (expiryFrom || expiryTo) {
      filter.expiryDate = {};
      if (expiryFrom) filter.expiryDate.$gte = new Date(expiryFrom);
      if (expiryTo) filter.expiryDate.$lte = new Date(expiryTo);
    }
    if (search) {
      const medicines = await Medicine.find({
        company: req.company._id,
        name: { $regex: search, $options: 'i' }
      }).select('_id');
      filter.medicine = { $in: medicines.map(m => m._id) };
    }
    const total = await Batch.countDocuments(filter);
    const batches = await Batch.find(filter)
      .populate('medicine', 'name composition manufacturer schedule hsn gstRate mrp')
      .populate('supplier', 'name')
      .sort({ expiryDate: 1 })
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit));
    const totalQty = await Batch.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: '$qty' } } }
    ]);
    res.json({
      success: true,
      data: batches,
      total,
      totalQty: totalQty[0]?.total || 0,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/stock/:medicineId', async (req, res) => {
  try {
    const filter = { medicine: req.params.medicineId, qty: { $gt: 0 }, isExpired: false };
    if (req.activeBranch) filter.branch = req.activeBranch;
    const batches = await Batch.find(filter)
      .populate('medicine', 'name schedule mrp')
      .sort({ expiryDate: 1 });
    const totalStock = batches.reduce((sum, b) => sum + b.qty, 0);
    res.json({ success: true, data: batches, totalStock });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', hasPermission('inventory'), async (req, res) => {
  try {
    const batch = await Batch.findOneAndUpdate(
      { _id: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!batch) return res.status(404).json({ success: false, error: 'Batch not found' });
    res.json({ success: true, data: batch });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/expiry-report', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const future = new Date();
    future.setDate(future.getDate() + parseInt(days));
    const filter = { expiryDate: { $lte: future, $gte: new Date() }, isExpired: false };
    if (req.activeBranch) filter.branch = req.activeBranch;
    const batches = await Batch.find(filter)
      .populate('medicine', 'name manufacturer mrp')
      .sort({ expiryDate: 1 })
      .limit(200);
    const report = batches.map(b => ({
      medicineName: b.medicine?.name || 'Unknown',
      manufacturer: b.medicine?.manufacturer || '',
      batchNo: b.batchNo,
      expiryDate: b.expiryDate,
      qty: b.qty,
      mrp: b.mrp,
      daysRemaining: Math.ceil((b.expiryDate - new Date()) / (1000 * 60 * 60 * 24)),
      location: b.location
    }));
    res.json({ success: true, data: report, count: report.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/expiry-report/pdf', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const future = new Date();
    future.setDate(future.getDate() + parseInt(days));
    const filter = { expiryDate: { $lte: future, $gte: new Date() }, isExpired: false };
    if (req.activeBranch) filter.branch = req.activeBranch;
    const batches = await Batch.find(filter)
      .populate('medicine', 'name manufacturer mrp')
      .sort({ expiryDate: 1 })
      .limit(500);
    const items = batches.map(b => ({
      medicineName: b.medicine?.name || 'Unknown',
      batchNo: b.batchNo,
      expiryDate: b.expiryDate,
      qty: b.qty,
      mrp: b.mrp
    }));
    const { generateExpiryReport } = require('../utils/pdf');
    const buffer = await generateExpiryReport(items);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=expiry-report-${days}days-${new Date().toISOString().slice(0, 10)}.pdf`);
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
