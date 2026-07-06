const app=document.getElementById("app");
const CFG=window.WITH_WELFARE_CONFIG||{};
const db=CFG.SUPABASE_URL&&CFG.SUPABASE_ANON_KEY&&window.supabase?window.supabase.createClient(CFG.SUPABASE_URL,CFG.SUPABASE_ANON_KEY):null;
let session=JSON.parse(localStorage.getItem("wm_session_v14")||"null");
let page="home", loginTab="user", adminTab="dashboard";
let data={settings:{},menus:[],employees:[],admins:[],rooms:[],policies:[],reservations:[],condolenceTypes:[],condolences:[],events:[],eventApps:[],discounts:[],vacations:[],notices:[],mailOutbox:[],auditLogs:[],passwordResets:[],seasonRates:[],roomBlocks:[]};

const DEFAULT_ADMIN={name:"김경진",login_id:"with1905",password:"withm*1905",dept:"관리자"};
function seedLocalData(){
  data.settings={
    home_badge:"Company Welfare Platform",
    home_title:"회원 승인형 회사 복지몰",
    home_description:"Supabase 설정 전에는 로컬 테스트 모드로 실행됩니다.",
    nightly_price:270000,
    annual_night_limit:10,
    condolence_email:"withm1905@withmedical.com",
    vacation_email:"withm1905@withmedical.com"
  };
  data.menus=[
    {key:"stay",name:"숙소예약",enabled:true},{key:"family",name:"경조사",enabled:true},
    {key:"event",name:"행사",enabled:true},{key:"discount",name:"할인",enabled:true},
    {key:"vacation",name:"휴가지원사업",enabled:true},{key:"notice",name:"공지",enabled:true}
  ];
  data.admins=[{id:"local-admin",...DEFAULT_ADMIN}];
  data.employees=[];
  data.rooms=[
    {id:"local-stella",name:"스텔라동",base_people:5,max_people:8,address:"제주 사계펜션"},
    {id:"local-solar",name:"솔라동",base_people:5,max_people:8,address:"제주 사계펜션"}
  ];
  data.policies=[
    {id:"local-self",name:"본인 사용",discount_rate:100,payment_required:false},
    {id:"local-family",name:"직계가족",discount_rate:100,payment_required:false},
    {id:"local-friend",name:"지인",discount_rate:50,payment_required:true}
  ];
  data.condolenceTypes=[{name:"결혼"},{name:"출산"},{name:"장례"},{name:"생일"},{name:"기타"}];
  data.reservations=[];data.condolences=[];data.events=[];data.eventApps=[];data.discounts=[];data.vacations=[];data.notices=[];data.mailOutbox=[];data.auditLogs=[];data.passwordResets=[];data.seasonRates=[];data.roomBlocks=[];
}


const T={
 settings:"app_settings", menus:"menu_settings", employees:"employees", admins:"admins", rooms:"rooms", policies:"use_policies",
 reservations:"reservations", condolenceTypes:"condolence_types", condolences:"condolences", events:"events", eventApps:"event_applications",
 discounts:"discounts", vacations:"vacation_support", notices:"notices", mailOutbox:"mail_outbox", auditLogs:"audit_logs", passwordResets:"password_reset_requests", seasonRates:"season_rates", roomBlocks:"room_blocks"
};

function toast(msg){const t=document.createElement("div");t.className="toast";t.innerText=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),2500)}
function uid(){return crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2)}
function onlyDigits(v){return String(v||"").replace(/\D/g,"")}
function isValidMobile(v){return /^01[0-9]{8,9}$/.test(onlyDigits(v))}
function money(n){return Number(n||0).toLocaleString()+"원"}
function currentUser(){if(!session)return null;return session.role==="admin"?data.admins.find(a=>a.id===session.id):data.employees.find(e=>e.id===session.id)}
function menu(k){return data.menus.find(m=>m.key===k)||{key:k,name:k,enabled:true}}
function navItems(){return [{key:"home",name:"홈",enabled:true},...["stay","family","event","discount","vacation","notice"].map(k=>menu(k)).filter(m=>m.enabled)]}
function ensurePage(p){return p==="home"||p==="admin"||p==="mypage"||menu(p).enabled}
function setPage(p){if(!ensurePage(p))return toast("비활성화된 메뉴입니다.");page=p;render();scrollTo(0,0)}

