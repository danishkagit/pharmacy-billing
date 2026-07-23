const express = require('express');
const router = express.Router();
const axios = require('axios');
const cheerio = require('cheerio');
const Medicine = require('../models/Medicine');
const csv = require('fast-csv');
const { Readable } = require('stream');

router.get('/search-web', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ success: true, data: [] });

    const { data: html } = await axios.get(`https://pharmeasy.in/search/all?name=${encodeURIComponent(q)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
      timeout: 15000
    });

    const $ = cheerio.load(html);
    const results = [];

    $('a[class*="medicineUnitWrapper"]').each((i, el) => {
      const card = $(el);
      const name = card.find('h1[class*="medicineName"]').first().text().trim();
      if (!name) return;

      const manuText = card.find('div[class*="brandName"]').first().text().trim();
      const manufacturer = manuText.replace(/^By\s*/i, '').trim();

      const packSize = card.find('div[class*="measurementUnit"]').first().text().trim();
      const mrpText = card.find('span[class*="striked"]').first().text().trim();
      const mrp = parseFloat(mrpText.replace(/[^0-9.]/g, '')) || 0;

      results.push({
        name,
        manufacturer: manufacturer || '',
        composition: '',
        mrp,
        packSize: packSize || '',
        category: guessCategory(name, packSize),
        schedule: 'OTC'
      });
    });

    res.json({ success: true, data: results.slice(0, 20) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/import', async (req, res) => {
  try {
    const { medicines } = req.body;
    if (!medicines || !Array.isArray(medicines) || medicines.length === 0) {
      return res.status(400).json({ success: false, error: 'No medicines provided' });
    }

    const created = [];
    const errors = [];

    for (const med of medicines) {
      try {
        const existing = await Medicine.findOne({
          name: { $regex: `^${med.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
          company: req.company._id
        });
        if (existing) {
          errors.push({ name: med.name, error: 'Already exists' });
          continue;
        }
        const medicine = await Medicine.create({
          name: med.name,
          composition: med.composition || '',
          manufacturer: med.manufacturer || '',
          category: med.category || 'other',
          packSize: med.packSize || '',
          unit: med.unit || 'nos',
          hsn: med.hsn || '',
          gstRate: med.gstRate ?? 12,
          schedule: med.schedule || 'OTC',
          mrp: med.mrp || 0,
          reorderLevel: med.reorderLevel || 0,
          company: req.company._id
        });
        created.push(medicine);
      } catch (err) {
        errors.push({ name: med.name, error: err.message });
      }
    }

    res.json({ success: true, data: { created: created.length, errors } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/import-csv', async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ success: false, error: 'No CSV file uploaded' });
    }

    const results = [];
    const errors = [];
    const stream = Readable.from(req.files.file.data.toString());
    const csvStream = csv.parse({ headers: true, ignoreEmpty: true });

    await new Promise((resolve, reject) => {
      stream.pipe(csvStream)
        .on('data', row => results.push(row))
        .on('error', reject)
        .on('end', resolve);
    });

    const created = [];
    for (const row of results) {
      try {
        if (!row.name) continue;
        const existing = await Medicine.findOne({
          name: { $regex: `^${row.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
          company: req.company._id
        });
        if (existing) {
          errors.push({ name: row.name, error: 'Already exists' });
          continue;
        }
        const medicine = await Medicine.create({
          name: row.name,
          composition: row.composition || '',
          manufacturer: row.manufacturer || '',
          category: row.category || 'other',
          packSize: row.packSize || '',
          unit: row.unit || 'nos',
          hsn: row.hsn || '',
          gstRate: parseFloat(row.gstRate) || 12,
          schedule: row.schedule || 'OTC',
          mrp: parseFloat(row.mrp) || 0,
          reorderLevel: parseInt(row.reorderLevel) || 0,
          company: req.company._id
        });
        created.push(medicine);
      } catch (err) {
        errors.push({ name: row.name, error: err.message });
      }
    }

    res.json({ success: true, data: { imported: created.length, skipped: errors.length, errors } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

function guessCategory(name, packText) {
  const n = (name + ' ' + packText).toLowerCase();
  if (/\b(tablet|tab)\b/.test(n)) return 'tablet';
  if (/\b(capsule|caps?|cap)\b/.test(n)) return 'capsule';
  if (/\b(syrup)\b/.test(n)) return 'syrup';
  if (/\b(injection|inj)\b/.test(n)) return 'injection';
  if (/\b(ointment|cream)\b/.test(n)) return 'ointment';
  if (/\b(drop|drops)\b/.test(n)) return 'drop';
  if (/\b(inhaler)\b/.test(n)) return 'inhaler';
  if (/\b(powder)\b/.test(n)) return 'powder';
  if (/\b(lotion)\b/.test(n)) return 'lotion';
  if (/\b(sachet)\b/.test(n)) return 'sachet';
  return 'other';
}

module.exports = router;
