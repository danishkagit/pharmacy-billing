const express = require('express');
const router = express.Router();
const Company = require('../models/Company');
const { rbac } = require('../middleware/rbac');

router.get('/', async (req, res) => {
  try {
    const company = await Company.findById(req.company._id);
    if (!company) return res.status(404).json({ success: false, error: 'Company not found' });
    res.json({ success: true, data: company });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const EDITABLE_KEYS = [
  'name', 'legalName', 'address', 'city', 'state', 'pincode', 'phone', 'email',
  'gstin', 'pan', 'dlNo', 'dlNoWholesale', 'fssaiNo', 'dlExpiryDate', 'fssaiExpiryDate',
  'drugLicenseCategory', 'logo', 'invoicePrefix', 'invoiceNote',
  'gstType', 'bankName', 'bankAccountNo', 'bankIfsc', 'upiId',
  'invoiceTemplate', 'showHsnOnPrint', 'showExpiryOnPrint', 'showMrpOnPrint',
  'billCopies', 'printAfterSave', 'declarationNote', 'scheduleWarningNote',
  'taxMode', 'autoRoundOff', 'enableEInvoice', 'ewayThreshold', 'discountSlabs'
];

router.put('/', rbac('owner', 'admin'), async (req, res) => {
  try {
    const patch = {};
    for (const key of EDITABLE_KEYS) {
      if (req.body[key] !== undefined) patch[key] = req.body[key];
    }
    // Retail-only build — force license category to retail
    patch.drugLicenseCategory = 'retail';
    const company = await Company.findByIdAndUpdate(req.company._id, patch, { new: true, runValidators: true });
    if (!company) return res.status(404).json({ success: false, error: 'Company not found' });
    res.json({ success: true, data: company });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
