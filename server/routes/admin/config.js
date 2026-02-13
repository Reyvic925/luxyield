const express = require('express');
const router = express.Router();
const Config = require('../../models/Config');
const authAdmin = require('../../middleware/authAdmin');

// List all config entries (admin only)
router.get('/', authAdmin, async (req, res) => {
  try {
    const docs = await Config.find({}).lean().exec();
    const map = {};
    docs.forEach(d => { map[d.key] = d.value; });
    return res.json({ success: true, config: map });
  } catch (err) {
    console.error('[ADMIN CONFIG] GET / error', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Get single key
router.get('/:key', authAdmin, async (req, res) => {
  try {
    const doc = await Config.findOne({ key: req.params.key }).lean().exec();
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    return res.json({ success: true, key: doc.key, value: doc.value });
  } catch (err) {
    console.error('[ADMIN CONFIG] GET /:key error', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Create or update config entry
router.post('/', authAdmin, async (req, res) => {
  try {
    const { key, value, description } = req.body;
    if (!key) return res.status(400).json({ success: false, message: 'Key is required' });
    const doc = await Config.findOneAndUpdate(
      { key },
      { value, description, updatedAt: new Date() },
      { upsert: true, new: true }
    ).exec();
    return res.json({ success: true, config: { key: doc.key, value: doc.value } });
  } catch (err) {
    console.error('[ADMIN CONFIG] POST / error', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
