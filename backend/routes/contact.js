const express = require('express');
const router = express.Router();
const transporter = require('../config/emailConfig');

// POST /api/contact/send-email
// body: { name, email, phone, message }
router.post('/send-email', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;
    if (!email || !message) return res.status(400).json({ error: 'email and message are required' });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // send to site owner
      subject: `Contact form submission from ${name || email}`,
      text: `From: ${name || 'Anonymous'} <${email}>\nPhone: ${phone || 'N/A'}\n\n${message}`,
    };

    await transporter.sendMail(mailOptions);
    return res.json({ success: true, message: 'Message sent' });
  } catch (err) {
    console.error('❌ Contact send-email failed:', err);
    return res.status(500).json({ error: err.message || 'Failed to send message' });
  }
});

module.exports = router;
