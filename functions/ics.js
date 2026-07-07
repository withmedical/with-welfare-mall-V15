function normalizeSupabaseUrl(url){
  return String(url||"").trim().replace(/\/rest\/v1\/?$/,"").replace(/\/+$/,"");
}
function escapeICS(value){
  return String(value||"").replace(/\\/g,"\\\\").replace(/;/g,"\\;").replace(/,/g,"\\,").replace(/\r?\n/g,"\\n");
}
function compactDate(value){
  return String(value||"").slice(0,10).replace(/-/g,"");
}
function stamp(){
  return new Date().toISOString().replace(/[-:]/g,"").replace(/\.\d{3}Z$/, "Z");
}
function validRange(start,end){
  return /^\d{4}-\d{2}-\d{2}$/.test(start||"") && /^\d{4}-\d{2}-\d{2}$/.test(end||"") && end>start;
}
function roomEvents(state,roomId){
  const rooms=Array.isArray(state.rooms)?state.rooms:[];
  const reservations=Array.isArray(state.reservations)?state.reservations:[];
  const blocks=Array.isArray(state.roomBlocks)?state.roomBlocks:[];
  const includeAll=roomId==="all";
  const events=[];
  reservations.filter(r=>(includeAll||String(r.roomId)===String(roomId))&&r.status!=="취소"&&r.status!=="반려").forEach(r=>{
    if(!validRange(r.checkin,r.checkout)) return;
    const room=rooms.find(x=>String(x.id)===String(r.roomId))||{};
    const roomName=room.name||r.roomName||"숙소";
    events.push({
      uid:`welfare-${r.id||(`${r.roomId}-${r.checkin}-${r.checkout}`)}@withmedical`,
      start:r.checkin,
      end:r.checkout,
      summary:`${roomName} 예약불가`,
      description:`복지몰 예약\n예약자: ${r.userName||""}\n구분: ${r.source==="manual"?"관리자 직접 예약":"임직원 예약"}\n상태: ${r.status||""}\n메모: ${r.memo||""}`
    });
  });
  blocks.filter(b=>includeAll||String(b.roomId)===String(roomId)).forEach(b=>{
    if(!validRange(b.start,b.end)) return;
    const room=rooms.find(x=>String(x.id)===String(b.roomId))||{};
    const roomName=room.name||"숙소";
    events.push({
      uid:`welfare-block-${b.id||(`${b.roomId}-${b.start}-${b.end}`)}@withmedical`,
      start:b.start,
      end:b.end,
      summary:`${roomName} 예약차단`,
      description:`복지몰 예약 차단\n사유: ${b.reason||""}`
    });
  });
  return events;
}
function buildICS(state,roomId){
  const rooms=Array.isArray(state.rooms)?state.rooms:[];
  const room=rooms.find(r=>String(r.id)===String(roomId));
  const name=roomId==="all"?"전체 숙소":(room&&room.name?room.name:"숙소");
  const dtstamp=stamp();
  const lines=[
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//WITHMEDICAL//Welfare Mall Live ICS//KO",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeICS("복지몰 "+name+" 예약")}`,
    "X-WR-TIMEZONE:Asia/Seoul"
  ];
  roomEvents(state,roomId).forEach(ev=>{
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${escapeICS(ev.uid)}`);
    lines.push(`DTSTAMP:${dtstamp}`);
    lines.push(`DTSTART;VALUE=DATE:${compactDate(ev.start)}`);
    lines.push(`DTEND;VALUE=DATE:${compactDate(ev.end)}`);
    lines.push(`SUMMARY:${escapeICS(ev.summary)}`);
    lines.push(`DESCRIPTION:${escapeICS(ev.description)}`);
    lines.push("TRANSP:OPAQUE");
    lines.push("STATUS:CONFIRMED");
    lines.push("END:VEVENT");
  });
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
async function loadState(env){
  const url=normalizeSupabaseUrl(env.SUPABASE_URL);
  const key=String(env.SUPABASE_ANON_KEY||"").trim();
  if(!url || !key) throw new Error("SUPABASE_URL 또는 SUPABASE_ANON_KEY가 없습니다.");
  const res=await fetch(`${url}/rest/v1/app_state?id=eq.main&select=data`,{
    headers:{apikey:key, Authorization:`Bearer ${key}`}
  });
  if(!res.ok) throw new Error(`Supabase 조회 실패: ${res.status}`);
  const rows=await res.json();
  return rows && rows[0] && rows[0].data ? rows[0].data : {};
}
function resolveRoomId(context){
  const u=new URL(context.request.url);
  const q=u.searchParams.get("room")||u.searchParams.get("roomId")||"";
  if(q) return decodeURIComponent(q).replace(/\.ics$/i,"")||"all";
  const parts=u.pathname.split("/").filter(Boolean);
  let last=parts[parts.length-1]||"all";
  if(last==="calendar"||last==="ics") last="all";
  return decodeURIComponent(last).replace(/\.ics$/i,"")||"all";
}
async function handleICS(context){
  try{
    const roomId=resolveRoomId(context);
    const state=await loadState(context.env);
    const body=buildICS(state,roomId);
    return new Response(body,{headers:{
      "Content-Type":"text/calendar; charset=utf-8",
      "Cache-Control":"no-store, max-age=0",
      "Access-Control-Allow-Origin":"*",
      "Content-Disposition":`inline; filename="${roomId}.ics"`
    }});
  }catch(err){
    const msg=escapeICS(err&&err.message?err.message:"ICS 오류");
    const body=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//WITHMEDICAL//Welfare Mall Live ICS//KO",`X-WR-CALNAME:복지몰 ICS 오류 ${msg}`,"END:VCALENDAR"].join("\r\n");
    return new Response(body,{status:200,headers:{"Content-Type":"text/calendar; charset=utf-8","Cache-Control":"no-store"}});
  }
}
export async function onRequestGet(context){
  return handleICS(context);
}
