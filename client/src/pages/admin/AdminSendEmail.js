import React, { useState } from 'react';
import { sendAdminEmail } from '../../services/adminAPI';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const AdminSendEmail = () => {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [html, setHtml] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('Welcome Email');
  const [richMessage, setRichMessage] = useState('');

  // Professional email wrapper with LuxYield branding
  const emailWrapper = (content) => `<div style="font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width:600px; margin:auto; padding:0; background:#0a0a0a;"><div style="background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); padding:40px 24px; text-align:center;"><img src="https://www.luxyield.com/logo192.png" alt="LuxYield" style="width:80px; height:80px; margin-bottom:16px;" /><h1 style="color:#000; margin:0; font-size:28px; font-weight:700; letter-spacing:1px;">LuxYield</h1><p style="color:#333; margin:8px 0 0 0; font-size:13px; font-weight:600; text-transform:uppercase; letter-spacing:1px;">Premium Investment Solutions</p></div><div style="padding:40px 32px; background:#1a1a1a; color:#e0e0e0; line-height:1.6;">${content}</div><div style="background:#0f0f0f; padding:24px 32px; text-align:center; border-top:1px solid #333;"><p style="margin:0 0 12px 0; font-size:12px; color:#808080;">© 2026 LuxYield. All rights reserved.</p><p style="margin:0; font-size:11px; color:#606060;">This is an official communication from LuxYield.</p></div></div>`;

  const templates = [
    {
      label: 'Welcome Email',
      subject: 'Welcome to LuxYield – Your Premium Investment Platform',
      html: emailWrapper(`<h2 style="color:#FFD700; margin:0 0 16px 0; font-size:22px; font-weight:700;">Welcome to LuxYield</h2><p style="margin:0 0 16px 0; font-size:14px; color:#b0b0b0;">Thank you for joining our premium investment community. We're excited to have you on board.</p><p style="margin:0 0 24px 0; font-size:14px; color:#b0b0b0;">Explore carefully curated investment opportunities, manage your portfolio with ease, and grow your wealth with confidence.</p><div style="background:#2a2a2a; border-left:4px solid #FFD700; padding:16px; margin:24px 0; border-radius:4px;"><p style="margin:0; font-size:13px; color:#FFD700; font-weight:600;">Get Started:</p><p style="margin:8px 0 0 0; font-size:13px; color:#b0b0b0;">Log in to your account and explore our investment options.</p></div>`)
    },
    {
      label: 'KYC Approved',
      subject: 'KYC Verification Complete – Your Account is Fully Activated',
      html: emailWrapper(`<h2 style="color:#FFD700; margin:0 0 16px 0; font-size:22px; font-weight:700;">✓ KYC Verification Approved</h2><p style="margin:0 0 16px 0; font-size:14px; color:#b0b0b0;">Excellent news! Your KYC (Know Your Customer) verification has been successfully completed and approved.</p><p style="margin:0 0 24px 0; font-size:14px; color:#b0b0b0;">Your account is now fully activated with unrestricted access to all LuxYield features and investment opportunities.</p><div style="background:#2a2a2a; border-left:4px solid #FFD700; padding:16px; margin:24px 0; border-radius:4px;"><p style="margin:0; font-size:13px; color:#FFD700; font-weight:600;">What's Next:</p><p style="margin:8px 0 0 0; font-size:13px; color:#b0b0b0;">Browse investment plans, make deposits, and start building your portfolio today.</p></div>`)
    },
    {
      label: 'Investment Confirmation',
      subject: 'Investment Confirmed – Thank You for Investing with LuxYield',
      html: emailWrapper(`<h2 style="color:#FFD700; margin:0 0 16px 0; font-size:22px; font-weight:700;">✓ Investment Confirmed</h2><p style="margin:0 0 16px 0; font-size:14px; color:#b0b0b0;">Your investment has been successfully processed and is now active in your portfolio.</p><p style="margin:0 0 24px 0; font-size:14px; color:#b0b0b0;">Monitor your investment growth in real-time through your LuxYield dashboard. Our team is committed to maximizing your returns.</p><div style="background:#2a2a2a; border-left:4px solid #FFD700; padding:16px; margin:24px 0; border-radius:4px;"><p style="margin:0; font-size:13px; color:#FFD700; font-weight:600;">Next Steps:</p><p style="margin:8px 0 0 0; font-size:13px; color:#b0b0b0;">Track your portfolio performance and earnings in real-time through your account dashboard.</p></div>`)
    },
    {
      label: 'Withdrawal Processed',
      subject: 'Withdrawal Processed – Funds Transferred Successfully',
      html: emailWrapper(`<h2 style="color:#FFD700; margin:0 0 16px 0; font-size:22px; font-weight:700;">✓ Withdrawal Processed</h2><p style="margin:0 0 16px 0; font-size:14px; color:#b0b0b0;">Your withdrawal request has been approved and processed successfully.</p><p style="margin:0 0 24px 0; font-size:14px; color:#b0b0b0;">Funds have been transferred to your registered wallet. Please allow 1-3 business days for the funds to appear in your account.</p><div style="background:#2a2a2a; border-left:4px solid #FFD700; padding:16px; margin:24px 0; border-radius:4px;"><p style="margin:0; font-size:13px; color:#FFD700; font-weight:600;">Transaction Details:</p><p style="margin:8px 0 0 0; font-size:13px; color:#b0b0b0;">Check your account dashboard for full transaction details and wallet address confirmation.</p></div>`)
    },
    {
      label: 'Custom',
      subject: '',
      html: ''
    }
  ];

  const handleSend = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    let finalHtml = html;
    if (selectedTemplate === 'Custom' && richMessage) {
      finalHtml = emailWrapper(`<div style="font-size:15px; color:#b0b0b0; margin:0;">${richMessage}</div>`);
    }
    try {
      await sendAdminEmail({ to, subject, html: finalHtml });
      setMessage('✅ Email sent successfully!');
      setTo(''); setSubject(''); setHtml(''); setRichMessage('');
    } catch (err) {
      setMessage('❌ Failed to send email: ' + err);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateChange = (e) => {
    const template = templates.find(t => t.label === e.target.value);
    setSelectedTemplate(template.label);
    setSubject(template.subject);
    setHtml(template.html);
  };

  return (
    <div className="glassmorphic p-2 sm:p-6 md:p-8 rounded-xl max-w-full sm:max-w-lg mx-auto mt-4 sm:mt-12 overflow-x-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Send Email to User</h2>
      <form onSubmit={handleSend} className="space-y-4">
        <div>
          <label className="block mb-1">To (User Email)</label>
          <input type="email" className="w-full p-2 rounded bg-dark border border-gray-700" value={to} onChange={e => setTo(e.target.value)} required />
        </div>
        <div>
          <label className="block mb-1">Subject</label>
          <input type="text" className="w-full p-2 rounded bg-dark border border-gray-700" value={subject} onChange={e => setSubject(e.target.value)} required />
        </div>
        <div>
          <label className="block mb-1">Template</label>
          <select className="w-full p-2 rounded bg-dark border border-gray-700" value={selectedTemplate} onChange={handleTemplateChange}>
            {templates.map(t => <option key={t.label} value={t.label}>{t.label}</option>)}
          </select>
        </div>
        {selectedTemplate === 'Custom' && (
          <div>
            <label className="block mb-1">Rich Message</label>
            <ReactQuill theme="snow" value={richMessage} onChange={setRichMessage} className="bg-dark text-white" />
          </div>
        )}
        {selectedTemplate !== 'Custom' && (
          <div>
            <label className="block mb-1">HTML Message</label>
            <textarea className="w-full p-2 rounded bg-dark border border-gray-700 min-h-[120px]" value={html} onChange={e => setHtml(e.target.value)} required />
          </div>
        )}
        <button type="submit" className="w-full py-3 rounded-lg font-bold bg-gold text-black hover:bg-yellow-600 transition" disabled={loading}>
          {loading ? 'Sending...' : 'Send Email'}
        </button>
        {message && <div className="text-center mt-2">{message}</div>}
      </form>
    </div>
  );
};

export default AdminSendEmail;
