const express = require('express');
const router = express.Router();

const GSTIN_API_KEY = process.env.GSTIN_API_KEY;

const STATE_CODES = {
  '01': 'Jammu & Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab', '04': 'Chandigarh', '05': 'Uttarakhand',
  '06': 'Haryana', '07': 'Delhi', '08': 'Rajasthan', '09': 'Uttar Pradesh', '10': 'Bihar',
  '11': 'Sikkim', '12': 'Arunachal Pradesh', '13': 'Nagaland', '14': 'Manipur', '15': 'Mizoram',
  '16': 'Tripura', '17': 'Meghalaya', '18': 'Assam', '19': 'West Bengal', '20': 'Jharkhand',
  '21': 'Odisha', '22': 'Chhattisgarh', '23': 'Madhya Pradesh', '24': 'Gujarat', '26': 'Dadra & Nagar Haveli and Daman & Diu',
  '27': 'Maharashtra', '29': 'Karnataka', '30': 'Goa', '31': 'Lakshadweep', '32': 'Kerala',
  '33': 'Tamil Nadu', '34': 'Puducherry', '35': 'Andaman & Nicobar', '36': 'Telangana', '37': 'Andhra Pradesh'
};

function isValidGstin(gstin) {
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(String(gstin || '').toUpperCase());
}

router.get('/pincode/:pin', async (req, res) => {
  try {
    const pin = String(req.params.pin || '').replace(/\D/g, '');
    if (pin.length !== 6) return res.status(400).json({ success: false, error: 'Invalid PIN code' });
    const r = await fetch(`https://api.postalpincode.in/pincode/${pin}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8000)
    });
    if (!r.ok) return res.status(502).json({ success: false, error: 'PIN lookup service unavailable' });
    const data = await r.json();
    const first = Array.isArray(data) ? data[0] : null;
    if (first?.Status === 'Success' && Array.isArray(first.PostOffice) && first.PostOffice.length) {
      const po = first.PostOffice[0];
      return res.json({
        success: true,
        data: {
          pincode: pin,
          city: po.District || po.Name || po.Block,
          district: po.District,
          state: po.State
        }
      });
    }
    res.json({ success: true, data: null, message: 'No match found for this PIN code' });
  } catch (error) {
    res.status(502).json({ success: false, error: 'PIN lookup service unavailable' });
  }
});

router.get('/gstin/:gstin', async (req, res) => {
  try {
    const gstin = String(req.params.gstin || '').toUpperCase().trim();
    if (!isValidGstin(gstin)) return res.status(400).json({ success: false, error: 'Invalid GSTIN format' });
    if (!GSTIN_API_KEY) return res.status(503).json({ success: false, error: 'GSTIN verification not configured (add GSTIN_API_KEY)' });

    const r = await fetch(`https://gstinapi.in/v1/gstin/${gstin}`, {
      headers: { 'x-api-key': GSTIN_API_KEY, Accept: 'application/json' },
      signal: AbortSignal.timeout(10000)
    });
    if (!r.ok) {
      const errText = await r.text();
      return res.status(502).json({ success: false, error: `GSTIN lookup failed (${r.status})${errText ? `: ${errText.slice(0, 160)}` : ''}` });
    }
    const d = await r.json();
    const stateCode = String(d.state_code || '').padStart(2, '0');
    res.json({
      success: true,
      data: {
        gstin: d.gstin || gstin,
        legalName: d.legal_name || null,
        tradeName: d.trade_name || null,
        status: d.status || null,
        taxpayerType: d.taxpayer_type || null,
        state: STATE_CODES[stateCode] || d.state_jurisdiction || null,
        address: d.address || null,
        pincode: d.pincode || null,
        registrationDate: d.registration_date || null
      }
    });
  } catch (error) {
    res.status(502).json({ success: false, error: 'GSTIN lookup service unavailable' });
  }
});

module.exports = router;