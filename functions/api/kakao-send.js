export async function onRequestOptions(){return new Response(null,{status:204,headers:{"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type,X-SOLAPI-API-KEY,X-SOLAPI-API-SECRET"}});}
const encoder=new TextEncoder();
function clean(v){return String(v??"").trim();}
function hex(buffer){return [...new Uint8Array(buffer)].map(b=>b.toString(16).padStart(2,"0")).join("");}
function randomHex(bytes=16){const a=new Uint8Array(bytes);crypto.getRandomValues(a);return [...a].map(b=>b.toString(16).padStart(2,"0")).join("");}
async function authParts(apiKey,apiSecret){
  const date=new Date().toISOString();
  const salt=randomHex(16);
  const key=await crypto.subtle.importKey("raw",encoder.encode(clean(apiSecret)),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  const signature=hex(await crypto.subtle.sign("HMAC",key,encoder.encode(date+salt)));
  return {date,salt,signature,authorization:`HMAC-SHA256 apiKey=${clean(apiKey)}, date=${date}, salt=${salt}, signature=${signature}`};
}
function mask(v,left=4){v=String(v||"");return v?v.slice(0,left)+"***":"";}
function json(data,status=200){return Response.json(data,{status,headers:{"Cache-Control":"no-store"}});}
export async function onRequestPost({request,env}){
  try{
    const body=await request.json();
    const envKey=clean(env.SOLAPI_API_KEY),envSecret=clean(env.SOLAPI_API_SECRET);
    const headerKey=clean(request.headers.get("X-SOLAPI-API-KEY")),headerSecret=clean(request.headers.get("X-SOLAPI-API-SECRET"));
    const apiKey=envKey||headerKey,apiSecret=envSecret||headerSecret;
    const credentialSource=envKey&&envSecret?"environment":"admin";
    if(!apiKey||!apiSecret)return json({errorCode:"MissingCredential",message:"SOLAPI_API_KEY 또는 SOLAPI_API_SECRET이 설정되지 않았습니다."},503);
    if(body.diagnose)return json({ok:true,message:credentialSource==="environment"?"Cloudflare 환경변수 연결 정상":"관리자 직접 입력 키 연결 정상",credentialSource,apiKey:mask(apiKey),secretLength:apiSecret.length});
    if(!body.to||!body.from||!body.pfId||!body.templateId)return json({errorCode:"MissingRequiredField",message:"to, from, pfId, templateId는 필수입니다."},400);
    const message={to:String(body.to).replace(/\D/g,""),from:String(body.from).replace(/\D/g,""),kakaoOptions:{pfId:clean(body.pfId),templateId:clean(body.templateId),disableSms:true,variables:body.variables||{}}};
    const auth=await authParts(apiKey,apiSecret);
    const res=await fetch("https://api.solapi.com/messages/v4/send-many/detail",{method:"POST",headers:{Authorization:auth.authorization,"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({messages:[message]})});
    const text=await res.text();let data={};try{data=text?JSON.parse(text):{};}catch{data={message:text};}
    return json({...data,_debug:{credentialSource,request:{apiKey:mask(apiKey),date:auth.date,salt:auth.salt,signature:mask(auth.signature,12),pfId:message.kakaoOptions.pfId,templateId:message.kakaoOptions.templateId,from:message.from,to:message.to},response:{status:res.status,errorCode:data.errorCode||"",message:data.message||data.errorMessage||""}}},res.status);
  }catch(error){return json({errorCode:"WorkerError",message:error.message||String(error)},500);}
}
