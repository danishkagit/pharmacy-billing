const express = require('express');
const router = express.Router();
const SaleInvoice = require('../models/SaleInvoice');
const Batch = require('../models/Batch');
const Customer = require('../models/Customer');
const DrugScheduleLog = require('../models/DrugScheduleLog');
const NarcoticsRegister = require('../models/NarcoticsRegister');
const { hasPermission } = require('../middleware/rbac');
const { calculateGST, roundOff } = require('../utils/helpers');
const { sendSMS, sendWhatsApp } = require('../utils/sms');

router.get('/', async (req, res) => {
  try {
    const { customer, type, from, to, paymentStatus, paymentMode, page = 1, limit = 50 } = req.query;
    const filter = { companyRef: req.company._id, branch: req.activeBranch || req.branch?._id };
    if (customer) filter.customer = customer;
    if (type) filter.type = type;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (paymentMode) filter.paymentMode = paymentMode;
    if (from || to) { filter.invoiceDate = {}; if (from) filter.invoiceDate.$gte = new Date(from); if (to) filter.invoiceDate.$lte = new Date(to); }
    const total = await SaleInvoice.countDocuments(filter);
    const invoices = await SaleInvoice.find(filter)
      .populate('customer', 'name phone')
      .populate('createdBy', 'name')
      .sort({ invoiceDate: -1 })
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit));
    const totals = await SaleInvoice.aggregate([
      { $match: filter },
      { $group: { _id: null, totalAmount: { $sum: '$totalAmount' }, totalTax: { $sum: '$taxAmount' }, count: { $sum: 1 } } }
    ]);
    res.json({
      success: true,
      data: invoices,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      summary: totals[0] || { totalAmount: 0, totalTax: 0, count: 0 }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const invoice = await SaleInvoice.findOne({ _id: req.params.id, companyRef: req.company._id })
      .populate('customer', 'name phone gstin address')
      .populate('prescription', 'prescriptionNo doctorName')
      .populate('createdBy', 'name');
    if (!invoice) return res.status(404).json({ success: false, error: 'Invoice not found' });
    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', hasPermission('billing'), async (req, res) => {
  const session = await require('mongoose').startSession();
  session.startTransaction();
  try {
    const branch = await require('../models/Branch').findById(req.activeBranch || req.branch?._id);
    if (!branch) return res.status(400).json({ success: false, error: 'Branch not found' });
    branch.invoiceCounter = (branch.invoiceCounter || 0) + 1;
    await branch.save({ session });
    const prefix = branch.invoicePrefix || 'PH';
    const counter = String(branch.invoiceCounter).padStart(5, '0');
    const invoiceNo = `${prefix}${counter}`;

    const items = [];
    let subtotal = 0, totalCgst = 0, totalSgst = 0, totalIgst = 0, totalTax = 0;
    let hasScheduleH1 = false, hasScheduleX = false;

    for (const item of req.body.items) {
      const medicine = await require('../models/Medicine').findById(item.medicine).session(session);
      if (!medicine) throw new Error(`Medicine ${item.medicine} not found`);

      const batch = await Batch.findOne({
        _id: item.batch,
        medicine: item.medicine,
        isExpired: false,
        qty: { $gte: item.qty }
      }).session(session);
      if (!batch) throw new Error(`Insufficient stock for ${medicine.name} batch ${item.batch}`);

      if (medicine.schedule === 'H' && !req.body.prescription) {
        throw new Error(`Schedule H drug ${medicine.name} requires a prescription`);
      }
      if (medicine.schedule === 'H1' && !req.body.prescription) {
        hasScheduleH1 = true;
        throw new Error(`Schedule H1 drug ${medicine.name} requires a prescription`);
      }
      if (medicine.schedule === 'X') {
        hasScheduleX = true;
        if (!req.body.prescription) throw new Error(`Schedule X drug ${medicine.name} requires a prescription`);
      }

      batch.qty -= item.qty;
      await batch.save({ session });

      const amount = (item.qty || 0) * (item.rate || 0);
      const discAmount = (amount * (item.discountPercent || 0)) / 100;
      const netAmount = amount - discAmount;
      const gst = calculateGST(netAmount, medicine.gstRate || 12, req.body.isInterState);
      const itemTax = (netAmount * (medicine.gstRate || 12)) / 100;

      subtotal += amount;
      totalCgst += gst.cgst;
      totalSgst += gst.sgst;
      totalIgst += gst.igst;
      totalTax += itemTax;

      items.push({
        medicine: item.medicine,
        medicineName: medicine.name,
        batch: batch._id,
        batchNo: batch.batchNo,
        expiryDate: batch.expiryDate,
        mrp: item.mrp || batch.mrp,
        rate: item.rate || batch.saleRate || batch.purchaseRate,
        qty: item.qty,
        gstRate: medicine.gstRate || 12,
        gstAmount: itemTax,
        amount: netAmount,
        discount: discAmount,
        discountPercent: item.discountPercent || 0,
        schedule: medicine.schedule
      });
    }

    const roundOffVal = roundOff(subtotal + totalTax - Math.round(subtotal + totalTax));

    const invoice = await SaleInvoice.create([{
      invoiceNo,
      type: req.body.type || 'retail',
      customer: req.body.customer,
      customerName: req.body.customerName,
      customerPhone: req.body.customerPhone,
      customerGstin: req.body.customerGstin,
      prescription: req.body.prescription,
      prescriptionNo: req.body.prescriptionNo,
      doctorName: req.body.doctorName,
      patientName: req.body.patientName,
      invoiceDate: req.body.invoiceDate || new Date(),
      dueDate: req.body.dueDate,
      items,
      subtotal,
      discountAmount: req.body.discountAmount || 0,
      cgst: totalCgst,
      sgst: totalSgst,
      igst: totalIgst,
      taxAmount: totalTax,
      roundOff: roundOffVal,
      totalAmount: Math.round(subtotal + totalTax) - (req.body.discountAmount || 0),
      paymentMode: req.body.paymentMode || 'cash',
      paymentStatus: req.body.paymentStatus || (req.body.paymentMode === 'credit' ? 'pending' : 'paid'),
      paidAmount: req.body.paidAmount || 0,
      changeAmount: req.body.changeAmount || 0,
      isScheduleH1: hasScheduleH1,
      isScheduleX: hasScheduleX,
      isDeliveryOrder: req.body.isDeliveryOrder || false,
      deliveryAddress: req.body.deliveryAddress,
      notes: req.body.notes,
      branch: req.activeBranch || req.branch?._id,
      companyRef: req.company._id,
      createdBy: req.user._id
    }], { session });

    if (hasScheduleX && invoice[0]) {
      for (const item of items) {
        if (item.schedule === 'X') {
          await NarcoticsRegister.create([{
            date: new Date(),
            medicine: item.medicine,
            medicineName: item.medicineName,
            batch: item.batch,
            batchNo: item.batchNo,
            openingQty: 0,
            soldQty: item.qty,
            closingQty: 0,
            patientName: req.body.patientName || 'Unknown',
            doctorName: req.body.doctorName || 'Unknown',
            prescriptionNo: req.body.prescriptionNo || 'N/A',
            saleInvoice: invoice[0]._id,
            dispensedBy: req.user._id,
            branch: req.activeBranch || req.branch?._id,
            companyRef: req.company._id
          }], { session });
        }
      }
    }

    if (hasScheduleH1 || hasScheduleX) {
      const logEntries = items.filter(i => i.schedule === 'H1' || i.schedule === 'X').map(item => ({
        saleInvoice: invoice[0]._id,
        medicine: item.medicine,
        medicineName: item.medicineName,
        schedule: item.schedule,
        prescription: req.body.prescription,
        prescriptionNo: req.body.prescriptionNo,
        patientName: req.body.patientName,
        doctorName: req.body.doctorName,
        qtyDispensed: item.qty,
        dispensedBy: req.user._id,
        branch: req.activeBranch || req.branch?._id,
        companyRef: req.company._id
      }));
      await DrugScheduleLog.insertMany(logEntries, { session });
    }

    if (req.body.customer) {
      const customer = await Customer.findById(req.body.customer).session(session);
      if (customer) {
        const points = Math.floor(invoice[0].totalAmount / 100);
        customer.loyaltyPoints = (customer.loyaltyPoints || 0) + points;
        customer.totalPointsEarned = (customer.totalPointsEarned || 0) + points;
        await customer.save({ session });
        invoice[0].loyaltyPointsEarned = points;
        await invoice[0].save({ session });
      }
    }

    await session.commitTransaction();
    session.endSession();

    const populated = await SaleInvoice.findById(invoice[0]._id).populate('customer', 'name phone');

    if (req.body.notify && req.body.customerPhone) {
      const msg = `Invoice ${invoiceNo}: ₹${invoice[0].totalAmount.toFixed(2)} - ${req.company?.name || 'Pharmacy'}`;
      sendSMS(req.body.customerPhone, msg, 'invoice', invoice[0]._id, 'SaleInvoice', req.activeBranch, req.company._id, req.user._id);
    }

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const invoice = await SaleInvoice.findOneAndUpdate({ _id: req.params.id, companyRef: req.company._id }, req.body, { new: true, runValidators: true });
    if (!invoice) return res.status(404).json({ success: false, error: 'Invoice not found' });
    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id/payment', async (req, res) => {
  try {
    const { paidAmount, paymentMode, paymentStatus } = req.body;
    const invoice = await SaleInvoice.findOne({ _id: req.params.id, companyRef: req.company._id });
    if (!invoice) return res.status(404).json({ success: false, error: 'Invoice not found' });
    invoice.paidAmount = (invoice.paidAmount || 0) + (paidAmount || 0);
    invoice.paymentMode = paymentMode || invoice.paymentMode;
    invoice.paymentStatus = paymentStatus || (invoice.paidAmount >= invoice.totalAmount ? 'paid' : 'partial');
    if (invoice.paidAmount >= invoice.totalAmount) {
      invoice.paymentStatus = 'paid';
      invoice.changeAmount = invoice.paidAmount - invoice.totalAmount;
    }
    await invoice.save();
    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:id', hasPermission('billing'), async (req, res) => {
  try {
    const invoice = await SaleInvoice.findOne({ _id: req.params.id, companyRef: req.company._id });
    if (!invoice) return res.status(404).json({ success: false, error: 'Invoice not found' });
    for (const item of invoice.items) {
      if (item.batch) {
        await Batch.findByIdAndUpdate(item.batch, { $inc: { qty: item.qty } });
      }
    }
    invoice.paymentStatus = 'cancelled';
    await invoice.save();
    res.json({ success: true, message: 'Invoice cancelled and stock restored' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