async function q(table){
  if(!db) return [];
  const {data,error}=await db.from(table).select("*").order("created_at",{ascending:false,nullsFirst:false});
  if(error){console.error(error);toast(table+" 불러오기 실패");return []}
  return data||[];
}
async function loadAll(){
 if(!db){
   seedLocalData();
   render();
   toast("Supabase 설정 전입니다. 로컬 테스트 모드로 실행됩니다.");
   return;
 }
 data.settings=(await q(T.settings))[0]||{};
 data.menus=await q(T.menus);
 data.employees=await q(T.employees);
 data.admins=await q(T.admins);

 if(!data.admins.length){
   const {error}=await db.from(T.admins).insert(DEFAULT_ADMIN);
   if(error){
     console.error("기본 관리자 생성 실패",error);
     toast("관리자 계정이 없습니다. supabase-v14-schema.sql 실행을 확인하세요.");
   }else{
     data.admins=await q(T.admins);
     toast("기본 관리자 계정을 생성했습니다.");
   }
 }

 data.rooms=await q(T.rooms);
 data.policies=await q(T.policies);
 data.reservations=await q(T.reservations);
 data.condolenceTypes=await q(T.condolenceTypes);
 data.condolences=await q(T.condolences);
 data.events=await q(T.events);
 data.eventApps=await q(T.eventApps);
 data.discounts=await q(T.discounts);
 data.vacations=await q(T.vacations);
 data.notices=await q(T.notices);
 data.mailOutbox=await q(T.mailOutbox);
 data.auditLogs=await q(T.auditLogs);
 data.passwordResets=await q(T.passwordResets);
 data.seasonRates=await q(T.seasonRates);
 data.roomBlocks=await q(T.roomBlocks);

 if(!data.menus.length){
   data.menus=[
    {key:"stay",name:"숙소예약",enabled:true},{key:"family",name:"경조사",enabled:true},
    {key:"event",name:"행사",enabled:true},{key:"discount",name:"할인",enabled:true},
    {key:"vacation",name:"휴가지원사업",enabled:true},{key:"notice",name:"공지",enabled:true}
   ];
 }
 render();
}
async function ins(table,row){
  if(!db){toast("Supabase 설정 전 로컬 테스트 모드입니다. 실제 저장은 Supabase 연결 후 가능합니다.");return false}
  const {error}=await db.from(table).insert(row);
  if(error){console.error(error);toast("저장 실패");return false}
  await loadAll();return true
}
async function upd(table,id,row){
  if(!db){toast("Supabase 설정 전 로컬 테스트 모드입니다.");return false}
  const {error}=await db.from(table).update(row).eq("id",id);
  if(error){console.error(error);toast("수정 실패");return false}
  await loadAll();return true
}
async function del(table,id){
  if(!db){toast("Supabase 설정 전 로컬 테스트 모드입니다.");return false}
  const {error}=await db.from(table).delete().eq("id",id);
  if(error){console.error(error);toast("삭제 실패");return false}
  await loadAll();return true
}
async function audit(action,detail){if(!db)return;await db.from(T.auditLogs).insert({actor:currentUser()?.name||"시스템",action,detail})}

async function uploadFile(bucket,path,file){
 const {error}=await db.storage.from(bucket).upload(path,file,{upsert:true});
 if(error){console.error(error);toast("파일 업로드 실패");return ""}
 const {data:pub}=db.storage.from(bucket).getPublicUrl(path);
 return pub.publicUrl;
}

async function sendMail(to,subject,body,attachment_url=""){
 await ins(T.mailOutbox,{kind:"email",to_email:to,subject,body,attachment_url,status:"대기"});
 if(db&&CFG.SEND_EMAIL_FUNCTION){
   try{
    await db.functions.invoke(CFG.SEND_EMAIL_FUNCTION,{body:{to,subject,body,attachment_url}});
   }catch(e){console.warn("Edge function email failed",e)}
 }
}

