import dotenv from "dotenv";
import nodemailer from "nodemailer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../../.env")
});

console.log(
  "GMAIL CREDENTIALS:",
  process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD ? "LOADED ✅" : "MISSING ❌"
);

// Gmail SMTP requires 2-Step Verification to be enabled on the account,
// then an "App Password" generated at myaccount.google.com/apppasswords
// (NOT your normal Gmail password). Unlike Resend's sandbox sender, this
// has no domain-verification requirement — it can deliver to any real
// customer address right away. Gmail does cap a standard account at
// roughly 500 emails/day; revisit this if you outgrow that.
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

// Gmail requires the "from" address to be the authenticated account
// itself (or a verified alias of it) — you can still set a display name
// via EMAIL_FROM, but the email portion must match GMAIL_USER.
const EMAIL_FROM = process.env.EMAIL_FROM || process.env.GMAIL_USER;

if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
  console.warn(
    "⚠️  GMAIL_USER / GMAIL_APP_PASSWORD are not both set — emails will fail to send. " +
    "Generate an App Password at myaccount.google.com/apppasswords and set both in .env."
  );
}

// Admin email for receiving copies
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "royaldynastyfragrances@gmail.com";

// =========================================
// SEND A SINGLE EMAIL (no admin copy)
// Used for anything that isn't an order notification — e.g. subscriber
// broadcasts, where cc'ing the admin on every single recipient send
// would flood their inbox.
// =========================================
export const sendEmail = async ({ to, subject, html }) => {
  try {
    const result = await transporter.sendMail({
      from: EMAIL_FROM,
      to,
      subject,
      html
    });
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

// =========================================
// SEND ORDER EMAIL (customer + admin copy)
// =========================================
export const sendOrderEmail = async ({ to, subject, html, adminSubject }) => {
  const results = [];

  // Send to customer
  try {
    const customerResult = await transporter.sendMail({
      from: EMAIL_FROM,
      to: to,
      subject: subject,
      html: html
    });
    results.push({ type: 'customer', success: true, messageId: customerResult.messageId });
    console.log(`✅ Customer email sent to: ${to}`);
  } catch (error) {
    console.error(`❌ Failed to send to customer ${to}:`, error.message);
    results.push({ type: 'customer', success: false, error: error.message });
  }

  // Send copy to admin
  try {
    const adminResult = await transporter.sendMail({
      from: EMAIL_FROM,
      to: ADMIN_EMAIL,
      subject: adminSubject || `[ADMIN COPY] ${subject}`,
      html: html
    });
    results.push({ type: 'admin', success: true, messageId: adminResult.messageId });
    console.log(`✅ Admin copy sent to: ${ADMIN_EMAIL}`);
  } catch (error) {
    console.error(`❌ Failed to send admin copy:`, error.message);
    results.push({ type: 'admin', success: false, error: error.message });
  }

  return results;
};

export default transporter;