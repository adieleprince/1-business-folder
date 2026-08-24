const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value) {
  return typeof value === "string" && EMAIL_REGEX.test(value.trim());
}

// Coerces any input to a trimmed string and caps its length. This is the
// main defense against non-string input (e.g. an object like {"$ne": null}
// sent where a plain string is expected) ever reaching a MongoDB query or
// being stored, and against absurdly large payloads.
export function sanitizeText(value, maxLength = 300) {
  const str = value === undefined || value === null ? "" : String(value);
  return str.trim().slice(0, maxLength);
}