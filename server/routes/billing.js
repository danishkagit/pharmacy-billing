const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { hasPermission } = require('../middleware/rbac');
const BillingTransaction = require('../models/BillingTransaction');
const Company = require('../models/Company');
const uropay = require('../utils/uropay');

// Server-side price book — the client never dictates amounts.
// Yearly = landing-page display price (20% off monthly) × 12.
const PLAN_CATALOG = {
  starter: { label: 'Starter', monthly: 799, yearly: 7668 },   // ₹639/mo billed yearly
  growth: { label: 'Growth', monthly: 1299, yearly: 12468 }    // ₹1,039/mo billed yearly
};

function planAmount(plan, cycle) {
  const entry = PLAN_CATALOG[plan];
  if (!entry || !['monthly', 'yearly'].includes(cycle)) return null;
  return entry[cycle];
}

async function activatePlan(companyRef, plan, cycle) {
  const months = cycle === 'yearly' ? 12 : 1;
  const expires = new Date();
  expires.setMonth(expires.getMonth() + months);
  await Company.findByIdAndUpdate(companyRef, { plan, planExpiresAt: expires });
  return expires;
}

function sanitizePhone(raw) {
  const digits = String(raw || '').replace(/[^0-9]/g, '');
  return digits.length >= 10 ? digits.slice(-10) : '';
}

async function findCompanyTxn(id, companyRef) {
  const { isValidObjectId } = require('mongoose');
  if (isValidObjectId(id)) {
    return BillingTransaction.findOne({ _id: id, companyRef });
  }
  return BillingTransaction.findOne({ uroPayOrderId: id, companyRef });
}

