// server/utils/mailer.js
// Resend-based mailer with small retry and timeout wrapper.
const axios = require('axios');

const RESEND_API_KEY = process.env.RESEND_API_KEY;
if (!RESEND_API_KEY) {
  const msg = 'RESEND_API_KEY is not set in environment. Email sending disabled.';
  if (process.env.NODE_ENV === 'production') {
    // Fail fast in production so ops notice misconfiguration early
    throw new Error(msg);
  } else {
    console.warn(msg);
  }
}

// Helper: simple sleep
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

async function _sendWithResendApi({ from, to, subject, html, text, timeoutMs = 8000 }) {
  const url = 'https://api.resend.com/emails';
  const payload = {
    from,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
    text,
  };
  try {
    const resp = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: timeoutMs
    });
    return resp.data;
  } catch (err) {
    throw err;
  }
}

// Public sendMail with retries and exponential backoff
async function sendMail({ to, subject, text, html }) {
  const from = process.env.EMAIL_FROM || 'noreply@luxyield.com';
  console.log('[MAILER] Sending email (to=%s subject=%s)', to, subject);

  if (!RESEND_API_KEY) {
    console.warn('[MAILER] Resend not configured; skipping send');
    return null;
  }

  const maxAttempts = 3;
  let attempt = 0;
  let lastErr;
  while (attempt < maxAttempts) {
    try {
      attempt += 1;
      const res = await _sendWithResendApi({ from, to, subject, html, text, timeoutMs: 8000 });
      console.log('[MAILER] Email sent (attempt=%d):', attempt, res);
      return res;
    } catch (err) {
      lastErr = err;
      console.warn('[MAILER] Send attempt %d failed: %s', attempt, err.message || err);
      if (attempt >= maxAttempts) break;
      const backoff = 200 * Math.pow(2, attempt); // exponential backoff
      await sleep(backoff);
    }
  }
  console.error('[MAILER] All send attempts failed:', lastErr);
  throw lastErr;
}

module.exports = { sendMail };
