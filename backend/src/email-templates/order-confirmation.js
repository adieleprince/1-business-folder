// email-templates/order-confirmation.js
import { baseTemplate, generateOrderSummary, generateDeliveryInfo } from './base-template.js';

export const orderConfirmationEmail = (order) => {
  // This template is used both right after a Ghana receipt is uploaded
  // (payment NOT yet verified) and right after a Paystack payment is
  // verified (payment IS confirmed). Only show the delivery-fee note once
  // payment has actually been verified.
  const isVerified = order.status === 'Paid' || order.status === 'Completed';

  const content = `
    <div class="greeting">Hello ${order.customerName},</div>
    <div class="message">
      <p>Thank you for placing your order with <strong>Royal Dynasty Fragrances</strong>.</p>
      <p>Your order has been received successfully and is now being processed.</p>
      <p>We will ship your order within 3–4 business days.</p>
    </div>
    ${generateOrderSummary(order)}
    ${isVerified ? generateDeliveryInfo() : ''}
    <div style="text-align: center; margin-top: 8px;">
      <p style="color: #948C7F; font-size: 13px;">
        A confirmation email has been sent to your email address.
      </p>
    </div>
  `;

  return {
    subject: `Order Confirmed • Royal Dynasty Fragrances`,
    html: baseTemplate(content, 'Order Confirmed • Royal Dynasty Fragrances')
  };
};