import Product from "../models/product.model.js";

// Mirrors the bundle definitions shown on the storefront
// (royal-dynasty-fragrance.html's BUNDLES array). Bundles aren't stored as
// Product documents, so the backend keeps its own authoritative copy here
// to validate against — the frontend price for a bundle is never trusted.
export const BUNDLES = [
  { name: "First Class", priceNGN: 81500, priceGHS: 680 },
  { name: "Second Class", priceNGN: 71500, priceGHS: 596 },
  { name: "Economy", priceNGN: 45000, priceGHS: 471 }
];

const MAX_QUANTITY_PER_ITEM = 50;

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Validates a cart's items against the server's own product/bundle catalog
 * and returns authoritative, server-priced items and total — the client's
 * submitted prices and total are never trusted.
 *
 * Returns either:
 *   { ok: true, items: [...], amount, currency }
 *   { ok: false, message: "..." }
 */
export async function resolveOrderItems(items, currency) {
  const normalizedCurrency = currency === "GHS" ? "GHS" : "NGN";
  const priceField = normalizedCurrency === "GHS" ? "priceGHS" : "priceNGN";

  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, message: "Your cart is empty." };
  }

  const resolvedItems = [];
  const unknownItems = [];

  for (const rawItem of items) {
    const name = (rawItem?.name || "").toString().trim();
    const quantity = Number(rawItem?.quantity);

    if (!name) {
      unknownItems.push("(unnamed item)");
      continue;
    }

    if (!Number.isInteger(quantity) || quantity <= 0 || quantity > MAX_QUANTITY_PER_ITEM) {
      return { ok: false, message: `Invalid quantity for "${name}".` };
    }

    // Try to match a real, currently active product first (case-insensitive).
    const product = await Product.findOne({
      name: { $regex: `^${escapeRegex(name)}$`, $options: "i" },
      active: true
    });

    if (product) {
      if (Number(product.stock) < quantity) {
        return {
          ok: false,
          message:
            product.stock > 0
              ? `Only ${product.stock} unit(s) of "${product.name}" left in stock. Please adjust the quantity.`
              : `"${product.name}" is currently out of stock.`
        };
      }

      resolvedItems.push({
        name: product.name,
        quantity,
        price: Number(product[priceField]) || 0,
        productId: product._id
      });
      continue;
    }

    // Fall back to the known gift-bundle catalog.
    const bundle = BUNDLES.find(
      (b) => b.name.toLowerCase() === name.toLowerCase()
    );

    if (bundle) {
      resolvedItems.push({
        name: bundle.name,
        quantity,
        price: Number(bundle[priceField]) || 0
      });
      continue;
    }

    unknownItems.push(name);
  }

  if (unknownItems.length > 0) {
    return {
      ok: false,
      message: `We couldn't recognize the following item(s) in your cart: ${unknownItems.join(", ")}. Please refresh the page and try again.`
    };
  }

  const amount = resolvedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  if (amount <= 0) {
    return { ok: false, message: "Cart total is invalid." };
  }

  return { ok: true, items: resolvedItems, amount, currency: normalizedCurrency };
}