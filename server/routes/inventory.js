const express = require('express');
const router = express.Router();
const Batch = require('../models/Batch');
const StockAdjustment = require('../models/StockAdjustment');
const { hasPermission } = require('../middleware/rbac');

router.get('/stock-summary', async (req, res) => {
  try {
    const filter = { branch: req.activeBranch || req.branch?._id, isExpired: false, qty: { $gt: 0 } };
    const summary = await Batch.aggregate([
      { $match: filter },
      { $group: { _id: '$medicine', totalQty: { $sum: '$qty' }, totalValue: { $sum: { $multiply: ['$qty', '$purchaseRate'] } }, batchCount: { $sum: 1 } } },
      { $sort: { totalValue: -1 } },
      { $limit: 20 }
    ]);
    await Batch.populate(summary, { path: '_id', select: 'name manufacturer category schedule' });
    const top = summary.map(s => ({ medicine: s._id, totalQty: s.totalQty, totalValue: s.totalValue, batchCount: s.batchCount }));
    res.json({ success: true, data: top });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/low-stock', async (req, res) => {
  try {
    const filter = { branch: req.activeBranch || req.branch?._id, isExpired: false, qty: { $gt: 0 } };
    const batches = await Batch.find(filter).populate('medicine', 'name reorderLevel manufacturer');
    const medicineMap = {};
    batches.forEach(b => {
      if (!medicineMap[b.medicine?._id]) {
        medicineMap[b.medicine?._id] = { medicine: b.medicine, totalQty: 0 };
      }
      medicineMap[b.medicine?._id].totalQty += b.qty;
    });
    const lowStock = Object.values(medicineMap).filter(m => m.medicine && m.medicine.reorderLevel > 0 && m.totalQty <= m.medicine.reorderLevel);
    res.json({ success: true, data: lowStock });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/adjust', hasPermission('inventory'), async (req, res) => {
  try {
    const count = await StockAdjustment.countDocuments({ companyRef: req.company._id });
    const adjNo = `ADJ${String(count + 1).padStart(5, '0')}`;
    const items = await Promise.all(req.body.items.map(async (item) => {
      const batch = await Batch.findById(item.batch);
      return {
        medicine: item.medicine,
        medicineName: item.medicineName || batch?.medicine?.toString(),
        batch: item.batch,
        batchNo: batch?.batchNo || item.batchNo,
        expiryDate: batch?.expiryDate,
        qtyBefore: batch?.qty || 0,
        qtyAfter: item.qtyAfter || 0,
        difference: (item.qtyAfter || 0) - (batch?.qty || 0),
        rate: batch?.purchaseRate || 0,
        amount: Math.abs((item.qtyAfter || 0) - (batch?.qty || 0)) * (batch?.purchaseRate || 0)
      };
    }));
    const adjustment = await StockAdjustment.create({
      adjustmentNo: adjNo,
      type: req.body.type || 'physical_count',
      items,
      totalAmount: items.reduce((s, i) => s + (i.amount || 0), 0),
      reason: req.body.reason || '',
      branch: req.activeBranch || req.branch?._id,
      companyRef: req.company._id,
      createdBy: req.user._id
    });
    for (const item of items) {
      if (item.batch) {
        await Batch.findByIdAndUpdate(item.batch, { qty: item.qtyAfter });
      }
    }
    res.status(201).json({ success: true, data: adjustment });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/adjustments', async (req, res) => {
  try {
    const filter = { companyRef: req.company._id, branch: req.activeBranch || req.branch?._id };
    const adjustments = await StockAdjustment.find(filter).sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, data: adjustments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
