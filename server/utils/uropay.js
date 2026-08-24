const axios = require('axios');
const crypto = require('crypto');

// UroPay UroRelay API wrapper (https://www.uropay.me/documentation)
// Flow: generate order → customer pays via UPI QR/intent → customer shares UTR →
// PATCH order/update → companion-app SMS confirms → order COMPLETED (webhook/poll).
//
// Required env vars:
//   UROPAY_API_KEY   — from app.uropay.me dashboard → API KEYS
//   UROPAY_SECRET    — plain secret from the same section (never sent raw over the wire)
//   SERVER_PUBLIC_URL — used to build the webhook registration hint (set in UroPay dashboard)

const BASE = process.env.UROPAY_BASE_URL || 'https://api.uropay.me';
const API_KEY = process.env.UROPAY_API_KEY;
const SECRET = process.env.UROPAY_SECRET;

const isConfigured = () => Boolean(API_KEY && SECRET);

function authHeaders() {
  const hashedSecret = crypto.createHash('sha512').update(SECRET).digest('hex');
  return {
    'X-API-KEY': API_KEY,
    'Authorization': `Bearer ${hashedSecret}`,
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };
}

// amountRupees → UroPay expects paise (integer).
async function generateOrder({ amountRupees, merchantOrderId, customerName, customerEmail, transactionNote }) {
  if (!isConfigured()) throw new Error('Payment gateway not configured (UROPAY_API_KEY / UROPAY_SECRET missing)');
  const body = {
    amount: Math.round(Number(amountRupees) * 100),
    merchantOrderId,
    customerName,
    customerEmail,
    transactionNote: transactionNote || undefined
  };
  const res = await axios.post(`${BASE}/order/generate`, body, { headers: authHeaders(), timeout: 15000 });
  if (res.data?.status !== 'success' || !res.data?.data) {
    throw new Error(res.data?.message || 'UroPay did not return an order');
  }
  return res.data.data; // { uroPayOrderId, orderStatus, upiString, qrCode, amountInRupees }
}

async function updateOrderWithUtr(uroPayOrderId, referenceNumber) {
  if (!isConfigured()) throw new Error('Payment gateway not configured');
  const res = await axios.patch(`${BASE}/order/update`,
    { uroPayOrderId, referenceNumber },
    { headers: authHeaders(), timeout: 15000 });
  return res.data?.data || null; // { uroPayOrderId, orderStatus }
}

// No auth needed on this endpoint (safe to call frequently).
async function getOrderStatus(uroPayOrderId) {
  const res = await axios.get(`${BASE}/order/status/${encodeURIComponent(uroPayOrderId)}`, {
    headers: { 'Accept': 'application/json' },
    timeout: 15000
  });
  return res.data?.data?.orderStatus || null;
}

// ── Webhook signature verification ────────────────────────────────────────
// Signature = hex(HMAC-SHA256(key = sha512(secret), data = canonical JSON)).
// Key order matters and differs per event type — rebuild payload accordingly.

function buildTransactionPayload(p) {
  const FIXED_TAIL = ['uroPayOrderId', 'merchantOrderId', 'detectedAt', 'environment'];
  const fixedSet = new Set([...FIXED_TAIL, 'event']);
  const ordered = {};
  if ('event' in p) ordered.event = p.event;
  Object.keys(p).filter(k => !fixedSet.has(k)).sort((a, b) => a.localeCompare(b))
    .forEach(k => { ordered[k] = p[k]; });
  FIXED_TAIL.forEach(k => { ordered[k] = p[k] ?? null; });
  return ordered;
}

function buildOrderStatusPayload(p) {
  return {
    event: p.event,
    uroPayOrderId: p.uroPayOrderId,
    merchantOrderId: p.merchantOrderId,
    orderStatus: p.orderStatus,
    submittedUTR: p.submittedUTR ?? null,
    environment: p.environment
  };
}

function buildUtrSubmittedPayload(p) {
  return {
    event: p.event,
    uroPayOrderId: p.uroPayOrderId,
    merchantOrderId: p.merchantOrderId,
    orderStatus: p.orderStatus,
    submittedUTR: p.submittedUTR ?? null,
    amount: p.amount,
    customerName: p.customerName,
    customerEmail: p.customerEmail,
    customerVPA: p.customerVPA ?? null,
    environment: p.environment,
    utrSubmittedAt: p.utrSubmittedAt ?? null
  };
}

function verifyWebhookSignature(payload, signature) {
  if (!SECRET || !signature) return false;
  let ordered;
  if (payload.event === 'order.status.utrsubmitted') ordered = buildUtrSubmittedPayload(payload);
  else if ('orderStatus' in payload) ordered = buildOrderStatusPayload(payload);
  else ordered = buildTransactionPayload(payload);

  try {
    const hashedSecret = crypto.createHash('sha512').update(SECRET).digest('hex');
    const computed = crypto.createHmac('sha256', hashedSecret)
      .update(JSON.stringify(ordered))
      .digest('hex');
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(String(signature)));
  } catch {
    return false;
  }
}

module.exports = { isConfigured, BASE, generateOrder, updateOrderWithUtr, getOrderStatus, verifyWebhookSignature };
