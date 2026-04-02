/**
 * Vercel serverless entry — deploy this project from the `server/` directory.
 * See server/vercel.json and README "Deploy on Vercel (separate projects)".
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const serverless = require("serverless-http");
const app = require("../src/app");

module.exports = serverless(app);
