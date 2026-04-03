/**
 * Server entry — same deployment style as
 * https://github.com/c0d1nn/mern-stack-ecommerce-digital-products (root `index.js` + `vercel.json` v2 + `@vercel/node`).
 *
 * Local: `npm run dev` / `npm start` runs HTTP listener.
 * Vercel: `module.exports = app` — @vercel/node invokes the Express app (no serverless-http).
 */
require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const app = require("./src/app");

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`LinguaFiRST API listening on http://localhost:${PORT}`);
  });
}

module.exports = app;
