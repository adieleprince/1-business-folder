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

// Admin email for receiving copies
export const ADMIN_EMAIL = "royaldynastyfragrances@gmail.com";

// Send email function with admin copy
export const sendOrderEmail = async ({ to, subject, html, adminSubject }) => {
  const results = [];

  // Send to customer
  try {
    const customerResult = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: to,
      subject: subject,
      html: html
    });
    results.push({ type: 'customer', ...customerResult });
    console.log(`✅ Customer email sent to: ${to}`);
  } catch (error) {
    console.error(`❌ Failed to send to customer ${to}:`, error);
    results.push({ type: 'customer', error: error.message });
  }

  // Send copy to admin
  try {
    const adminResult = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: ADMIN_EMAIL,
      subject: adminSubject || `[ADMIN COPY] ${subject}`,
      html: html
    });
    results.push({ type: 'admin', ...adminResult });
    console.log(`✅ Admin copy sent to: ${ADMIN_EMAIL}`);
  } catch (error) {
    console.error(`❌ Failed to send admin copy:`, error);
    results.push({ type: 'admin', error: error.message });
  }

  return results;
};

export default resend;