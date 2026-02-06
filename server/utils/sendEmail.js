const { sendMail } = require('./mailer');

const sendEmail = async (to, subject, html) => {
  try {
    // Use the centralized mailer which implements retries and timeout
    await sendMail({ to, subject, html });
    console.log('✅ Email sent to', to);
    return true;
  } catch (error) {
    console.error('❌ Email failed to', to, error?.message || error);
    return false;
  }
};

module.exports = sendEmail;
