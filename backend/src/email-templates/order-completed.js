// email-templates/order-completed.js
import { baseTemplate, generateOrderSummary } from './base-template.js';

export const orderCompletedEmail = (order) => {
  const content = `
    <div class="greeting">Hello ${order.customerName},</div>
    <div class="message">
      <p>Your order has been marked as <strong>completed</strong>.</p>
      <p>Thank you for choosing Royal Dynasty Fragrances.</p>
      <p>We hope you enjoyed your experience and look forward to serving you again.</p>
      <p style="margin-top: 12px; color: #C49A6C; font-weight: 600;">
        We value your trust in us.
      </p>
    </div>
    ${generateOrderSummary(order)}
    <div style="text-align: center; margin-top: 8px;">
      <p style="color: #948C7F; font-size: 13px;">
        We'd love to hear about your experience!
      </p>
    </div>
  `;

  return {
    subject: `Order Completed • Thank You • Royal Dynasty Fragrances`,
    html: baseTemplate(content, 'Order Completed • Thank You • Royal Dynasty Fragrances')
  };
};