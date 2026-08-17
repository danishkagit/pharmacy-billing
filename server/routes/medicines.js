const express = require('express');
const router = express.Router();
const Medicine = require('../models/Medicine');
const { hasPermission } = require('../middleware/rbac');
const { brandCompositionMap, lookupBrand } = require('../data/brand-composition-map');

router.get('/lookup', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json({ success: true, data: null });
    const result = lookupBrand(q);
    res.json({ success: true, data: result || null });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { search, schedule, category, manufacturer, page = 1, limit = 50, isActive } = req.query;
    const filter = { company: req.company._id };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { composition: { $regex: search, $options: 'i' } },
        { manufacturer: { $regex: search, $options: 'i' } }
      ];
    }
    if (schedule) filter.schedule = schedule;
    if (category) filter.category = category;
    if (manufacturer) filter.manufacturer = { $regex: manufacturer, $options: 'i' };
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    const total = await Medicine.countDocuments(filter);
    const medicines = await Medicine.find(filter)
      .populate('preferredSupplier', 'name')
      .sort({ name: 1 })
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit));
    res.json({ success: true, data: medicines, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', hasPermission('inventory'), async (req, res) => {
  try {
    let data = { ...req.body, company: req.company._id };
    if (!data.composition && data.name) {
      const lookup = lookupBrand(data.name);
      if (lookup) {
        data.composition = lookup.composition;
        if (!data.hsn && lookup.hsn) data.hsn = lookup.hsn;
        if (!data.gstRate && lookup.gstRate) data.gstRate = lookup.gstRate;
        if (!data.schedule && lookup.schedule) data.schedule = lookup.schedule;
        if (!data.category && lookup.category) data.category = lookup.category;
        if (!data.manufacturer && lookup.manufacturer) data.manufacturer = lookup.manufacturer;
      }
    }
    const medicine = await Medicine.create(data);
    res.status(201).json({ success: true, data: medicine });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', hasPermission('inventory'), async (req, res) => {
  try {
    const medicine = await Medicine.findOneAndUpdate(
      { _id: req.params.id, company: req.company._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!medicine) return res.status(404).json({ success: false, error: 'Medicine not found' });
    res.json({ success: true, data: medicine });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:id', hasPermission('inventory'), async (req, res) => {
  try {
    const medicine = await Medicine.findOneAndUpdate(
      { _id: req.params.id, company: req.company._id },
      { isActive: false },
      { new: true }
    );
    if (!medicine) return res.status(404).json({ success: false, error: 'Medicine not found' });
    res.json({ success: true, message: 'Medicine deactivated' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Suggestion/autocomplete search with salt-aware, prefix-ranked matching.
// q: free-form query (>= 3 chars). Matches medicine name, salt/composition,
// and manufacturer. Results ranked: exact name prefix > next doses/salts.
router.get('/suggest', async (req, res) => {
  try {
    const { q } = req.query;
    const need = 3;
    if (!q || q.trim().length < need) return res.json({ success: true, data: [] });
    const query = q.trim();
    const tokens = query.split(/\s+/).filter(Boolean);
    const qEsc = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const tokenEscs = tokens.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

    // name-prefix regex (e.g. "azu" -> ^azu...)
    const namePrefix = new RegExp(`^${qEsc}`, 'i');
    // each token must match somewhere among name/composition/manufacturer
    const tokenOr = tokenEscs.map(t => new RegExp(t, 'i'));
    const filter = {
      company: req.company._id,
      isActive: true,
      $and: tokenOr.map(re => ({
        $or: [{ name: re }, { composition: re }, { manufacturer: re }]
      }))
    };

    const medicines = await Medicine.find(filter)
      .select('name composition manufacturer category schedule gstRate hsn mrp requiresPrescription')
      .limit(60);

    const score = (m) => {
      const name = (m.name || '').toLowerCase();
      const comp = (m.composition || '').toLowerCase();
      const mfr = (m.manufacturer || '').toLowerCase();
      const qq = query.toLowerCase();
      let s = 0;
      // Name is the strongest signal
      if (name.startsWith(qq)) s += 10000;
      else if (name.includes(qq)) s += 5000;
      // Composition token prefix match (salt autocomplete)
      const compTokens = comp.split(/[/+,&+\s-]+/).map(t => t.trim()).filter(Boolean);
      const qToken = tokens[0].toLowerCase();
      if (compTokens.some(t => t.toLowerCase().startsWith(qToken))) s += 4000;
      else if (comp.includes(qq)) s += 2500;
      // Manufacturer
      if (mfr.startsWith(qToken)) s += 1500;
      else if (mfr.includes(qq)) s += 800;
      // Shorter composition = more specific salt, boost a bit
      s += Math.max(0, 200 - comp.length);
      return s;
    };

    const ranked = medicines
      .map(m => ({ m, s: score(m) }))
      .filter(x => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 30)
      .map(x => x.m);

    res.json({ success: true, data: ranked, query, core: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/batch/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ success: true, data: [] });
    const medicines = await Medicine.find({
      company: req.company._id,
      isActive: true,
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { composition: { $regex: q, $options: 'i' } },
        { manufacturer: { $regex: q, $options: 'i' } }
      ]
    }).select('name composition manufacturer schedule hsn gstRate mrp requiresPrescription').limit(20);
    res.json({ success: true, data: medicines });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const medicine = await Medicine.findOne({ _id: req.params.id, company: req.company._id }).populate('preferredSupplier', 'name');
    if (!medicine) return res.status(404).json({ success: false, error: 'Medicine not found' });
    res.json({ success: true, data: medicine });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
