const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
require('dotenv').config({ path: __dirname + '/.env' });

const app = express();

const defaultOrigins = [
  'http://localhost:3000',
  'https://pharmacy-billing.vercel.app',
  'https://pharmacybills.vercel.app',
];
const allowedOrigins = process.env.CLIENT_URL
  ? [...new Set([...defaultOrigins, ...process.env.CLIENT_URL.split(',').map(s => s.trim())])]
  : defaultOrigins;
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Pharmacy Billing Server Running', timestamp: new Date().toISOString() });
});

const auth = require('./middleware/auth');
const { branchFilter } = require('./middleware/branch');

app.use('/api/auth', require('./routes/auth'));
app.use('/api/company', auth, require('./routes/company'));
app.use('/api/branches', auth, branchFilter, require('./routes/branches'));
app.use('/api/medicines/import', auth, branchFilter, require('./routes/medicineImport'));
app.use('/api/medicines', auth, branchFilter, require('./routes/medicines'));
app.use('/api/batches', auth, branchFilter, require('./routes/batches'));
app.use('/api/suppliers', auth, branchFilter, require('./routes/suppliers'));
app.use('/api/customers', auth, branchFilter, require('./routes/customers'));
app.use('/api/doctors', auth, branchFilter, require('./routes/doctors'));
app.use('/api/patients', auth, branchFilter, require('./routes/patients'));
app.use('/api/prescriptions', auth, branchFilter, require('./routes/prescriptions'));
app.use('/api/purchase-orders', auth, branchFilter, require('./routes/purchaseOrders'));
app.use('/api/purchase-invoices', auth, branchFilter, require('./routes/purchaseInvoices'));
app.use('/api/sale-invoices', auth, branchFilter, require('./routes/saleInvoices'));
app.use('/api/purchase-returns', auth, branchFilter, require('./routes/purchaseReturns'));
app.use('/api/sale-returns', auth, branchFilter, require('./routes/saleReturns'));
app.use('/api/payments', auth, branchFilter, require('./routes/payments'));
app.use('/api/expenses', auth, branchFilter, require('./routes/expenses'));
app.use('/api/inventory', auth, branchFilter, require('./routes/inventory'));
app.use('/api/narcotics', auth, branchFilter, require('./routes/narcotics'));
app.use('/api/compliance', auth, branchFilter, require('./routes/compliance'));
app.use('/api/gst', auth, branchFilter, require('./routes/gst'));
app.use('/api/reports', auth, branchFilter, require('./routes/reports'));
app.use('/api/barcode', auth, require('./routes/barcode'));
app.use('/api/audit', auth, branchFilter, require('./routes/audit'));
app.use('/api/delivery', auth, branchFilter, require('./routes/delivery'));
app.use('/api/staff', auth, branchFilter, require('./routes/staff'));
app.use('/api/salesmen', auth, branchFilter, require('./routes/salesmen'));
app.use('/api/sms', auth, branchFilter, require('./routes/sms'));
app.use('/api/loyalty', auth, branchFilter, require('./routes/loyalty'));
app.use('/api/transfers', auth, branchFilter, require('./routes/transfers'));
app.use('/api/stock-adjustments', auth, branchFilter, require('./routes/stockAdjustments'));

const Batch = require('./models/Batch');
const BatchModel = Batch;
async function checkExpiryAlerts() {
  try {
    const thirtyDays = new Date();
    thirtyDays.setDate(thirtyDays.getDate() + 30);
    const sixtyDays = new Date();
    sixtyDays.setDate(sixtyDays.getDate() + 60);
    const ninetyDays = new Date();
    ninetyDays.setDate(ninetyDays.getDate() + 90);
    const expiring = await Batch.find({
      expiryDate: { $lte: ninetyDays, $gte: new Date() },
      qty: { $gt: 0 },
      isExpired: false
    }).populate('medicine', 'name').populate('branch', 'name');
    if (expiring.length > 0) {
      console.log(`[Cron] ${expiring.length} batch(es) expiring within 90 days`);
    }
    const expired = await Batch.updateMany(
      { expiryDate: { $lte: new Date() }, isExpired: false },
      { $set: { isExpired: true, status: 'expired' } }
    );
    if (expired.modifiedCount > 0) {
      console.log(`[Cron] Marked ${expired.modifiedCount} batch(es) as expired`);
    }
  } catch (err) {
    console.error('[Cron] Expiry check error:', err.message);
  }
}

cron.schedule('0 6 * * *', checkExpiryAlerts);

if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, '../client/build');
  if (fs.existsSync(buildPath)) {
    app.use(express.static(buildPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(buildPath, 'index.html'));
    });
  } else {
    app.use((req, res) => {
      res.status(404).json({ success: false, error: `Route ${req.originalUrl} not found` });
    });
  }
} else {
  app.use((req, res) => {
    res.status(404).json({ success: false, error: `Route ${req.originalUrl} not found` });
  });
}

app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ success: false, error: messages.join(', ') });
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({ success: false, error: `Duplicate value for ${field}` });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, error: 'Invalid ID format' });
  }
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected successfully');
    if (process.env.NODE_ENV !== 'production') {
      app.listen(PORT, () => {
        console.log(`Pharmacy Billing Server running on port ${PORT}`);
      });
    }
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  });

module.exports = app;
