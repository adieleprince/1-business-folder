import dotenv from "dotenv";
import { Resend } from "resend";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../../.env")
});

console.log(
  "RESEND API KEY:",
  process.env.RESEND_API_KEY ? "LOADED ✅" : "MISSING ❌"
);

const resend = new Resend(process.env.RESEND_API_KEY);

// The address emails are sent FROM. Resend's shared sandbox sender
// ("onboarding@resend.dev") can only deliver to the email address on the
// Resend account itself — it silently cannot deliver to real customers.
// This was the root cause of customer confirmation emails not arriving.
// Once a domain is verified in the Resend dashboard, set EMAIL_FROM in
// .env to an address on that domain (e.g.
// "Royal Dynasty Fragrance <orders@yourdomain.com>") to fix delivery.
// Until then this falls back to the sandbox address so local testing
// keeps working, with a clear warning that customer delivery won't work.
const EMAIL_FROM = process.env.EMAIL_FROM || "onboarding@resend.dev";

if (!process.env.EMAIL_FROM) {
  console.warn(
    "⚠️  EMAIL_FROM is not set — using Resend's sandbox sender (onboarding@resend.dev), " +
    "which can only deliver to the Resend account's own email, not real customers. " +
    "Verify a domain in Resend and set EMAIL_FROM to fix customer email delivery."
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
    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject,
      html
    });

    if (result?.error) {
      console.error(`❌ Resend rejected the email to ${to}:`, result.error);
      return { success: false, error: result.error };
    }

    return { success: true, ...result };
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error);
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
    const customerResult = await resend.emails.send({
      from: EMAIL_FROM,
      to: to,
      subject: subject,
      html: html
    });

    // The Resend SDK returns { data, error } rather than throwing on a
    // rejected send (e.g. the sandbox-sender restriction) — this was
    // previously never checked, so a failed customer delivery was logged
    // as a false "sent" success with no visibility into why it failed.
    if (customerResult?.error) {
      console.error(`❌ Resend rejected the customer email to ${to}:`, customerResult.error);
      results.push({ type: 'customer', success: false, error: customerResult.error });
    } else {
      results.push({ type: 'customer', success: true, ...customerResult });
      console.log(`✅ Customer email sent to: ${to}`);
    }
  } catch (error) {
    console.error(`❌ Failed to send to customer ${to}:`, error);
    results.push({ type: 'customer', success: false, error: error.message });
  }

  // Send copy to admin
  try {
    const adminResult = await resend.emails.send({
      from: EMAIL_FROM,
      to: ADMIN_EMAIL,
      subject: adminSubject || `[ADMIN COPY] ${subject}`,
      html: html
    });

    if (adminResult?.error) {
      console.error(`❌ Resend rejected the admin copy to ${ADMIN_EMAIL}:`, adminResult.error);
      results.push({ type: 'admin', success: false, error: adminResult.error });
    } else {
      results.push({ type: 'admin', success: true, ...adminResult });
      console.log(`✅ Admin copy sent to: ${ADMIN_EMAIL}`);
    }
  } catch (error) {
    console.error(`❌ Failed to send admin copy:`, error);
    results.push({ type: 'admin', success: false, error: error.message });
  }

  return results;
};

export default resend;