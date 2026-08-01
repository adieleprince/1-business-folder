// email-templates/order-delivered.js
import { baseTemplate, generateOrderSummary } from './base-template.js';

export const orderDeliveredEmail = (order) => {
  const content = `
    <div class="greeting">Hello ${order.customerName},</div>
    <div class="message">
      <p>Your order has been <strong>successfully delivered</strong>.</p>
      <p>We sincerely hope you enjoy your new fragrance.</p>
      <p>Thank you for choosing Royal Dynasty Fragrances.</p>
      <p style="margin-top: 12px; color: #C49A6C; font-weight: 600;">
        We look forward to serving you again.
      </p>
    </div>
    ${generateOrderSummary(order)}
    <div style="text-align: center; margin-top: 8px;">
      <p style="color: #948C7F; font-size: 13px;">
        If you have any questions, please don't hesitate to contact us.
      </p>
    </div>
  `;

  return {
    subject: `Your Royal Dynasty Order Has Been Delivered`,
    html: baseTemplate(content, 'Your Royal Dynasty Order Has Been Delivered')
  };
};