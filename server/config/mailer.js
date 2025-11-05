// Legacy mailer config stub that provides a nodemailer-like interface
// but uses the new Resend-based mailer under the hood.
const { sendMail } = require('../utils/mailer');

// Export an object that looks like a nodemailer transporter
// but forwards to our new Resend implementation
const transporter = {
  sendMail: async function(mailOptions) {
    return sendMail(mailOptions);
  }
};

module.exports = transporter;
