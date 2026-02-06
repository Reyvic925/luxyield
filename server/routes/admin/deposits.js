// server/routes/admin/deposits.js
const express = require('express');
const router = express.Router();
const authAdmin = require('../../middleware/authAdmin');
const Deposit = require('../../models/Deposit');

// GET /api/admin/deposits - fetch all deposits for admin
router.get('/', authAdmin, async (req, res) => {
  try {
    const deposits = await Deposit.find({}).sort('-createdAt');
    res.json(deposits);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch deposits' });
  }
});

module.exports = router;
