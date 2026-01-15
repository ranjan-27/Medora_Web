// ...existing code...
const nodemailer = require("nodemailer");

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
  connectionTimeout: Number(process.env.SMTP_CONN_TIMEOUT || 20000),
  greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT || 20000),
  socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT || 20000),
});

// only verify in non-production so startup won't fail in production
if (process.env.NODE_ENV !== "production") {
  transporter.verify()
    .then(() => console.info("Email transporter verified"))
    .catch((err) => console.error("Email transporter verification failed:", err.message || err));
}

module.exports = transporter;
// ...existing code...