// server/routes/admin/deposits.js
const express = require('express');
const router = express.Router();
const authAdmin = require('../../middleware/authAdmin');
const Deposit = require('../../models/Deposit');

// GET /api/admin/deposits - fetch all deposits for admin
router.get('/', authAdmin, async (req, res) => {
  const startedAt = Date.now();
  console.log('[DEPOSITS SUBROUTER] Controller started');
  try {
    const deposits = await Deposit.find({})
      .sort({ createdAt: -1 })
      .limit(500)
      .lean()
      .maxTimeMS(10000)
      .exec();
    console.log(`[DEPOSITS SUBROUTER] Database query finished in ${Date.now() - startedAt}ms (${deposits.length} records)`);
    res.json(deposits);
  } catch (err) {
    console.error(`[DEPOSITS SUBROUTER] Query failed after ${Date.now() - startedAt}ms:`, err.message);
    res.status(503).json({ error: 'Deposits are temporarily unavailable' });
  }
});

module.exports = router;
