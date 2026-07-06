const fs = require("fs");
function clean(v){return String(v||"").trim();}
let url=clean(process.env.SUPABASE_URL).replace(/\/rest\/v1\/?$/,"").replace(/\/+$/,"");
const config=`window.WITH_WELFARE_CONFIG = {
  SUPABASE_URL: "${url}",
  SUPABASE_ANON_KEY: "${clean(process.env.SUPABASE_ANON_KEY)}",
  SEND_EMAIL_FUNCTION: ""
};`;
fs.writeFileSync("config.js",config,"utf8");
console.log("V17 config.js generated");