function loginView(){
 app.innerHTML=`<div class="loginbox panel">
 <div class="brand"><div class="logo">${data.settings.logo_url?`<img src="${data.settings.logo_url}">`:"W"}</div><div><b>WITH Welfare Mall</b><small>(주)위드메디컬 복지몰</small></div></div>
 <h1>복지몰 로그인</h1>
 <div class="tabs"><button class="${loginTab==='user'?'active':''}" onclick="loginTab='user';render()">직원 로그인</button><button class="${loginTab==='signup'?'active':''}" onclick="loginTab='signup';render()">회원가입</button><button class="${loginTab==='reset'?'active':''}" onclick="loginTab='reset';render()">비밀번호 초기화</button><button class="${loginTab==='admin'?'active':''}" onclick="loginTab='admin';render()">관리자</button></div>
 ${loginTab==='user'?`<form class="form" onsubmit="loginUser(event)"><label class="wide">이름<input name="name" required></label><label class="wide">휴대폰 번호<input name="phone" placeholder="01012345678" required></label><label class="wide">비밀번호<input type="password" name="password" required></label><button class="wide">직원 로그인</button></form>`:""}
 ${loginTab==='signup'?`<form class="form" onsubmit="signup(event)"><label>이름<input name="name" required></label><label>사원번호 선택<input name="emp_no"></label><label>생년월일<input type="date" name="birth" required></label><label>휴대폰 번호<input name="phone" placeholder="01012345678" required></label><label>부서<input name="dept"></label><label>비밀번호<input type="password" name="password" required></label><label class="wide">비밀번호 확인<input type="password" name="password2" required></label><button class="wide">회원가입 신청</button></form>`:""}
 ${loginTab==='reset'?`<form class="form" onsubmit="resetRequest(event)"><label class="wide">이름<input name="name" required></label><label class="wide">휴대폰 번호<input name="phone" placeholder="01012345678" required></label><button class="wide">비밀번호 초기화 요청</button></form>`:""}
 ${loginTab==='admin'?`<form class="form" onsubmit="loginAdmin(event)"><label class="wide">관리자 ID<input name="login_id" required></label><label class="wide">비밀번호<input type="password" name="password" required></label><button class="wide">관리자 로그인</button></form>`:""}
 </div>`
}
async function loginUser(e){e.preventDefault();const f=new FormData(e.target);const phone=onlyDigits(f.get("phone"));const u=data.employees.find(x=>x.name===f.get("name")&&onlyDigits(x.phone)===phone&&x.password===f.get("password"));if(!u)return toast("로그인 정보가 일치하지 않습니다.");if(u.status!=="승인")return toast("관리자 승인 후 로그인 가능합니다.");session={role:"user",id:u.id};localStorage.setItem("wm_session_v14",JSON.stringify(session));render()}
async function loginAdmin(e){
  e.preventDefault();
  const f=new FormData(e.target);
  const loginId=String(f.get("login_id")||"").trim();
  const password=String(f.get("password")||"");
  if(!data.admins.length){
    return toast("관리자 계정이 없습니다. Supabase SQL 실행 또는 config.js 설정을 확인하세요.");
  }
  const a=data.admins.find(x=>String(x.login_id).trim()===loginId&&String(x.password)===password);
  if(!a)return toast("관리자 정보가 일치하지 않습니다. ID: with1905 / PW: withm*1905");
  session={role:"admin",id:a.id};
  localStorage.setItem("wm_session_v14",JSON.stringify(session));
  render();
}
async function signup(e){e.preventDefault();const f=new FormData(e.target);const phone=onlyDigits(f.get("phone"));if(!isValidMobile(phone))return toast("휴대폰 번호를 확인하세요.");if(f.get("password")!==f.get("password2"))return toast("비밀번호가 일치하지 않습니다.");if(data.employees.some(x=>onlyDigits(x.phone)===phone))return toast("이미 등록된 휴대폰 번호입니다.");await ins(T.employees,{name:f.get("name"),emp_no:f.get("emp_no"),birth:f.get("birth"),phone,dept:f.get("dept"),password:f.get("password"),status:"대기"});toast("회원가입 신청 완료");loginTab="user"}
async function resetRequest(e){e.preventDefault();const f=new FormData(e.target);const phone=onlyDigits(f.get("phone"));const u=data.employees.find(x=>x.name===f.get("name")&&onlyDigits(x.phone)===phone);if(!u)return toast("회원 정보를 찾을 수 없습니다.");await ins(T.passwordResets,{employee_id:u.id,user_name:u.name,phone:u.phone,status:"요청"});toast("초기화 요청 접수")}
function logout(){session=null;localStorage.removeItem("wm_session_v14");render()}

