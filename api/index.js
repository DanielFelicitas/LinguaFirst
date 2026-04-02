require("dotenv").config({ path: require("path").join(__dirname, "..", "server", ".env") });

module.exports = require("../server/src/app");
