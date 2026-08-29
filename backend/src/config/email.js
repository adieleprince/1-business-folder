import dotenv from "dotenv";
import nodemailer from "nodemailer";
import path from "path";
import dns from "dns";
import tls from "tls";
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
const GMAIL_SMTP_HOST = "smtp.gmail.com";
const GMAIL_SMTP_PORT = 465;
const DNS_LOOKUP_TIMEOUT_MS = 8000;
const TLS_CONNECT_TIMEOUT_MS = 10000;

// Render's containers can report an IPv6 network interface as "available"
// even though outbound IPv6 traffic isn't actually routable to the public
// internet. Nodemailer's built-in resolver looks up both the A (IPv4) and
// AAAA (IPv6) records for smtp.gmail.com and picks randomly between them,
// so it can intermittently try the unreachable IPv6 address and hang.
//
// dns.lookup() (unlike dns.resolve4()) resolves through the OS's normal
// getaddrinfo path rather than sending a raw DNS query itself, which is
// what's reliably available on platforms like Render. Passing
// { family: 4 } makes it return only an IPv4 address. Both this lookup and
// the TLS handshake below are given hard timeouts, so if anything here
// misbehaves it fails fast and visibly (in the "Failed to send" log lines)
// instead of hanging silently — and on any failure we hand control back to
// Nodemailer's own default connection logic rather than guaranteeing the
// send fails outright.
function connectGmailSocketIPv4(_options, callback) {
  let settled = false;
  const finish = (err, result) => {
    if (settled) return;
    settled = true;
    callback(err, result);
  };

  const dnsTimer = setTimeout(() => {
    console.error("GMAIL SMTP: IPv4 DNS lookup timed out — falling back to default connection.");
    finish(null, false); // false = let Nodemailer connect normally instead
  }, DNS_LOOKUP_TIMEOUT_MS);

  dns.lookup(GMAIL_SMTP_HOST, { family: 4 }, (lookupErr, address) => {
    clearTimeout(dnsTimer);
    if (settled) return;

    if (lookupErr || !address) {
      console.error(
        "GMAIL SMTP: IPv4 DNS lookup failed — falling back to default connection.",
        lookupErr ? lookupErr.message : "no address returned"
      );
      return finish(null, false);
    }

    let socket;
    const tlsTimer = setTimeout(() => {
      console.error("GMAIL SMTP: TLS connection to Gmail (IPv4) timed out.");
      if (socket) socket.destroy();
      finish(new Error("Timed out connecting to Gmail SMTP over IPv4"));
    }, TLS_CONNECT_TIMEOUT_MS);

    try {
      socket = tls.connect(
        {
          host: address,
          port: GMAIL_SMTP_PORT,
          servername: GMAIL_SMTP_HOST
        },
        () => {
          clearTimeout(tlsTimer);
          finish(null, { connection: socket, secured: true });
        }
      );
    } catch (connectError) {
      clearTimeout(tlsTimer);
      return finish(connectError);
    }

    socket.once("error", (socketError) => {
      clearTimeout(tlsTimer);
      finish(socketError);
    });
  });
}

const transporter = nodemailer.createTransport({
  host: GMAIL_SMTP_HOST,
  port: GMAIL_SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  },
  getSocket: connectGmailSocketIPv4,
  // Fail fast instead of hanging for Nodemailer's ~2 minute defaults if a
  // connection somehow still can't be established.
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 20000
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