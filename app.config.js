const appJson = require("./app.json");

module.exports = () => ({
  ...appJson.expo,
  extra: {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY ?? "",
  },
});
