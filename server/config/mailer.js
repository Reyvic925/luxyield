// Legacy mailer config stub replaced to avoid requiring nodemailer which was removed from dependencies.
// This module now proxies to the new utils/mailer.sendMail function so older imports that expect
// a transporter with a sendMail method keep working (callers should be updated to use utils/mailer).
const { sendMail } = require('../utils/mailer');

module.exports = { sendMail };
