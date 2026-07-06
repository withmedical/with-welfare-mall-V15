const fs = require("fs");

function clean(value){
  return String(value || "").trim();
}
let url = clean(process.env.SUPABASE_URL);
url = url.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");

const config = `window.WITH_WELFARE_CONFIG = {
  SUPABASE_URL: "${url}",
  SUPABASE_ANON_KEY: "${clean(process.env.SUPABASE_ANON_KEY)}",
  SEND_EMAIL_FUNCTION: "${clean(process.env.SEND_EMAIL_FUNCTION) || "send-email"}"
};
`;

fs.writeFileSync("config.js", config, "utf8");
console.log("config.js generated.");
