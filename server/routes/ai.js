const express = require('express');
const router = express.Router();
const fs = require('fs');
const Medicine = require('../models/Medicine');
const { isGeminiConfigured, geminiText, geminiVision } = require('../utils/gemini');
const upload = require('../middleware/upload');

const OCR_PROMPT = `You are a pharmacy assistant reading a handwritten or printed prescription.
Extract every medicine line into strict JSON.
Return ONLY a JSON array — no markdown, no code fences, no commentary.
Each object must be: {"name": "medicine brand or generic name", "dose": "dosage if present, else null", "frequency": "e.g. 1-0-1 or Once daily", "durationDays": number or null, "qty": estimated quantity as number or null, "instructions": "short note or null"}.
If you cannot read anything, return [].`;

router.get('/status', (req, res) => {
  res.json({ success: true, data: { enabled: isGeminiConfigured() } });
});

router.post('/ocr-prescription', upload.single('image'), async (req, res) => {
  try {
    if (!isGeminiConfigured()) return res.status(503).json({ success: false, error: 'AI not configured (add GEMINI_API_KEY)' });
    if (!req.file) return res.status(400).json({ success: false, error: 'Prescription image required' });

    const imageBase64 = fs.readFileSync(req.file.path).toString('base64');
    const text = await geminiVision(imageBase64, req.file.mimetype, OCR_PROMPT);
    fs.unlink(req.file.path, () => {});

    const cleaned = text.replace(/```(?:json)?/g, '').trim();
    const start = cleaned.indexOf('[');
    const end = cleaned.lastIndexOf(']');
    let parsed = [];
    if (start !== -1 && end > start) {
      try { parsed = JSON.parse(cleaned.slice(start, end + 1)); } catch (e) { parsed = []; }
    }
    if (!Array.isArray(parsed)) parsed = [];

    const items = await Promise.all(parsed.map(async (entry) => {
      const raw = String(entry?.name || '').trim();
      let matched = null;
      if (raw) {
        const esc = raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const med = await Medicine.findOne({
          company: req.company._id,
          isActive: { $ne: false },
          $or: [
            { name: { $regex: new RegExp(`^${esc}$`, 'i') } },
            { name: { $regex: new RegExp(esc, 'i') } }
          ]
        }).sort({ name: 1 });
        if (med) matched = { _id: med._id, name: med.name, gstRate: med.gstRate, mrp: med.mrp, schedule: med.schedule };
      }
      return {
        name: raw,
        dose: entry?.dose || null,
        frequency: entry?.frequency || null,
        durationDays: entry?.durationDays || null,
        qty: parseInt(entry?.qty) > 0 ? parseInt(entry.qty) : null,
        instructions: entry?.instructions || null,
        matched
      };
    }));

    res.json({ success: true, data: { items, rawText: text.slice(0, 2000) } });
  } catch (error) {
    try { if (req.file?.path) fs.unlink(req.file.path, () => {}); } catch (e) {}
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/assistant', async (req, res) => {
  try {
    if (!isGeminiConfigured()) return res.status(503).json({ success: false, error: 'AI not configured (add GEMINI_API_KEY)' });
    const { message } = req.body;
    if (!message || !String(message).trim()) return res.status(400).json({ success: false, error: 'Message required' });
    const company = req.company;
    const prompt = `You are "PharmaGPT", a concise AI assistant inside a pharmacy billing & inventory system for "${company?.name || 'a pharmacy'}".
Help a pharmacist or store owner with: GST billing rules, inventory/expiry, drug information (schedules, salts), compliance, and day-to-day operations.
Answer in short, practical paragraphs. If asked anything medical/clinical, answer briefly and append: "Please verify with a licensed pharmacist."`;
    const reply = await geminiText(`${prompt}\n\nUser question: ${message}`, { temperature: 0.5 });
    res.json({ success: true, data: { reply } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;