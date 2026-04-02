/**
 * Vercel serverless entry — deploy from the `server/` directory.
 * Rewrites send all paths here; Express still sees the original URL path.
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const serverless = require("serverless-http");
const app = require("../src/app");

module.exports = serverless(app);
