const express = require('express');
const router = express.Router();
const InterBranchTransfer = require('../models/InterBranchTransfer');
const Batch = require('../models/Batch');
const { hasPermission } = require('../middleware/rbac');

router.get('/', async (req, res) => {
  try {
    const { status, from, to, page = 1, limit = 50 } = req.query;
    const filter = { companyRef: req.company._id };
    if (req.activeBranch) {
      filter.$or = [{ fromBranch: req.activeBranch }, { toBranch: req.activeBranch }];
    }
    if (status) filter.status = status;
    if (from || to) { filter.transferDate = {}; if (from) filter.transferDate.$gte = new Date(from); if (to) filter.transferDate.$lte = new Date(new Date(to).setHours(23,59,59,999)); }
    const total = await InterBranchTransfer.countDocuments(filter);
    const transfers = await InterBranchTransfer.find(filter).populate('fromBranch', 'name').populate('toBranch', 'name').populate('createdBy', 'name').sort({ transferDate: -1 }).skip((page - 1) * parseInt(limit)).limit(parseInt(limit));
    res.json({ success: true, data: transfers, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const transfer = await InterBranchTransfer.findOne({ _id: req.params.id, companyRef: req.company._id }).populate('fromBranch', 'name').populate('toBranch', 'name').populate('createdBy', 'name');
    if (!transfer) return res.status(404).json({ success: false, error: 'Transfer not found' });
    res.json({ success: true, data: transfer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', hasPermission('inventory'), async (req, res) => {
  try {
    const count = await InterBranchTransfer.countDocuments({ companyRef: req.company._id });
    const transferNo = `TR${String(count + 1).padStart(5, '0')}`;
    const items = req.body.items.map(i => ({ ...i, amount: (i.qty || 0) * (i.rate || 0) }));
    const totalAmount = items.reduce((s, i) => s + (i.amount || 0), 0);
    const transfer = await InterBranchTransfer.create({
      ...req.body,
      transferNo: req.body.transferNo || transferNo,
      items,
      totalItems: items.length,
      totalAmount,
      companyRef: req.company._id,
      createdBy: req.user._id
    });
    for (const item of items) {
      if (item.batch && item.qty) {
        await Batch.findByIdAndUpdate(item.batch, { $inc: { qty: -item.qty } });
      }
    }
    res.status(201).json({ success: true, data: transfer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id/receive', hasPermission('inventory'), async (req, res) => {
  try {
    const transfer = await InterBranchTransfer.findOne({ _id: req.params.id, companyRef: req.company._id });
    if (!transfer) return res.status(404).json({ success: false, error: 'Transfer not found' });
    if (transfer.status === 'received') {
      return res.json({ success: true, data: transfer, message: 'Transfer already received' });
    }
    transfer.status = 'received';
    transfer.receivedAt = new Date();
    transfer.receivedBy = req.user._id;
    await transfer.save();
    for (const item of transfer.items) {
      if (item.batch && item.qty) {
        const batch = await Batch.findById(item.batch);
        if (batch) {
          const newBatch = await Batch.create({
            medicine: item.medicine,
            batchNo: batch.batchNo,
            mfgDate: batch.mfgDate,
            expiryDate: batch.expiryDate,
            mrp: batch.mrp,
            purchaseRate: batch.purchaseRate,
            saleRate: batch.saleRate,
            qty: item.qty,
            supplier: batch.supplier,
            branch: transfer.toBranch,
            location: batch.location
          });
        }
      }
    }
    res.json({ success: true, data: transfer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
