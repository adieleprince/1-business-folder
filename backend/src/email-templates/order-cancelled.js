// email-templates/order-cancelled.js
import { baseTemplate, generateOrderSummary } from './base-template.js';

export const orderCancelledEmail = (order) => {
  const content = `
    <div class="greeting">Hello ${order.customerName},</div>
    <div class="message">
      <p>Unfortunately we could not verify your payment.</p>
      <p>Your order has been <strong>cancelled</strong>.</p>
      <p style="margin-top: 12px; color: #b91c1c; font-weight: 500;">
        If you believe this was a mistake, please contact us and we'll be happy to assist.
      </p>
    </div>
    ${generateOrderSummary(order)}
    <div style="text-align: center; margin-top: 8px;">
      <p style="color: #948C7F; font-size: 13px;">
        We apologise for any inconvenience this may have caused.
      </p>
    </div>
  `;

  return {
    subject: `Order Cancelled • Royal Dynasty Fragrances`,
    html: baseTemplate(content, 'Order Cancelled • Royal Dynasty Fragrances')
  };
};