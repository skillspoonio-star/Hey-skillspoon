require("dotenv").config();
const { start } = require("./src/server");

module.exports = async (req, res) => {
  const app = await start();
  return app(req, res);
};
