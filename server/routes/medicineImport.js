const express = require('express');
const router = express.Router();
const axios = require('axios');
const cheerio = require('cheerio');
const multer = require('multer');
const Medicine = require('../models/Medicine');
const csv = require('fast-csv');
const { Readable } = require('stream');
const { lookupBrand } = require('../data/brand-composition-map');

function autoFillComposition(med) {
  if (med.composition) return med;
  const lookup = lookupBrand(med.name);
  if (lookup) {
    med.composition = med.composition || lookup.composition || '';
    med.manufacturer = med.manufacturer || lookup.manufacturer || '';
    med.category = med.category === 'other' ? (lookup.category || med.category) : med.category;
    med.hsn = med.hsn || lookup.hsn || '';
    med.gstRate = med.gstRate || lookup.gstRate || 5;
    med.schedule = med.schedule === 'OTC' ? (lookup.schedule || med.schedule) : med.schedule;
  }
  return med;
}

const csvUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (req, file, cb) => { if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) cb(null, true); else cb(new Error('Only CSV files allowed'), false); } });

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
        const filled = autoFillComposition({ ...med });
        const existing = await Medicine.findOne({
          name: { $regex: `^${filled.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
          company: req.company._id
        });
        if (existing) {
          errors.push({ name: filled.name, error: 'Already exists' });
          continue;
        }
        const medicine = await Medicine.create({
          name: filled.name,
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

router.post('/import-csv', csvUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No CSV file uploaded' });
    }

    const results = [];
    const errors = [];
    const stream = Readable.from(req.file.buffer.toString());
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
        const filled = autoFillComposition({ name: row.name, composition: row.composition, manufacturer: row.manufacturer, category: row.category, hsn: row.hsn, gstRate: parseFloat(row.gstRate), schedule: row.schedule });
        const existing = await Medicine.findOne({
          name: { $regex: `^${filled.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
          company: req.company._id
        });
        if (existing) {
          errors.push({ name: filled.name, error: 'Already exists' });
          continue;
        }
        const medicine = await Medicine.create({
          name: filled.name,
          composition: row.composition || '',
          manufacturer: row.manufacturer || '',
          category: row.category || 'other',
          packSize: row.packSize || '',
          unit: row.unit || 'nos',
          hsn: row.hsn || '',
          gstRate: parseFloat(row.gstRate) || 5,
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

const BULK_SEARCH_TERMS = [
  'paracetamol','crocin','dolo','ibuprofen','aspirin',
  'amoxicillin','azithromycin','ciprofloxacin','metronidazole','flagyl',
  'omeprazole','pantoprazole','rabeprazole','domperidone','ondansetron',
  'cetirizine','levocetirizine','fexofenadine','montelukast','deriphyllin',
  'asthalin','budecort','augmentin','calpol','gluconorm',
  'metformin','glimepiride','atorvastatin','rosuvastatin','amlodipine',
  'telmisartan','losartan','ramipril','metoprolol','clopidogrel',
  'ecospirin','thyroxine','neurobion','becosules','revital',
  'calcium','vitamin','iron','ferrous','multivitamin',
  'ceftum','taxim','ofloxacin','norfloxacin','doxycycline',
  'fluconazole','itraconazole','terbinafine','clotrimazole','ketoconazole',
  'acyclovir','albendazole','ivermectin','pregabalin','gabapentin',
  'sertraline','fluoxetine','escitalopram','amitriptyline','duloxetine',
  'alprazolam','clonazepam','diclofenac','aceclofenac','etoricoxib',
  'allopurinol','prednisolone','dexamethasone','hydroxychloroquine','sulfasalazine',
  'spasmo','drotin','meftal','nimesulide','cyclospasmonol',
  'colchicine','methotrexate','insulin','lactulose','cremaffin',
  'soframycin','betadine','neosporin','bactroban','clindamycin',
  'silverex','septilin','cystone','hajmola','pudin'
];

router.post('/bulk-scrape', async (req, res) => {
  try {
    const seen = new Set();
    const allResults = [];
    let searched = 0;
    let errors = 0;

    for (const term of BULK_SEARCH_TERMS) {
      searched++;
      try {
        const { data: html } = await axios.get(`https://pharmeasy.in/search/all?name=${encodeURIComponent(term)}`, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
          timeout: 10000
        });
        const $ = cheerio.load(html);
        $('a[class*="medicineUnitWrapper"]').each((i, el) => {
          const card = $(el);
          const name = card.find('h1[class*="medicineName"]').first().text().trim();
          if (!name || seen.has(name.toLowerCase())) return;
          seen.add(name.toLowerCase());
          const manuText = card.find('div[class*="brandName"]').first().text().trim();
          const manufacturer = manuText.replace(/^By\s*/i, '').trim();
          const packSize = card.find('div[class*="measurementUnit"]').first().text().trim();
          const mrpText = card.find('span[class*="striked"]').first().text().trim();
          const mrp = parseFloat(mrpText.replace(/[^0-9.]/g, '')) || 0;
          allResults.push({
            name, manufacturer: manufacturer || '', composition: '',
            mrp, packSize: packSize || '',
            category: guessCategory(name, packSize), schedule: 'OTC'
          });
        });
        await new Promise(r => setTimeout(r, 500));
      } catch {
        errors++;
      }
    }

    let imported = 0;
    const importErrors = [];
    const companyId = req.company._id;

    for (const med of allResults) {
      try {
        const filled = autoFillComposition(med);
        const existing = await Medicine.findOne({
          name: { $regex: `^${filled.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
          company: companyId
        });
        if (existing) continue;
        await Medicine.create({
          name: filled.name, composition: filled.composition, manufacturer: filled.manufacturer,
          category: filled.category, packSize: filled.packSize, unit: 'nos', hsn: filled.hsn,
          gstRate: filled.gstRate || 5, schedule: filled.schedule, mrp: filled.mrp, reorderLevel: 0,
          company: companyId
        });
        imported++;
      } catch (err) {
        importErrors.push({ name: med.name, error: err.message });
      }
    }

    res.json({
      success: true,
      data: {
        termsSearched: searched,
        searchErrors: errors,
        uniqueFound: allResults.length,
        imported,
        importErrors: importErrors.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/seed-indian-medicines', async (req, res) => {
  try {
    const medicines = require('../data/indian-medicines-2026.json');
    let imported = 0;
    let skipped = 0;
    const errors = [];
    const companyId = req.company._id;

    for (const med of medicines) {
      try {
        const filled = autoFillComposition({ ...med });
        const exists = await Medicine.findOne({
          name: { $regex: `^${filled.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
          company: companyId
        });
        if (exists) { skipped++; continue; }
        await Medicine.create({
          name: filled.name, composition: filled.composition || '', manufacturer: filled.manufacturer || '',
          category: filled.category || 'other', packSize: filled.packSize || '', unit: filled.unit || 'nos',
          hsn: filled.hsn || '300490', gstRate: filled.gstRate ?? 12, schedule: filled.schedule || 'OTC',
          mrp: filled.mrp || 0, reorderLevel: 0, company: companyId, isActive: true
        });
        imported++;
      } catch (err) {
        errors.push({ name: med.name, error: err.message });
      }
    }

    res.json({ success: true, data: { total: medicines.length, imported, skipped, errors: errors.length } });
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
