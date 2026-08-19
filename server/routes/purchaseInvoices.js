const express = require('express');
const router = express.Router();
const PurchaseInvoice = require('../models/PurchaseInvoice');
const Batch = require('../models/Batch');
const Supplier = require('../models/Supplier');
const Medicine = require('../models/Medicine');
const path = require('path');
const fs = require('fs');
const { hasPermission } = require('../middleware/rbac');
const { upload, uploadCsv } = require('../middleware/upload');
const { isGeminiConfigured, geminiVision } = require('../utils/gemini');
const { parseCsvTemplate, parsePdfTemplate } = require('../parser');
const { fetchSupplierEmails, parseEmailCsv } = require('../email');

router.get('/', async (req, res) => {
  try {
    const { supplier, from, to, paymentStatus, page = 1, limit = 50 } = req.query;
    const filter = { companyRef: req.company._id, branch: req.activeBranch || req.branch?._id };
    if (supplier) filter.supplier = supplier;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (from || to) { filter.invoiceDate = {}; if (from) filter.invoiceDate.$gte = new Date(from); if (to) filter.invoiceDate.$lte = new Date(new Date(to).setHours(23,59,59,999)); }
    const total = await PurchaseInvoice.countDocuments(filter);
    const invoices = await PurchaseInvoice.find(filter).populate('supplier', 'name company gstin dlNo').sort({ invoiceDate: -1 }).skip((page - 1) * parseInt(limit)).limit(parseInt(limit));
    res.json({ success: true, data: invoices, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const invoice = await PurchaseInvoice.findOne({ _id: req.params.id, companyRef: req.company._id }).populate('supplier', 'name company gstin dlNo phone');
    if (!invoice) return res.status(404).json({ success: false, error: 'Purchase invoice not found' });
    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', hasPermission('purchase'), upload.single('billFile'), async (req, res) => {
  try {
    const count = await PurchaseInvoice.countDocuments({ companyRef: req.company._id });
    const invNo = `PI${String(count + 1).padStart(5, '0')}`;
    const { items, supplier: supplierId } = req.body;

    const batches = await Promise.all(items.map(async (item) => {
      const medicine = await Medicine.findById(item.medicine);
      const gstRate = item.gstRate || medicine?.gstRate || 12;
      const amount = (item.qty || 0) * (item.rate || 0);
      const gstAmount = (amount * gstRate) / 100;
      return {
        medicine: item.medicine,
        medicineName: medicine?.name || item.medicineName || 'Unknown',
        batchNo: item.batchNo,
        mfgDate: item.mfgDate,
        expiryDate: item.expiryDate,
        mrp: item.mrp || 0,
        rate: item.rate || 0,
        qty: item.qty || 0,
        freeQty: item.freeQty || 0,
        schemeDisc: item.schemeDisc || 0,
        amount,
        gstAmount
      };
    }));

    const subtotal = batches.reduce((s, b) => s + b.amount, 0);
    const totalTax = batches.reduce((s, b) => s + b.gstAmount, 0);
    const totalAmount = subtotal + totalTax - (req.body.discountAmount || 0) + (req.body.freight || 0);

    const billFile = req.file ? `/uploads/${req.file.filename}` : undefined;

    const purchaseInvoice = await PurchaseInvoice.create({
      invoiceNo: req.body.invoiceNo || invNo,
      supplier: supplierId,
      purchaseOrder: req.body.purchaseOrder,
      invoiceDate: req.body.invoiceDate,
      receivedDate: req.body.receivedDate,
      billFile,
      batches,
      subtotal,
      discountAmount: req.body.discountAmount || 0,
      cgst: totalTax / 2,
      sgst: totalTax / 2,
      taxAmount: totalTax,
      freight: req.body.freight || 0,
      totalAmount,
      notes: req.body.notes,
      branch: req.activeBranch || req.branch?._id,
      companyRef: req.company._id,
      createdBy: req.user._id
    });

    for (const batch of batches) {
      if (batch.qty > 0) {
        await Batch.create({
          medicine: batch.medicine,
          batchNo: batch.batchNo,
          mfgDate: batch.mfgDate,
          expiryDate: batch.expiryDate,
          mrp: batch.mrp,
          purchaseRate: batch.rate,
          saleRate: batch.rate,
          qty: batch.qty,
          supplier: supplierId,
          branch: req.activeBranch || req.branch?._id,
          purchaseInvoice: purchaseInvoice._id,
          location: req.body.defaultLocation || ''
        });
      }
      if (batch.freeQty > 0) {
        await Batch.create({
          medicine: batch.medicine,
          batchNo: batch.batchNo + '-FREE',
          mfgDate: batch.mfgDate,
          expiryDate: batch.expiryDate,
          mrp: 0,
          purchaseRate: 0,
          saleRate: 0,
          qty: batch.freeQty,
          supplier: supplierId,
          branch: req.activeBranch || req.branch?._id,
          purchaseInvoice: purchaseInvoice._id,
          location: req.body.defaultLocation || ''
        });
      }
    }

    res.status(201).json({ success: true, data: purchaseInvoice });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', hasPermission('purchase'), async (req, res) => {
  try {
    const invoice = await PurchaseInvoice.findOneAndUpdate({ _id: req.params.id, companyRef: req.company._id }, req.body, { new: true, runValidators: true });
    if (!invoice) return res.status(404).json({ success: false, error: 'Purchase invoice not found' });
    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/parse-template', hasPermission('purchase'), uploadCsv.single('templateFile'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No template file uploaded' });
    
    const filePath = req.file.path;
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    let parsedData;
    
    if (fileExt === '.csv') {
      parsedData = parseCsvTemplate(filePath);
    } else if (fileExt === '.pdf') {
      parsedData = await parsePdfTemplate(filePath);
    } else {
      return res.status(400).json({ success: false, error: 'Unsupported file format. Use CSV or PDF.' });
    }
    
    if (!parsedData || !parsedData.items || parsedData.items.length === 0) {
      return res.status(400).json({ success: false, error: 'No invoice items found in template' });
    }
    
    // Generate invoice number
    const count = await PurchaseInvoice.countDocuments({ companyRef: req.company._id });
    const invNo = `PI${String(count + 1).padStart(5, '0')}`;
    
    // Calculate totals
    const subtotal = parsedData.items.reduce((s, item) => s + (item.amount || 0), 0);
    const totalTax = parsedData.items.reduce((s, item) => s + (item.gstAmount || 0), 0);
    const totalAmount = subtotal + totalTax - (parsedData.discount || 0) + (parsedData.freight || 0) + (parsedData.platformFees || 0) + (parsedData.codCharges || 0);
    
    // Create purchase invoice
    const purchaseInvoice = await PurchaseInvoice.create({
      invoiceNo: parsedData.invoiceNo || invNo,
      supplier: req.body.supplierId || (parsedData.supplier ? { name: parsedData.supplier } : undefined),
      purchaseOrder: req.body.purchaseOrder,
      invoiceDate: parsedData.invoiceDate || new Date(),
      receivedDate: new Date(),
      billFile: `/uploads/${req.file.filename}`,
      batches: parsedData.items.map(item => ({
        medicine: item.medicineId || '', // Would need medicine lookup
        medicineName: item.medicineName,
        batchNo: item.batchNo || '',
        mfgDate: '', // Not in template
        expiryDate: item.expiryDate || '',
        mrp: item.mrp || 0,
        rate: item.rate || 0,
        qty: item.qty || 1,
        freeQty: item.freeQty || 0,
        schemeDisc: item.schemeDisc || 0,
        amount: item.amount || 0,
        gstAmount: item.gstAmount || 0
      })),
      subtotal,
      discountAmount: parsedData.discount || 0,
      cgst: totalTax / 2,
      sgst: totalTax / 2,
      taxAmount: totalTax,
      freight: parsedData.freight || 0,
      totalAmount,
      notes: `Parsed from ${fileExt.toUpperCase()} template`,
      branch: req.activeBranch || req.branch?._id,
      companyRef: req.company._id,
      createdBy: req.user._id
    });
    
    // Clean up temp file
    try { fs.unlinkSync(filePath); } catch {}
    
    res.json({ success: true, data: purchaseInvoice, parsedData });
  } catch (error) {
    // Clean up temp file on error
    try { fs.unlinkSync(req.file?.path); } catch {}
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/parse-csv', hasPermission('purchase'), uploadCsv.single('templateFile'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No CSV file uploaded' });

    const filePath = req.file.path;
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    let parsedData;
    try {
      if (fileExt === '.csv') {
        parsedData = parseCsvTemplate(filePath);
      } else if (fileExt === '.pdf') {
        parsedData = await parsePdfTemplate(filePath);
      } else {
        return res.status(400).json({ success: false, error: 'Unsupported file format. Use CSV or PDF.' });
      }
    } finally {
      try { fs.unlinkSync(filePath); } catch {}
    }

    if (!parsedData || !parsedData.items || parsedData.items.length === 0) {
      return res.status(400).json({ success: false, error: 'No invoice items found in file. Check that the CSV is a stockist bill export (SWIL/RS format).' });
    }

    const names = parsedData.items.map(i => i.medicineName).filter(Boolean);
    const medicines = await Medicine.find({ companyRef: req.company._id, name: { $in: names } }).select('name mrp gstRate');
    const medMap = new Map(medicines.map(m => [m.name.toLowerCase(), m]));

    const items = parsedData.items.map(it => {
      const med = medMap.get((it.medicineName || '').toLowerCase());
      return {
        medicine: med?._id || '',
        medicineName: it.medicineName,
        batchNo: it.batchNo || '',
        expiryDate: it.expiryDate || '',
        mrp: it.mrp || med?.mrp || 0,
        rate: it.rate || 0,
        qty: it.qty || 0,
        freeQty: it.freeQty || 0,
        schemeDisc: it.schemeDisc || 0,
        gstRate: it.gstPercent || med?.gstRate || 12
      };
    });

    res.json({
      success: true,
      data: {
        invoiceNo: parsedData.invoiceNo,
        invoiceDate: parsedData.invoiceDate,
        freight: parsedData.freight,
        platformFees: parsedData.platformFees,
        codCharges: parsedData.codCharges,
        discount: parsedData.discount,
        subtotal: parsedData.subtotal,
        totalTax: parsedData.totalTax,
        totalAmount: parsedData.totalAmount,
        items,
        matched: items.filter(i => i.medicine).length,
        total: items.length
      }
    });
  } catch (error) {
    try { fs.unlinkSync(req.file?.path); } catch {}
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/ocr-bill', hasPermission('purchase'), upload.single('billImage'), async (req, res) => {
  try {
    if (!isGeminiConfigured()) return res.status(503).json({ success: false, error: 'AI not configured (add GEMINI_API_KEY)' });
    if (!req.file) return res.status(400).json({ success: false, error: 'Bill image required' });

    const imageBase64 = fs.readFileSync(req.file.path).toString('base64');
    const prompt = `You are reading a pharmaceutical supplier purchase bill / stockist invoice.
Extract every medicine line into strict JSON.
Return ONLY a JSON object - no markdown, no code fences, no commentary - with these keys:
invoiceNo (string or null), invoiceDate (string dd/mm/yyyy or null), discount (number or null), freight (number or null), items (array).
Each item must be: {"name":"medicine brand or generic name","pack":"pack size if present, else null","batch":"batch number or null","expiry":"expiry in MM/YY if present, else null","mrp":number or null,"rate":number or null,"qty":number or null,"free":number or null,"gst":number or null}.
Only include medicine lines, skip headers/footers/totals. If you cannot read anything, return {"items":[]}.`;

    const text = await geminiVision(imageBase64, req.file.mimetype || 'image/jpeg', prompt);
    try { fs.unlinkSync(req.file.path); } catch (e) {}

    const cleaned = text.replace(/```(?:json)?/g, '').trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    let parsed = {};
    if (start !== -1 && end > start) {
      try { parsed = JSON.parse(cleaned.slice(start, end + 1)); } catch (e) { parsed = {}; }
    }
    if (!parsed.items || !Array.isArray(parsed.items)) parsed.items = [];

    const names = parsed.items.map(i => String(i?.name || '').trim()).filter(Boolean);
    const medicines = await Medicine.find({ companyRef: req.company._id, name: { $in: names } }).select('name mrp gstRate');
    const medMap = new Map(medicines.map(m => [m.name.toLowerCase(), m]));

    const items = parsed.items.map(it => {
      const raw = String(it?.name || '').trim();
      const med = medMap.get(raw.toLowerCase());
      const rate = parseFloat(it?.rate) || 0;
      return {
        medicine: med?._id || '',
        medicineName: raw,
        batchNo: String(it?.batch || '').trim(),
        expiryDate: String(it?.expiry || '').trim(),
        mrp: parseFloat(it?.mrp) || med?.mrp || 0,
        rate,
        qty: parseInt(it?.qty) || 0,
        freeQty: parseFloat(it?.free) || 0,
        gstRate: parseFloat(it?.gst) || med?.gstRate || 12
      };
    });

    res.json({
      success: true,
      data: {
        invoiceNo: String(parsed.invoiceNo || '').trim(),
        invoiceDate: String(parsed.invoiceDate || '').trim(),
        discount: parseFloat(parsed.discount) || 0,
        freight: parseFloat(parsed.freight) || 0,
        items,
        matched: items.filter(i => i.medicine).length,
        total: items.length
      }
    });
  } catch (error) {
    try { if (req.file?.path) fs.unlinkSync(req.file.path); } catch (e) {}
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/fetch-emails', hasPermission('purchase'), async (req, res) => {
  try {
    const { email, password, host, companyId, supplierId, branchId, purchaseOrder, createdBy, freight, platformFees, codCharges } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password required' });
    }

    const result = await processPurchaseEmails({
      email,
      password,
      host,
      companyId,
      supplierId,
      branchId,
      purchaseOrder,
      createdBy,
      freight,
      platformFees,
      codCharges
    }, req.body);

    if (result.success) {
      // Optionally mark emails as read after processing
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
