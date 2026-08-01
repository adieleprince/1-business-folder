// email-templates/base-template.js

export const baseTemplate = (content, subject) => {
  const currentYear = new Date().getFullYear();
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f2ee;
      line-height: 1.6;
      color: #1C1A17;
      padding: 20px;
    }
    .email-wrapper {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(28, 26, 23, 0.12);
      overflow: hidden;
    }
    .email-header {
      background: linear-gradient(160deg, #3A2B20 0%, #5C3D2E 100%);
      padding: 40px 30px 30px;
      text-align: center;
      border-bottom: 4px solid #C49A6C;
    }
    .email-header .logo {
      max-width: 80px;
      height: auto;
      margin-bottom: 12px;
      border-radius: 8px;
    }
    .email-header h1 {
      font-family: 'Georgia', 'Times New Roman', serif;
      color: #ffffff;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: 0.05em;
      margin: 0;
    }
    .email-header .subtitle {
      color: #C49A6C;
      font-size: 13px;
      letter-spacing: 0.3em;
      text-transform: uppercase;
      font-weight: 400;
      margin-top: 4px;
    }
    .email-header .divider {
      width: 60px;
      height: 2px;
      background: #C49A6C;
      margin: 14px auto 0;
      border-radius: 2px;
    }
    .email-body {
      padding: 35px 40px 30px;
    }
    .email-body .greeting {
      font-size: 18px;
      font-weight: 600;
      color: #3A2B20;
      margin-bottom: 16px;
    }
    .email-body .message {
      color: #5C5650;
      font-size: 15px;
      line-height: 1.7;
      margin-bottom: 20px;
    }
    .email-body .message p {
      margin-bottom: 10px;
    }
    .order-summary {
      background: #F8F5F0;
      border-radius: 14px;
      padding: 22px 24px;
      margin: 20px 0 24px;
      border: 1px solid #E7E0D5;
    }
    .order-summary h3 {
      font-family: 'Georgia', 'Times New Roman', serif;
      color: #3A2B20;
      font-size: 16px;
      margin-bottom: 14px;
      padding-bottom: 10px;
      border-bottom: 2px solid #C49A6C;
    }
    .order-summary .order-id {
      font-size: 13px;
      color: #948C7F;
      margin-bottom: 14px;
      font-weight: 500;
    }
    .order-summary .order-id span {
      color: #3A2B20;
      font-weight: 600;
    }
    .order-summary .items {
      margin: 12px 0;
    }
    .order-summary .item-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 14px;
      color: #5C5650;
      border-bottom: 1px solid #E7E0D5;
    }
    .order-summary .item-row:last-child {
      border-bottom: none;
    }
    .order-summary .item-name {
      flex: 1;
    }
    .order-summary .item-qty {
      margin: 0 16px;
      color: #948C7F;
    }
    .order-summary .item-price {
      font-weight: 600;
      color: #3A2B20;
    }
    .order-summary .total-row {
      display: flex;
      justify-content: space-between;
      padding-top: 12px;
      margin-top: 10px;
      border-top: 2px solid #C49A6C;
      font-size: 17px;
      font-weight: 700;
      color: #3A2B20;
    }
    .order-summary .total-row .total-amount {
      color: #9C7649;
    }
    .email-body .btn {
      display: inline-block;
      padding: 14px 36px;
      background: #C49A6C;
      color: #ffffff;
      text-decoration: none;
      border-radius: 50px;
      font-weight: 600;
      font-size: 14px;
      letter-spacing: 0.02em;
      transition: background 0.3s ease;
      border: none;
      cursor: pointer;
      margin: 8px 0 4px;
    }
    .email-body .btn:hover {
      background: #9C7649;
    }
    .email-footer {
      padding: 24px 40px 30px;
      background: #F8F5F0;
      text-align: center;
      border-top: 1px solid #E7E0D5;
    }
    .email-footer .social {
      display: flex;
      justify-content: center;
      gap: 16px;
      margin-bottom: 14px;
    }
    .email-footer .social a {
      color: #948C7F;
      text-decoration: none;
      font-size: 13px;
      transition: color 0.3s ease;
    }
    .email-footer .social a:hover {
      color: #C49A6C;
    }
    .email-footer p {
      font-size: 13px;
      color: #948C7F;
      margin: 0;
      line-height: 1.6;
    }
    .email-footer .brand-name {
      font-weight: 600;
      color: #3A2B20;
    }
    @media (max-width: 480px) {
      .email-body {
        padding: 25px 20px 20px;
      }
      .email-footer {
        padding: 20px;
      }
      .email-header {
        padding: 30px 20px 24px;
      }
      .email-header h1 {
        font-size: 20px;
      }
      .order-summary {
        padding: 16px 18px;
      }
      .order-summary .item-row {
        font-size: 13px;
        flex-wrap: wrap;
      }
      .order-summary .item-qty {
        margin: 0 10px;
      }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <!-- HEADER -->
    <div class="email-header">
      <div style="width:80px;height:80px;background:#C49A6C;border-radius:50%;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;font-size:32px;color:#fff;font-weight:bold;font-family:serif;">R</div>
      <h1>Royal Dynasty Fragrances</h1>
      <div class="subtitle">Premium Luxury Fragrances</div>
      <div class="divider"></div>
    </div>

    <!-- BODY -->
    <div class="email-body">
      ${content}
    </div>

    <!-- FOOTER -->
    <div class="email-footer">
      <div class="social">
        <a href="#">Instagram</a>
        <a href="#">Facebook</a>
        <a href="#">Twitter</a>
      </div>
      <p>
        <span class="brand-name">Royal Dynasty Fragrances</span><br>
        Premium Luxury Fragrances
      </p>
      <p style="margin-top: 8px; font-size: 12px; color: #B5ABA0;">
        &copy; ${currentYear} Royal Dynasty Fragrances. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `;
};

// Helper to generate order summary HTML
export const generateOrderSummary = (order) => {
  const currency = order.currency || 'NGN';
  const currencySymbol = currency === 'GHS' ? 'GH₵' : '₦';
  const formatPrice = (amount) => {
    if (currency === 'GHS') {
      return `GH₵${Number(amount).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `₦${Number(amount).toLocaleString('en-NG')}`;
  };

  const itemsHtml = (order.items || []).map(item => `
    <div class="item-row">
      <span class="item-name">${item.name}</span>
      <span class="item-qty">×${item.quantity}</span>
      <span class="item-price">${formatPrice((Number(item.price) || 0) * item.quantity)}</span>
    </div>
  `).join('');

  const total = (order.items || []).reduce((sum, item) => sum + (Number(item.price) || 0) * item.quantity, 0);

  return `
    <div class="order-summary">
      <h3>Order Summary</h3>
      <div class="order-id">Order ID: <span>${order._id || order.orderId || 'N/A'}</span></div>
      <div class="items">
        ${itemsHtml || '<p style="color:#948C7F;font-size:14px;">No items in this order.</p>'}
      </div>
      <div class="total-row">
        <span>Total</span>
        <span class="total-amount">${formatPrice(total)}</span>
      </div>
    </div>
  `;
};