// ── Create order → returns QR + UPI intent string (no redirect) ───────────
router.post('/checkout', auth, hasPermission('settings'), async (req, res) => {
  try {
    const { plan, cycle } = req.body;
    const amount = planAmount(plan, cycle);
    if (!amount) return res.status(400).json({ success: false, error: 'Invalid plan or billing cycle' });
    if (!uropay.isConfigured()) {
      return res.status(400).json({
        success: false,
        error: 'Payment gateway not configured. Set UROPAY_API_KEY and UROPAY_SECRET on the server.',
        code: 'GATEWAY_NOT_CONFIGURED'
      });
    }
    const txn = await BillingTransaction.create({
      companyRef: req.company._id,
      plan,
      cycle,
      amount,
      purpose: `CalcuttaRx ${PLAN_CATALOG[plan].label} Plan — ${cycle === 'yearly' ? 'Yearly' : 'Monthly'}`,
      buyerName: req.user.name,
      buyerEmail: req.user.email,
      buyerPhone: sanitizePhone(req.user.phone) || sanitizePhone(req.company.phone),
      createdBy: req.user._id
    });
    txn.merchantOrderId = String(txn._id);
    try {
      const order = await uropay.generateOrder({
        amountRupees: amount,
        merchantOrderId: txn.merchantOrderId,
        customerName: txn.buyerName,
        customerEmail: txn.buyerEmail,
        transactionNote: txn.purpose
      });
      txn.uroPayOrderId = order.uroPayOrderId;
      txn.upiString = order.upiString;
      txn.qrCode = order.qrCode;
      txn.providerResponse = { orderStatus: order.orderStatus, amountInRupees: order.amountInRupees };
      await txn.save();
      res.json({
        success: true,
        data: {
          txnId: String(txn._id),
          orderId: order.uroPayOrderId,
          qrCode: order.qrCode,
          upiString: order.upiString,
          amount,
          planLabel: PLAN_CATALOG[plan].label,
          cycle,
          orderStatus: order.orderStatus
        }
      });
    } catch (gwErr) {
      txn.status = 'failed';
      txn.providerResponse = { error: gwErr.message };
      await txn.save();
      throw gwErr;
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ── Customer submits the UPI Reference Number (UTR) after paying ──────────
router.post('/submit-utr', auth, async (req, res) => {
  try {
    const { transactionId, referenceNumber } = req.body;
    const ref = String(referenceNumber || '').trim();
    if (!/^[A-Za-z0-9]{6,22}$/.test(ref)) {
      return res.status(400).json({ success: false, error: 'Enter a valid UPI Reference Number (6–22 letters/digits)' });
    }
    const txn = await findCompanyTxn(transactionId, req.company._id);
    if (!txn) return res.status(404).json({ success: false, error: 'Transaction not found' });
    if (txn.status === 'completed') return res.json({ success: true, data: { status: 'completed' } });
    if (!txn.uroPayOrderId) return res.status(400).json({ success: false, error: 'Order not initialised' });

    const updated = await uropay.updateOrderWithUtr(txn.uroPayOrderId, ref);
    txn.referenceNumber = ref;
    txn.status = updated?.orderStatus === 'COMPLETED' ? 'completed'
      : updated?.orderStatus === 'REVIEW_REQUIRED' ? 'review'
        : 'utr_submitted';
    await txn.save();

    let planExpiresAt;
    if (txn.status === 'completed') {
      planExpiresAt = await activatePlan(req.company._id, txn.plan, txn.cycle);
    }
    res.json({ success: true, data: { status: txn.status, planExpiresAt } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ── Poll status while the payment sheet is open / after refresh ───────────
router.get('/status/:txnId', auth, async (req, res) => {
  try {
    const txn = await findCompanyTxn(req.params.txnId, req.company._id);
    if (!txn) return res.status(404).json({ success: false, error: 'Transaction not found' });

    if (txn.status !== 'completed' && txn.uroPayOrderId && uropay.isConfigured()) {
      const orderStatus = await uropay.getOrderStatus(txn.uroPayOrderId).catch(() => null);
      const knownForStatus = {
        created: ['CREATED', 'UPDATED', 'PENDING'],
        utr_submitted: ['UTR_SUBMITTED', 'UPDATED', 'PENDING'],
        review: ['REVIEW_REQUIRED'],
        completed: ['COMPLETED'],
        failed: ['FAILED', 'CANCELLED']
      }[txn.status] || [];
      if (orderStatus && !knownForStatus.includes(orderStatus)) {
        if (orderStatus === 'COMPLETED') {
          txn.status = 'completed';
        } else if (orderStatus === 'REVIEW_REQUIRED') {
          txn.status = 'review';
        } else if (['FAILED', 'CANCELLED'].includes(orderStatus)) {
          txn.status = 'failed';
        }
        await txn.save();
      }
    }

    let planExpiresAt;
    if (txn.status === 'completed') {
      const company = await Company.findById(req.company._id).select('planExpiresAt');
      planExpiresAt = company?.planExpiresAt;
    }
    res.json({
      success: true,
      data: {
        status: txn.status,
        plan: txn.plan,
        cycle: txn.cycle,
        amount: txn.amount,
        upiString: txn.upiString,
        qrCode: txn.qrCode,
        planExpiresAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ── Transaction history for Plan tab ──────────────────────────────────────
router.get('/transactions', auth, async (req, res) => {
  try {
    const txns = await BillingTransaction.find({ companyRef: req.company._id })
      .sort({ createdAt: -1 }).limit(20)
      .select('plan cycle amount status referenceNumber createdAt');
    res.json({ success: true, data: txns });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ── UroPay webhook (public — signed per docs; multiple events per order) ──
router.post('/webhook', async (req, res) => {
  try {
    const payload = req.body || {};
    const signature = req.headers['x-uropay-signature'];
    const macOk = uropay.verifyWebhookSignature(payload, signature);
    if (!macOk) {
      console.warn('[UroPay Webhook] Signature mismatch for', payload.uroPayOrderId || payload.merchantOrderId);
      return res.status(401).json({ received: false });
    }

    const event = payload.event || '';
    const txn = await BillingTransaction.findOne({
      $or: [
        { uroPayOrderId: payload.uroPayOrderId },
        { merchantOrderId: payload.merchantOrderId }
      ]
    });
    if (!txn) return res.json({ received: true, activated: false });

    if (event === 'companion.sms.data') {
      // Credit SMS seen by the companion app — authoritative payment signal.
      txn.providerResponse = { ...(txn.providerResponse || {}), sms: payload };
      if (txn.status !== 'completed') {
        txn.status = 'completed';
        await txn.save();
        await activatePlan(txn.companyRef, txn.plan, txn.cycle);
        console.log(`[UroPay] SMS confirmed ${txn.plan} (${txn.cycle}) for company ${txn.companyRef}`);
      }
    } else if (event === 'order.status.changed') {
      if (payload.orderStatus === 'COMPLETED' && txn.status !== 'completed') {
        // Double-check directly with UroPay before activating.
        const check = uropay.isConfigured() ? await uropay.getOrderStatus(payload.uroPayOrderId).catch(() => null) : null;
        txn.providerResponse = { ...(txn.providerResponse || {}), statusChanged: payload, verified: check };
        if (!check || check === 'COMPLETED') {
          txn.status = 'completed';
          await txn.save();
          await activatePlan(txn.companyRef, txn.plan, txn.cycle);
          console.log(`[UroPay] Order completed — activated ${txn.plan} (${txn.cycle}) for company ${txn.companyRef}`);
        }
      } else if (payload.orderStatus === 'REVIEW_REQUIRED') {
        txn.status = 'review';
        txn.providerResponse = { ...(txn.providerResponse || {}), statusChanged: payload };
        await txn.save();
      } else if (['FAILED', 'CANCELLED'].includes(payload.orderStatus)) {
        txn.status = 'failed';
        txn.providerResponse = { ...(txn.providerResponse || {}), statusChanged: payload };
        await txn.save();
      }
    } else if (event === 'order.status.utrsubmitted') {
      if (txn.status === 'created') {
        txn.status = 'utr_submitted';
        txn.referenceNumber = payload.submittedUTR || txn.referenceNumber;
        await txn.save();
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('[UroPay Webhook] Error:', error.message);
    res.json({ received: true });
  }
});

module.exports = router;
