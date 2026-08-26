import Subscriber from "../models/subscriber.model.js";
import { sendEmail } from "../config/email.js";
import { newProductEmail, restockEmail } from "../email-templates/index.js";

/**
 * Emails every newsletter subscriber about a new or restocked product.
 * Each subscriber is emailed individually (never CC'd/BCC'd together),
 * so no subscriber ever sees another subscriber's address.
 *
 * This never throws — a notification failure must never affect the
 * product save that triggered it. Call this AFTER responding to the
 * admin's request, not before, so a slow or failing email run can never
 * delay or break the product create/update itself.
 */
export async function notifySubscribers(product, type) {
  try {
    const subscribers = await Subscriber.find({}, "email").lean();
    if (subscribers.length === 0) return;

    const emailContent = type === "restock" ? restockEmail(product) : newProductEmail(product);

    const results = await Promise.allSettled(
      subscribers.map((sub) =>
        sendEmail({
          to: sub.email,
          subject: emailContent.subject,
          html: emailContent.html
        })
      )
    );

    const failed = results.filter(
      (r) => r.status === "rejected" || r.value?.success === false
    ).length;

    console.log(
      `📣 ${type === "restock" ? "Restock" : "New product"} notification for "${product.name}": ` +
      `${subscribers.length - failed}/${subscribers.length} sent successfully.`
    );
  } catch (error) {
    console.error("SUBSCRIBER NOTIFICATION ERROR:", error);
    // Swallow the error — notifications are never allowed to affect the
    // product operation that triggered them.
  }
}