const cloudinary = require("cloudinary").v2;

/** Trim and strip a single pair of surrounding quotes (common .env mistake). Matches Inventory Management System. */
function cleanEnv(value) {
  if (value == null) return "";
  let s = String(value).trim();
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

function isCloudinaryConfigured() {
  if (cleanEnv(process.env.CLOUDINARY_URL)) return true;
  return Boolean(
    cleanEnv(process.env.CLOUDINARY_CLOUD_NAME) &&
      cleanEnv(process.env.CLOUDINARY_API_KEY) &&
      cleanEnv(process.env.CLOUDINARY_API_SECRET)
  );
}

/**
 * Prefer CLOUDINARY_CLOUD_NAME + API_KEY + API_SECRET over CLOUDINARY_URL so a stale URL line cannot override (same as IMS).
 * Use the same three variables (or CLOUDINARY_URL) as the Inventory Management System project for one Cloudinary account.
 */
function ensureConfigured() {
  if (!isCloudinaryConfigured()) {
    const err = new Error(
      "Cloudinary is not configured (set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET or CLOUDINARY_URL)"
    );
    err.status = 503;
    err.code = "CLOUDINARY_DISABLED";
    throw err;
  }

  const url = cleanEnv(process.env.CLOUDINARY_URL);
  const name = cleanEnv(process.env.CLOUDINARY_CLOUD_NAME);
  const key = cleanEnv(process.env.CLOUDINARY_API_KEY);
  const secret = cleanEnv(process.env.CLOUDINARY_API_SECRET);

  cloudinary.config(true);

  if (name && key && secret) {
    cloudinary.config({
      cloud_name: name.toLowerCase(),
      api_key: key,
      api_secret: secret,
      secure: true,
    });
  } else if (url) {
    process.env.CLOUDINARY_URL = url;
    cloudinary.config(true);
  }
}

module.exports = { cloudinary, ensureConfigured, isCloudinaryConfigured };
