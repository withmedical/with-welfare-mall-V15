// Cloudflare Pages build script
// Environment Variables:
// SUPABASE_URL
// SUPABASE_ANON_KEY
// SEND_EMAIL_FUNCTION

const fs = require("fs");

const config = `window.WITH_WELFARE_CONFIG = {
  SUPABASE_URL: "${process.env.SUPABASE_URL || ""}",
  SUPABASE_ANON_KEY: "${process.env.SUPABASE_ANON_KEY || ""}",
  SEND_EMAIL_FUNCTION: "${process.env.SEND_EMAIL_FUNCTION || "send-email"}"
};
`;

fs.writeFileSync("config.js", config, "utf8");
console.log("config.js generated from Cloudflare environment variables.");
