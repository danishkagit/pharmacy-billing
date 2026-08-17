const express = require('express');
const router = express.Router();

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

module.exports = router;