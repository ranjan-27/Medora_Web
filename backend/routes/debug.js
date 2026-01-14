const express = require('express');
const router = express.Router();
const { sendMedicineReminder } = require('../utils/emailHelper');
const transporter = require('../config/emailConfig');

// POST /api/debug/send-email
// body: { email, medicineName, time, label }
router.post('/send-email', async (req, res) => {
  try {
    const { email, medicineName = 'Test Medicine', time = '12:00', label = 'Added' } = req.body;
    if (!email) return res.status(400).json({ error: 'email is required' });

    console.log('🔧 Debug send email to:', email, medicineName, time, label);
    await sendMedicineReminder(email, medicineName, time, label);
    return res.json({ success: true, message: 'Test email triggered' });
  } catch (err) {
    console.error('❌ Debug send-email failed:', err);
    return res.status(500).json({ error: err.message || 'Failed to send test email' });
  }
});

// POST /api/debug/send-email-full
// Runs sendMedicineReminder and returns detailed per-recipient results
router.post('/send-email-full', async (req, res) => {
  try {
    const { email, medicineName = 'Test Medicine', time = '12:00', label = 'Added' } = req.body;
    if (!email) return res.status(400).json({ error: 'email is required' });

    console.log('🔧 Debug send-email-full to:', email, medicineName, time, label);
    try {
      await sendMedicineReminder(email, medicineName, time, label);
      return res.json({ success: true, results: [{ email, status: 'sent' }] });
    } catch (err) {
      console.error('❌ sendMedicineReminder error:', err);
      return res.status(500).json({ success: false, error: err.message, details: err.details || null });
    }
  } catch (err) {
    console.error('❌ Debug send-email-full failed:', err);
    return res.status(500).json({ error: err.message || 'Failed' });
  }
});

// GET /api/debug/mailer-status
// Returns transporter readiness and env info (redacts password)
router.get('/mailer-status', async (req, res) => {
  try {
    const info = {
      EMAIL_USER: process.env.EMAIL_USER || null,
      EMAIL_PASS_SET: !!process.env.EMAIL_PASS,
    };

    // Re-verify transporter connection
    transporter.verify((error, success) => {
      if (error) {
        console.error('❌ Transporter verify failed:', error);
        return res.json({ ok: false, info, error: error.message || error });
      }
      return res.json({ ok: true, info });
    });
  } catch (err) {
    console.error('❌ mailer-status failed:', err);
    return res.status(500).json({ error: err.message || 'Failed' });
  }
});

module.exports = router;
