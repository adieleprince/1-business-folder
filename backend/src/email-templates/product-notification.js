// email-templates/product-notification.js
import { baseTemplate } from './base-template.js';

// Optional — set in .env once you have a real domain, so subscriber
// emails can link back to the shop and show the product photo. Both
// gracefully omit themselves if unset, rather than showing a broken link
// or a broken image.
const SITE_URL = (process.env.SITE_URL || '').replace(/\/$/, '');
const BACKEND_URL = (process.env.BACKEND_URL || '').replace(/\/$/, '');

function formatPrices(product) {
  const parts = [];
  if (product.priceNGN) parts.push(`₦${Number(product.priceNGN).toLocaleString('en-NG')}`);
  if (product.priceGHS) {
    parts.push(
      `GH₵${Number(product.priceGHS).toLocaleString('en-GH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`
    );
  }
  return parts.join(' / ');
}

function productImageBlock(product) {
  if (!product.image || !BACKEND_URL) return '';
  const imageUrl = product.image.startsWith('http')
    ? product.image
    : `${BACKEND_URL}/uploads/${product.image}`;
  return `<img src="${imageUrl}" alt="${product.name}" style="width:100%;max-width:280px;border-radius:14px;display:block;margin:0 auto 20px;">`;
}

function shopLinkBlock() {
  if (!SITE_URL) return '';
  return `
    <div style="text-align:center;margin-top:12px;">
      <a href="${SITE_URL}/royal-dynasty-fragrance.html#shop" class="btn">Shop Now</a>
    </div>
  `;
}

function productDetailBlock(product) {
  return `
    <div class="order-summary">
      <h3>${product.name}</h3>
      ${product.description ? `<p style="color:#5C5650;font-size:14px;margin-bottom:10px;">${product.description}</p>` : ''}
      <p style="font-weight:700;color:#3A2B20;font-size:16px;">${formatPrices(product)}</p>
    </div>
  `;
}

export const newProductEmail = (product) => {
  const content = `
    <div class="greeting">Something new has arrived ✨</div>
    <div class="message">
      <p><strong>${product.name}</strong> just landed at Royal Dynasty Fragrance.</p>
    </div>
    ${productImageBlock(product)}
    ${productDetailBlock(product)}
    ${shopLinkBlock()}
  `;

  return {
    subject: `New Arrival: ${product.name} • Royal Dynasty Fragrances`,
    html: baseTemplate(content, `New Arrival: ${product.name}`)
  };
};

export const restockEmail = (product) => {
  const content = `
    <div class="greeting">Back in stock 🎉</div>
    <div class="message">
      <p><strong>${product.name}</strong> is back and ready to ship.</p>
    </div>
    ${productImageBlock(product)}
    ${productDetailBlock(product)}
    ${shopLinkBlock()}
  `;

  return {
    subject: `Back in Stock: ${product.name} • Royal Dynasty Fragrances`,
    html: baseTemplate(content, `Back in Stock: ${product.name}`)
  };
};