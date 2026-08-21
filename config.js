// ============================================================
// API CONFIGURATION
// Single source of truth for the backend URL, used by every
// page on the site (storefront, checkout, account, admin).
//
// Local development: automatically points at localhost:5000 —
// no setup needed, nothing to change.
//
// Production: edit PRODUCTION_API_ORIGIN below to your real
// backend URL when you deploy. That is the ONLY place this
// needs to change — every page reads it from here.
// ============================================================
(function () {
  const LOCAL_HOSTNAMES = ['localhost', '127.0.0.1', ''];
  const isLocal = LOCAL_HOSTNAMES.includes(window.location.hostname);

  const LOCAL_API_ORIGIN = 'http://localhost:5000';

  // TODO: replace with your real backend URL before deploying to production.
  // Example: 'https://api.royaldynastyfragrance.com'
  const PRODUCTION_API_ORIGIN = 'https://YOUR-PRODUCTION-BACKEND-URL.com';

  const API_ORIGIN = isLocal ? LOCAL_API_ORIGIN : PRODUCTION_API_ORIGIN;

  // Exposed globally so every page's inline script can use them.
  window.API_ORIGIN = API_ORIGIN;               // e.g. http://localhost:5000
  window.API_BASE_URL = API_ORIGIN + '/api/v1';  // e.g. http://localhost:5000/api/v1
  window.UPLOADS_BASE_URL = API_ORIGIN + '/uploads'; // e.g. http://localhost:5000/uploads
})();