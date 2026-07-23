const express = require('express');
const router = express.Router();
const SaleInvoice = require('../models/SaleInvoice');
const PurchaseInvoice = require('../models/PurchaseInvoice');
const Batch = require('../models/Batch');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');
const { getDateRange } = require('../utils/helpers');

router.get('/sales', async (req, res) => {
  try {
    const { filter, start, end, groupBy } = req.query;
    const { start: s, end: e } = getDateRange(filter, start, end);
    const baseFilter = { companyRef: req.company._id, invoiceDate: { $gte: s, $lt: e }, paymentStatus: { $ne: 'cancelled' } };
    if (req.activeBranch) baseFilter.branch = req.activeBranch;
    const group = groupBy === 'day' ? { $dateToString: { format: '%Y-%m-%d', date: '$invoiceDate' } } :
      groupBy === 'month' ? { $dateToString: { format: '%Y-%m', date: '$invoiceDate' } } : null;
    if (group) {
      const data = await SaleInvoice.aggregate([
        { $match: baseFilter },
        { $group: { _id: group, total: { $sum: '$totalAmount' }, tax: { $sum: '$taxAmount' }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]);
      return res.json({ success: true, data, period: { start: s, end: e } });
    }
    const invoices = await SaleInvoice.find(baseFilter).sort({ invoiceDate: -1 }).limit(500);
    const summary = await SaleInvoice.aggregate([
      { $match: baseFilter },
      { $group: { _id: null, totalSales: { $sum: '$totalAmount' }, totalTax: { $sum: '$taxAmount' }, count: { $sum: 1 }, avgBill: { $avg: '$totalAmount' } } }
    ]);
    res.json({ success: true, data: invoices, summary: summary[0] || { totalSales: 0, totalTax: 0, count: 0, avgBill: 0 }, period: { start: s, end: e } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/purchases', async (req, res) => {
  try {
    const { filter, start, end } = req.query;
    const { start: s, end: e } = getDateRange(filter, start, end);
    const baseFilter = { companyRef: req.company._id, invoiceDate: { $gte: s, $lt: e } };
    if (req.activeBranch) baseFilter.branch = req.activeBranch;
    const invoices = await PurchaseInvoice.find(baseFilter).populate('supplier', 'name').sort({ invoiceDate: -1 });
    const summary = await PurchaseInvoice.aggregate([
      { $match: baseFilter },
      { $group: { _id: null, totalPurchases: { $sum: '$totalAmount' }, totalTax: { $sum: '$taxAmount' }, count: { $sum: 1 } } }
    ]);
    res.json({ success: true, data: invoices, summary: summary[0] || { totalPurchases: 0, totalTax: 0, count: 0 } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/outstanding', async (req, res) => {
  try {
    const { type } = req.query;
    const baseFilter = { companyRef: req.company._id, paymentStatus: { $ne: 'paid' }, paymentStatus: { $ne: 'cancelled' } };
    if (req.activeBranch) baseFilter.branch = req.activeBranch;
    if (type === 'receivable' || !type) {
      const sales = await SaleInvoice.find({ ...baseFilter, paymentStatus: { $in: ['pending', 'partial'] } }).populate('customer', 'name phone').sort({ invoiceDate: -1 });
      const receivable = sales.map(s => ({ party: s.customer, invoiceNo: s.invoiceNo, date: s.invoiceDate, total: s.totalAmount, paid: s.paidAmount || 0, due: s.totalAmount - (s.paidAmount || 0), type: 'receivable' }));
      res.json({ success: true, data: { receivable, totalReceivable: receivable.reduce((t, r) => t + r.due, 0) } });
    } else {
      const purchases = await PurchaseInvoice.find({ ...baseFilter, paymentStatus: { $in: ['pending', 'partial'] } }).populate('supplier', 'name phone').sort({ invoiceDate: -1 });
      const payable = purchases.map(p => ({ party: p.supplier, invoiceNo: p.invoiceNo, date: p.invoiceDate, total: p.totalAmount, paid: 0, due: p.totalAmount, type: 'payable' }));
      res.json({ success: true, data: { payable, totalPayable: payable.reduce((t, p) => t + p.due, 0) } });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/profit-loss', async (req, res) => {
  try {
    const { filter, start, end } = req.query;
    const { start: s, end: e } = getDateRange(filter, start, end);
    const branchFilter = req.activeBranch ? { branch: req.activeBranch } : {};
    const salesAgg = await SaleInvoice.aggregate([
      { $match: { companyRef: req.company._id, invoiceDate: { $gte: s, $lt: e }, paymentStatus: { $ne: 'cancelled' }, ...branchFilter } },
      { $group: { _id: null, total: { $sum: '$totalAmount' }, tax: { $sum: '$taxAmount' }, count: { $sum: 1 } } }
    ]);
    const purchaseAgg = await PurchaseInvoice.aggregate([
      { $match: { companyRef: req.company._id, invoiceDate: { $gte: s, $lt: e }, ...branchFilter } },
      { $group: { _id: null, total: { $sum: '$totalAmount' }, tax: { $sum: '$taxAmount' } } }
    ]);
    const expenseAgg = await Expense.aggregate([
      { $match: { companyRef: req.company._id, expenseDate: { $gte: s, $lt: e }, ...branchFilter } },
      { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
    ]);
    const totalSales = salesAgg[0]?.total || 0;
    const totalPurchases = purchaseAgg[0]?.total || 0;
    const totalExpenses = expenseAgg[0]?.total || 0;
    const grossProfit = totalSales - totalPurchases;
    const netProfit = grossProfit - totalExpenses;
    res.json({
      success: true,
      data: {
        period: { start: s, end: e },
        totalSales,
        totalPurchases,
        totalExpenses,
        grossProfit,
        netProfit,
        salesCount: salesAgg[0]?.count || 0,
        expenseCount: expenseAgg[0]?.count || 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/daybook', async (req, res) => {
  try {
    const { date } = req.query;
    const d = date ? new Date(date) : new Date();
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const end = new Date(start.getTime() + 86400000);
    const branchFilter = req.activeBranch ? { branch: req.activeBranch } : {};
    const sales = await SaleInvoice.find({ companyRef: req.company._id, invoiceDate: { $gte: start, $lt: end }, ...branchFilter }).sort({ invoiceDate: -1 });
    const purchases = await PurchaseInvoice.find({ companyRef: req.company._id, invoiceDate: { $gte: start, $lt: end }, ...branchFilter }).sort({ invoiceDate: -1 });
    const payments = await Payment.find({ companyRef: req.company._id, paymentDate: { $gte: start, $lt: end }, ...branchFilter }).sort({ paymentDate: -1 });
    const expenses = await Expense.find({ companyRef: req.company._id, expenseDate: { $gte: start, $lt: end }, ...branchFilter }).sort({ expenseDate: -1 });
    res.json({ success: true, data: { sales, purchases, payments, expenses } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const branchFilter = req.activeBranch ? { branch: req.activeBranch } : {};
    const baseFilter = { companyRef: req.company._id, ...branchFilter };
    const todaySales = await SaleInvoice.aggregate([
      { $match: { ...baseFilter, invoiceDate: { $gte: today }, paymentStatus: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
    ]);
    const monthSales = await SaleInvoice.aggregate([
      { $match: { ...baseFilter, invoiceDate: { $gte: monthStart }, paymentStatus: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
    ]);
    const monthPurchases = await PurchaseInvoice.aggregate([
      { $match: { ...baseFilter, invoiceDate: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
    ]);
    const monthExpenses = await Expense.aggregate([
      { $match: { ...baseFilter, expenseDate: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const expiringBatches = await Batch.find({
      ...branchFilter,
      expiryDate: { $gte: new Date(), $lte: new Date(Date.now() + 30 * 86400000) },
      isExpired: false,
      qty: { $gt: 0 }
    }).populate('medicine', 'name').sort({ expiryDate: 1 }).limit(10);
    const totalCustomers = await require('../models/Customer').countDocuments({ companyRef: req.company._id, isActive: true });
    const totalMedicines = await require('../models/Medicine').countDocuments({ companyRef: req.company._id, isActive: true });
    const totalSuppliers = await require('../models/Supplier').countDocuments({ companyRef: req.company._id, isActive: true });
    const outstanding = await SaleInvoice.aggregate([
      { $match: { ...baseFilter, paymentStatus: { $in: ['pending', 'partial'] } } },
      { $group: { _id: null, total: { $sum: { $subtract: ['$totalAmount', { $ifNull: ['$paidAmount', 0] }] } } } }
    ]);
    res.json({
      success: true,
      data: {
        todaySales: todaySales[0] || { total: 0, count: 0 },
        monthSales: monthSales[0] || { total: 0, count: 0 },
        monthPurchases: monthPurchases[0] || { total: 0, count: 0 },
        monthExpenses: monthExpenses[0]?.total || 0,
        expiringBatches,
        expiringCount: expiringBatches.length,
        totalCustomers,
        totalMedicines,
        totalSuppliers,
        outstandingReceivable: outstanding[0]?.total || 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