function layout(content){const u=currentUser();return `<div class="top"><div class="topin"><div class="brand"><div class="logo">${data.settings.logo_url?`<img src="${data.settings.logo_url}">`:"W"}</div><div><b>WITH Welfare Mall</b><small>${u?.name||""}</small></div></div><div class="nav">${navItems().map(n=>`<button class="${page===n.key?'active':''}" onclick="setPage('${n.key}')">${n.name}</button>`).join("")}${session.role==="admin"?`<button class="${page==='admin'?'active':''}" onclick="setPage('admin')">관리자</button>`:`<button class="${page==='mypage'?'active':''}" onclick="setPage('mypage')">내 정보</button>`}<button onclick="logout()">로그아웃</button></div></div></div><div class="wrap">${content}</div><div class="footer">WITH Welfare Mall V15 · Supabase 실무형 구조</div>`}
function home(){const u=currentUser();return layout(`<section class="hero"><div class="welcome"><span class="badge">${data.settings.home_badge||"Company Welfare Platform"}</span><h1>${data.settings.home_title||"회원 승인형 회사 복지몰"}</h1><p class="muted">${data.settings.home_description||"Supabase 테이블 기반 실무형 복지몰입니다."}</p><button onclick="setPage('stay')">숙소 예약하기</button> <button class="secondary" onclick="setPage('vacation')">${menu("vacation").name}</button></div><div class="panel"><b>${u.name}님</b><p class="muted">${session.role==="admin"?"관리자":"임직원"} 계정</p><div class="kpi">${session.role==="admin"?"운영중":annualNights(u.id)+" / "+(data.settings.annual_night_limit||10)+"박"}</div></div></section><section class="grid4">${["stay","family","event","discount","vacation","notice"].filter(k=>menu(k).enabled).map(k=>`<div class="card"><h3>${menu(k).name}</h3><p class="muted">바로가기</p><button onclick="setPage('${k}')">열기</button></div>`).join("")}</section>`)}
function annualNights(emp){return data.reservations.filter(r=>r.employee_id===emp&&r.status!=="반려"&&r.status!=="취소").reduce((s,r)=>s+days(r.checkin,r.checkout),0)}
function days(a,b){return Math.max(0,Math.round((new Date(b)-new Date(a))/(86400000)))}
function blocked(room,ci,co){return data.roomBlocks.some(b=>b.room_id===room&&ci<b.end_date&&b.start_date<co)}
function busy(room,ci,co){return data.reservations.some(r=>r.room_id===room&&r.status!=="취소"&&r.status!=="반려"&&ci<r.checkout&&r.checkin<co)||blocked(room,ci,co)}
function roomPhoto(room){const p=data.rooms.find(r=>r.id===room)?.main_photo_url;return p?`<div class="room-photo"><img src="${p}"></div>`:`<div class="room-photo">숙소 사진</div>`}
function stay(){return layout(`<section class="section"><h2>${menu("stay").name}</h2><div class="grid2">${data.rooms.map(r=>`<div class="card">${roomPhoto(r.id)}<h3>${r.name}</h3><p class="muted">기본 ${r.base_people}명 · 최대 ${r.max_people}명</p><button onclick="showReserve('${r.id}')">예약 신청</button></div>`).join("")}</div></section><section id="reserveForm"></section><section class="section"><h2>내 예약</h2>${reservationTable(data.reservations.filter(r=>r.employee_id===currentUser().id),false)}</section>`)}
function showReserve(room){const r=data.rooms.find(x=>x.id===room);document.getElementById("reserveForm").innerHTML=`<div class="panel"><h3>${r.name} 예약</h3><form class="form" onsubmit="reserve(event,'${room}')"><label>체크인<input type="date" name="checkin" required></label><label>체크아웃<input type="date" name="checkout" required></label><label>이용 구분<select name="policy">${data.policies.map(p=>`<option value="${p.id}">${p.name}</option>`).join("")}</select></label><label>인원<input type="number" name="people" value="${r.base_people}" min="1" max="${r.max_people}"></label><label class="wide">메모<textarea name="memo"></textarea></label><button class="wide">예약 신청</button></form></div>`}
async function reserve(e,room){e.preventDefault();const f=new FormData(e.target);const ci=f.get("checkin"),co=f.get("checkout");if(co<=ci)return toast("날짜를 확인하세요.");if(busy(room,ci,co))return toast("예약 불가 기간입니다.");const r=data.rooms.find(x=>x.id===room),p=data.policies.find(x=>x.id===f.get("policy"));const amount=p.payment_required?Math.round((data.settings.nightly_price||270000)*days(ci,co)*(100-p.discount_rate)/100):0;await ins(T.reservations,{employee_id:currentUser().id,room_id:room,room_name:r.name,user_name:currentUser().name,checkin:ci,checkout:co,nights:days(ci,co),people:+f.get("people"),use_policy_id:p.id,use_type:p.name,amount,status:"대기",qr_code:"WM-"+uid().slice(0,8),checkin_status:"미체크인",memo:f.get("memo")});await audit("숙소 예약 신청",`${currentUser().name}/${r.name}/${ci}~${co}`);toast("예약 신청 완료")}
function reservationTable(rows,admin){if(!rows.length)return`<div class="panel empty">예약 없음</div>`;return`<table class="table"><thead><tr><th>숙소</th><th>신청자</th><th>기간</th><th>금액</th><th>상태</th><th>관리</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${r.room_name}</td><td>${r.user_name}</td><td>${r.checkin}~${r.checkout}<br>${r.nights}박</td><td>${money(r.amount)}</td><td><span class="status">${r.status}</span><br>${r.qr_code||""}<br>${r.checkin_status||""}</td><td>${admin?`<button onclick="resStatus('${r.id}','승인')">승인</button><button class="danger" onclick="resStatus('${r.id}','반려')">반려</button>`:"-"}</td></tr>`).join("")}</tbody></table>`}
async function resStatus(id,status){await upd(T.reservations,id,{status});await audit("예약 상태 변경",status)}
function family(){return layout(`<section class="section"><h2>${menu("family").name}</h2><form class="form panel" onsubmit="condolence(event)"><label>구분<select name="type">${data.condolenceTypes.map(t=>`<option value="${t.name}">${t.name}</option>`).join("")}</select></label><label>일자<input type="date" name="date" required></label><label>증빙 PDF/이미지<input type="file" name="file" accept=".pdf,image/*"></label><label class="wide">내용<textarea name="memo" required></textarea></label><button class="wide">접수</button></form><h2>내 접수</h2>${simpleTable(data.condolences.filter(c=>c.employee_id===currentUser().id))}</section>`)}
async function condolence(e){e.preventDefault();const f=new FormData(e.target);let url="";const file=e.target.file.files[0];if(file){if(file.size>500*1024)return toast("500KB 이하만 가능");url=await uploadFile("welfare-files",`condolences/${uid()}-${file.name}`,file)}await ins(T.condolences,{employee_id:currentUser().id,user_name:currentUser().name,dept:currentUser().dept,type:f.get("type"),event_date:f.get("date"),memo:f.get("memo"),attachment_url:url,status:"접수완료"});await sendMail(data.settings.condolence_email,"경조사 신청 접수",`${currentUser().name} / ${f.get("type")} / ${f.get("memo")}`,url);toast("접수 완료")}
function eventPage(){return layout(`<section class="section"><h2>${menu("event").name}</h2><div class="grid2">${data.events.filter(e=>e.is_open).map(ev=>`<div class="card"><span class="badge">${ev.event_date}</span><h3>${ev.title}</h3><p>${ev.memo||""}</p><button onclick="eventApply('${ev.id}')">참석 신청</button></div>`).join("")}</div></section>`)}
async function eventApply(id){const ev=data.events.find(e=>e.id===id);await ins(T.eventApps,{event_id:id,employee_id:currentUser().id,user_name:currentUser().name,dept:currentUser().dept,status:"신청완료"});toast("행사 신청 완료")}
function discount(){return layout(`<section class="section"><h2>${menu("discount").name}</h2><div class="grid3">${data.discounts.map(d=>`<div class="card"><span class="badge">${d.category}</span><h3>${d.title}</h3><p>${d.rate}</p><p class="muted">${d.method}</p></div>`).join("")}</div></section>`)}
function vacation(){return layout(`<section class="section"><h2>${menu("vacation").name}</h2><form class="form panel" onsubmit="vacationApply(event)"><label>연락처<input name="phone" value="${currentUser().phone}" required></label><label class="wide">신청 사유<textarea name="memo" required></textarea></label><button class="wide">신청</button></form>${simpleTable(data.vacations.filter(v=>v.employee_id===currentUser().id))}</section>`)}
async function vacationApply(e){e.preventDefault();const f=new FormData(e.target);await ins(T.vacations,{employee_id:currentUser().id,user_name:currentUser().name,dept:currentUser().dept,phone:f.get("phone"),memo:f.get("memo"),status:"접수완료"});await sendMail(data.settings.vacation_email,"휴가지원사업 신청 접수",`${currentUser().name} / ${f.get("memo")}`);toast("신청 완료")}
function notice(){return layout(`<section class="section"><h2>${menu("notice").name}</h2><div class="panel">${data.notices.map(n=>`<div><b>${n.important?"[중요] ":""}${n.title}</b><p class="muted">${n.body}</p><hr></div>`).join("")}</div></section>`)}
function mypage(){const u=currentUser();return layout(`<section class="section"><h2>내 정보</h2><div class="panel"><p>${u.name} / ${u.dept||""} / ${u.phone}</p><form class="form" onsubmit="changePw(event)"><label>현재 비밀번호<input type="password" name="old" required></label><label>새 비밀번호<input type="password" name="pw" required></label><button class="wide">변경</button></form></div></section>`)}
async function changePw(e){e.preventDefault();const f=new FormData(e.target),u=currentUser();if(u.password!==f.get("old"))return toast("현재 비밀번호 오류");await upd(T.employees,u.id,{password:f.get("pw")});toast("비밀번호 변경 완료")}
function simpleTable(rows){if(!rows.length)return`<div class="panel empty">내역 없음</div>`;return`<table class="table"><tbody>${rows.map(r=>`<tr><td>${r.type||r.title||r.user_name}</td><td>${r.status||""}</td><td>${r.created_at||""}</td></tr>`).join("")}</tbody></table>`}
function admin(){const tabs=[["dashboard","대시보드"],["members","회원"],["stay","숙소"],["family","경조사"],["event","행사"],["discount","할인"],["vacation","휴가지원"],["notice","공지"],["mail","메일"],["audit","로그"]];let b="";if(adminTab==="dashboard")b=adminDashboard();if(adminTab==="members")b=adminMembers();if(adminTab==="stay")b=adminStay();if(adminTab==="family")b=adminFamily();if(adminTab==="event")b=adminEvents();if(adminTab==="discount")b=adminDiscounts();if(adminTab==="vacation")b=simpleTable(data.vacations);if(adminTab==="notice")b=adminNotices();if(adminTab==="mail")b=simpleTable(data.mailOutbox);if(adminTab==="audit")b=simpleTable(data.auditLogs);return layout(`<section class="admin-shell"><aside class="admin-side">${tabs.map(t=>`<button class="${adminTab===t[0]?'active':''}" onclick="adminTab='${t[0]}';render()">${t[1]}</button>`).join("")}</aside><main>${b}</main></section>`)}
function adminDashboard(){return`<div class="grid4"><div class="card"><b>회원</b><div class="kpi">${data.employees.length}</div></div><div class="card"><b>예약대기</b><div class="kpi">${data.reservations.filter(r=>r.status==="대기").length}</div></div><div class="card"><b>경조사</b><div class="kpi">${data.condolences.length}</div></div><div class="card"><b>메일</b><div class="kpi">${data.mailOutbox.length}</div></div></div>`}
function adminMembers(){return`<h2>회원 관리</h2>${reservationTable([],false)}<table class="table"><thead><tr><th>이름</th><th>전화</th><th>상태</th><th>관리</th></tr></thead><tbody>${data.employees.map(u=>`<tr><td>${u.name}</td><td>${u.phone}</td><td>${u.status}</td><td><button onclick="empStatus('${u.id}','승인')">승인</button><button class="danger" onclick="del('${T.employees}','${u.id}')">삭제</button></td></tr>`).join("")}</tbody></table>`}
async function empStatus(id,status){await upd(T.employees,id,{status});await audit("회원 상태 변경",status)}
function adminStay(){return`<h2>숙소 관리</h2><h3>예약</h3>${reservationTable(data.reservations,true)}<h3>숙소 사진</h3>${data.rooms.map(r=>`<div class="card"><h3>${r.name}</h3>${roomPhoto(r.id)}<form class="form" onsubmit="roomUpload(event,'${r.id}')"><label class="wide">사진<input type="file" name="photo" accept="image/*" required></label><button class="wide">대표사진 업로드</button></form></div>`).join("")}`}
async function roomUpload(e,id){e.preventDefault();const file=e.target.photo.files[0];const url=await uploadFile("welfare-files",`rooms/${id}-${file.name}`,file);if(url)await upd(T.rooms,id,{main_photo_url:url})}
function adminFamily(){return`<h2>경조사 접수</h2>${simpleTable(data.condolences)}`}
function adminEvents(){return`<h2>행사 관리</h2><form class="form panel" onsubmit="eventAdd(event)"><label>행사명<input name="title" required></label><label>일자<input type="date" name="event_date" required></label><label class="wide">내용<textarea name="memo"></textarea></label><button class="wide">추가</button></form>${simpleTable(data.events)}`}
async function eventAdd(e){e.preventDefault();const f=new FormData(e.target);await ins(T.events,{title:f.get("title"),event_date:f.get("event_date"),memo:f.get("memo"),is_open:true})}
function adminDiscounts(){return`<h2>할인 관리</h2><form class="form panel" onsubmit="discountAdd(event)"><label>카테고리<input name="category" required></label><label>제목<input name="title" required></label><label>할인<input name="rate"></label><label>링크<input name="link"></label><label class="wide">방법<textarea name="method"></textarea></label><button class="wide">추가</button></form>${simpleTable(data.discounts)}`}
async function discountAdd(e){e.preventDefault();const f=new FormData(e.target);await ins(T.discounts,{category:f.get("category"),title:f.get("title"),rate:f.get("rate"),method:f.get("method"),link:f.get("link")})}
function adminNotices(){return`<h2>공지 관리</h2><form class="form panel" onsubmit="noticeAdd(event)"><label>제목<input name="title" required></label><label>중요<select name="important"><option value="true">중요</option><option value="false">일반</option></select></label><label class="wide">내용<textarea name="body" required></textarea></label><button class="wide">추가</button></form>${simpleTable(data.notices)}`}
async function noticeAdd(e){e.preventDefault();const f=new FormData(e.target);await ins(T.notices,{title:f.get("title"),important:f.get("important")==="true",body:f.get("body")})}

function render(){if(!session)return loginView();if(!currentUser()){logout();return}if(!ensurePage(page))page="home";if(page==="home")app.innerHTML=home();if(page==="stay")app.innerHTML=stay();if(page==="family")app.innerHTML=family();if(page==="event")app.innerHTML=eventPage();if(page==="discount")app.innerHTML=discount();if(page==="vacation")app.innerHTML=vacation();if(page==="notice")app.innerHTML=notice();if(page==="mypage")app.innerHTML=mypage();if(page==="admin")app.innerHTML=admin()}
loadAll();
