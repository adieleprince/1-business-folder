// email-templates/payment-verified.js
import { baseTemplate, generateOrderSummary, generateDeliveryInfo } from './base-template.js';

export const paymentVerifiedEmail = (order) => {
  const content = `
    <div class="greeting">Hello ${order.customerName},</div>
    <div class="message">
      <p>We're pleased to let you know that your payment has been <strong>successfully verified</strong>.</p>
      <p>Your order is now being prepared for shipment.</p>
      <p style="margin-top: 8px;">
        <strong>Estimated delivery:</strong><br>
        3–4 business days.
      </p>
    </div>
    ${generateOrderSummary(order)}
    ${generateDeliveryInfo()}
    <div style="text-align: center; margin-top: 8px;">
      <p style="color: #948C7F; font-size: 13px;">
        Thank you for shopping with Royal Dynasty Fragrances.
      </p>
    </div>
  `;

  return {
    subject: `Payment Confirmed • Royal Dynasty Fragrances`,
    html: baseTemplate(content, 'Payment Confirmed • Royal Dynasty Fragrances')
  };
};