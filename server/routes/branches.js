const express = require('express');
const router = express.Router();
const Branch = require('../models/Branch');
const { rbac } = require('../middleware/rbac');

router.get('/', async (req, res) => {
  try {
    const filter = { company: req.company._id };
    if (req.activeBranch && req.user.role !== 'owner' && !req.user.permissions?.allBranches) {
      filter._id = req.activeBranch;
    }
    const branches = await Branch.find(filter).sort({ name: 1 });
    res.json({ success: true, data: branches });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const branch = await Branch.findOne({ _id: req.params.id, company: req.company._id });
    if (!branch) return res.status(404).json({ success: false, error: 'Branch not found' });
    res.json({ success: true, data: branch });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', rbac('owner', 'admin'), async (req, res) => {
  try {
    const branch = await Branch.create({ ...req.body, company: req.company._id });
    res.status(201).json({ success: true, data: branch });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', rbac('owner', 'admin'), async (req, res) => {
  try {
    const branch = await Branch.findOneAndUpdate(
      { _id: req.params.id, company: req.company._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!branch) return res.status(404).json({ success: false, error: 'Branch not found' });
    res.json({ success: true, data: branch });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:id', rbac('owner'), async (req, res) => {
  try {
    const branch = await Branch.findOneAndDelete({ _id: req.params.id, company: req.company._id });
    if (!branch) return res.status(404).json({ success: false, error: 'Branch not found' });
    res.json({ success: true, message: 'Branch deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
