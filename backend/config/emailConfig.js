// ...existing code...
const nodemailer = require("nodemailer");

// SMTP settings
const HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const PORT = Number(process.env.SMTP_PORT || 465);
const SECURE = (process.env.SMTP_SECURE || (PORT === 465 ? "true" : "false")) === "true";

const transporter = nodemailer.createTransport({
  host: HOST,
  port: PORT,
  secure: SECURE, // true for 465, false for 587 (STARTTLS)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Gmail App Password or provider API key
  },
  tls: { rejectUnauthorized: false },
  connectionTimeout: Number(process.env.SMTP_CONN_TIMEOUT || 30000),
  greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT || 30000),
  socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT || 30000),
});

// Brevo (Sendinblue) fallback if BREVO_API_KEY present
let useBrevo = Boolean(process.env.BREVO_API_KEY);
let brevoClient = null;
if (useBrevo) {
  const SibApiV3Sdk = require("@sendinblue/client");
  brevoClient = new SibApiV3Sdk.TransactionalEmailsApi();
  const defaultClient = SibApiV3Sdk.ApiClient.instance;
  defaultClient.authentications["api-key"].apiKey = process.env.BREVO_API_KEY;
}

// verify SMTP only in non-production
if (process.env.NODE_ENV !== "production") {
  transporter.verify()
    .then(() => console.info("SMTP transporter verified"))
    .catch((err) => console.error("SMTP verify failed:", err.message || err));
}

// override sendMail to use Brevo when configured; preserves existing transporter API
const originalSendMail = transporter.sendMail.bind(transporter);
transporter.sendMail = async function (mailOptions = {}) {
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;

  if (useBrevo) {
    // normalize recipients
    const toArray = [];
    if (Array.isArray(mailOptions.to)) {
      mailOptions.to.forEach(t => {
        if (typeof t === "string") toArray.push({ email: t });
        else if (t && t.address) toArray.push({ email: t.address, name: t.name });
        else if (t && t.email) toArray.push({ email: t.email, name: t.name });
      });
    } else if (typeof mailOptions.to === "string") {
      toArray.push({ email: mailOptions.to });
    } else if (mailOptions.to && mailOptions.to.address) {
      toArray.push({ email: mailOptions.to.address, name: mailOptions.to.name });
    }

    const sendSmtpEmail = {
      sender: { email: from },
      to: toArray,
      subject: mailOptions.subject,
      htmlContent: mailOptions.html || undefined,
      textContent: mailOptions.text || undefined,
    };

    return brevoClient.sendTransacEmail(sendSmtpEmail);
  }

  return originalSendMail({ from, ...mailOptions });
};

module.exports = transporter;
// ...existing code...