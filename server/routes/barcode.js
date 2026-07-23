const express = require('express');
const router = express.Router();
const { generateBarcode } = require('../utils/barcode');

router.post('/generate', async (req, res) => {
  try {
    const { text, options } = req.body;
    if (!text) return res.status(400).json({ success: false, error: 'Text is required' });
    const barcode = await generateBarcode(text, options);
    res.json({ success: true, data: { barcode: `data:image/png;base64,${barcode}` } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/batch-qr', async (req, res) => {
  try {
    const { generateBatchQR } = require('../utils/barcode');
    const qr = await generateBatchQR(req.body);
    res.json({ success: true, data: { qr: `data:image/png;base64,${qr}` } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/print', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !ids.length) return res.status(400).json({ success: false, error: 'IDs required' });
    const Medicine = require('../models/Medicine');
    const medicines = await Medicine.find({ _id: { $in: ids } });
    const barcodes = await Promise.all(medicines.map(async (m) => {
      const code = await generateBarcode(m._id.toString());
      return { name: m.name, _id: m._id, barcode: `data:image/png;base64,${code}` };
    }));
    res.json({ success: true, data: barcodes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
