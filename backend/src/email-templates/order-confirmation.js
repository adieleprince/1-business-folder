// email-templates/order-confirmation.js
import { baseTemplate, generateOrderSummary } from './base-template.js';

export const orderConfirmationEmail = (order) => {
  const content = `
    <div class="greeting">Hello ${order.customerName},</div>
    <div class="message">
      <p>Thank you for placing your order with <strong>Royal Dynasty Fragrances</strong>.</p>
      <p>Your order has been received successfully and is now being processed.</p>
      <p>We will ship your order within 3–4 business days.</p>
    </div>
    ${generateOrderSummary(order)}
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