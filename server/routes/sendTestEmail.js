const express = require('express');
const router = express.Router();
const { sendMail } = require('../utils/mailer');

router.post('/api/send-test', async (req, res) => {
  const { to } = req.body;
  try {
    const info = await sendMail({
      to: to || 'your@email.com',
      subject: '✅ LUXYIELD Email Test',
      html: '<h2>This is a test email from LuxYield (via Resend API)</h2>'
    });
    res.json({ message: 'Email sent ✅', info });
  } catch (err) {
    console.error('Email error:', err);
    res.status(500).json({ message: 'Failed to send email ❌', error: err.message });
  }
});

module.exports = router;
