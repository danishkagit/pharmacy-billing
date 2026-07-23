const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { rbac } = require('../middleware/rbac');

router.get('/', rbac('owner', 'admin'), async (req, res) => {
  try {
    const filter = { company: req.company._id };
    if (req.activeBranch && !req.user.permissions?.allBranches) {
      filter.branch = req.activeBranch;
    }
    const users = await User.find(filter).populate('branch', 'name').select('-password').sort({ name: 1 });
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', rbac('owner', 'admin'), async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, company: req.company._id }).populate('branch', 'name').select('-password');
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', rbac('owner', 'admin'), async (req, res) => {
  try {
    const user = await User.create({ ...req.body, company: req.company._id });
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ success: false, error: 'Email already exists' });
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', rbac('owner', 'admin'), async (req, res) => {
  try {
    const { password, ...rest } = req.body;
    const updateData = rest;
    if (password) updateData.password = password;
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, company: req.company._id },
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:id', rbac('owner'), async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, company: req.company._id },
      { isActive: false },
      { new: true }
    );
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, message: 'User deactivated' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
