// email-templates/base-template.js
export const baseTemplate = (content, preheader = '') => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Royal Dynasty Fragrances</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Helvetica Neue', Arial, sans-serif;
      background-color: #F8F5F0;
      color: #1C1A17;
    }
    .email-wrapper {
      max-width: 600px;
      margin: 0 auto;
      background-color: #FFFDFB;
    }
    .email-header {
      background: linear-gradient(160deg, #221c16 0%, #3c3021 45%, #6d4e33 100%);
      padding: 40px 30px;
      text-align: center;
    }
    .email-header h1 {
      color: #ffffff;
      font-size: 24px;
      margin: 0;
      font-family: Georgia, serif;
    }
    .email-header p {
      color: #EFE2D0;
      font-size: 12px;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-top: 8px;
    }
    .email-body {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 20px;
      color: #1C1A17;
    }
    .message {
      font-size: 15px;
      line-height: 1.6;
      color: #5C5650;
      margin-bottom: 30px;
    }
    .order-summary {
      background: #F8F5F0;
      border-radius: 14px;
      padding: 24px;
      margin-bottom: 30px;
    }
    .order-summary h3 {
      font-family: Georgia, serif;
      font-size: 16px;
      margin-bottom: 16px;
      color: #1C1A17;
      border-bottom: 2px solid #C49A6C;
      padding-bottom: 10px;
    }
    .order-id {
      font-size: 13px;
      color: #948C7F;
      margin-bottom: 16px;
    }
    .order-id span {
      color: #1C1A17;
      font-weight: 600;
    }
    .items {
      margin-bottom: 16px;
    }
    .item-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #E7E0D5;
      font-size: 14px;
    }
    .item-row:last-child {
      border-bottom: none;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding-top: 16px;
      border-top: 2px solid #C49A6C;
      font-size: 16px;
      font-weight: 700;
    }
    .order-summary .total-row .total-amount {
      color: #9C7649;
    }
    .delivery-info {
      background: #F8F5F0;
      border-radius: 14px;
      padding: 22px 24px;
      margin: 0 0 24px;
      border: 1px solid #E7E0D5;
    }
    .delivery-info h3 {
      font-family: 'Georgia', 'Times New Roman', serif;
      color: #3A2B20;
      font-size: 16px;
      margin-bottom: 10px;
      padding-bottom: 10px;
      border-bottom: 2px solid #C49A6C;
    }
    .delivery-info p {
      color: #5C5650;
      font-size: 14px;
      line-height: 1.6;
    }
    .btn {
      display: inline-block;
      background: #C49A6C;
      color: #ffffff;
      padding: 14px 32px;
      border-radius: 999px;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
    }
    .email-footer {
      background: #1C1A17;
      padding: 30px;
      text-align: center;
    }
    .email-footer p {
      color: rgba(255,255,255,0.5);
      font-size: 12px;
      margin: 4px 0;
    }
    .email-footer a {
      color: rgba(255,255,255,0.7);
      text-decoration: none;
    }
    .social-links {
      margin-top: 16px;
    }
    .social-links a {
      display: inline-block;
      margin: 0 8px;
      color: rgba(255,255,255,0.6);
      text-decoration: none;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>
  <div class="email-wrapper">
    <div class="email-header">
      <h1>Royal Dynasty Fragrances</h1>
      <p>Luxury That Defines You</p>
    </div>
    <div class="email-body">
      ${content}
    </div>
    <div class="email-footer">
      <p>Royal Dynasty Fragrances</p>
      <p>Questions? Reach us at <a href="mailto:royaldynastyfragrances@gmail.com">royaldynastyfragrances@gmail.com</a></p>
      <div class="social-links">
        <a href="#">Instagram</a>
        <a href="#">Facebook</a>
        <a href="#">X (Twitter)</a>
      </div>
    </div>
  </div>
</body>
</html>
`;

export const generateOrderSummary = (order) => {
  // Ghana orders are always stored with currency "GHS"; Nigeria orders
  // with "NGN" (see order.model.js) — this is the real signal to use,
  // never a guess or a hardcoded default beyond the safe NGN fallback.
  const currency = order.currency === 'GHS' ? 'GHS' : 'NGN';

  const itemsHtml = (order.items || [])
    .map(
      (item) => `
      <div class="item-row">
        <span>${item.name} × ${item.quantity} — ${formatPrice(item.price * item.quantity, currency)}</span>
      </div>
    `
    )
    .join('');

  const total = (order.items || []).reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return `
    <div class="order-summary">
      <h3>Order Summary</h3>
      <div class="order-id">Order ID: <span>${order._id || order.orderId || 'N/A'}</span></div>
      <div class="items">
        ${itemsHtml || '<p style="color:#948C7F;font-size:14px;">No items in this order.</p>'}
      </div>
      <div class="total-row">
        <span class="total-amount">Total: ${formatPrice(total, currency)}</span>
      </div>
    </div>
  `;
};

// Delivery-fee note. Only ever included by the calling template once an
// order's payment has actually been verified (see order-confirmation.js
// and payment-verified.js) — never shown before that.
export const generateDeliveryInfo = () => `
  <div class="delivery-info">
    <h3>Delivery Information</h3>
    <p>Delivery fee goes to courier but delivery is free for customers in RMU campus.</p>
  </div>
`;

function formatPrice(amount, currency = 'NGN') {
  if (currency === 'GHS') {
    return `₵${Number(amount).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `₦${Number(amount).toLocaleString('en-NG')}`;
}