const app=document.getElementById("app");
const V16_CLOUD_READY=true;
const CLOUD_CONFIG=window.WITH_WELFARE_CONFIG||{};
function normalizeSupabaseUrl(url){
  return String(url||"").trim().replace(/\/rest\/v1\/?$/,"").replace(/\/+$/,"");
}
const SUPABASE_URL=normalizeSupabaseUrl(CLOUD_CONFIG.SUPABASE_URL);
const SUPABASE_KEY=String(CLOUD_CONFIG.SUPABASE_ANON_KEY||"").trim();
const supabaseClient=(SUPABASE_URL&&SUPABASE_KEY&&window.supabase)?window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY):null;
let cloudReady=false;
let cloudHydrating=false;
let cloudSaveTimer=null;
let cloudStatus="확인 중";
const today=new Date().toISOString().slice(0,10);
const MAX_FILE_SIZE=500*1024;
const ALLOWED_FILES=["application/pdf","image/png","image/jpeg","image/jpg","image/gif","image/webp"];

const seed={
  admins:[
    {id:"a1", name:"김경진", role:"admin", loginId:"with1905", password:"withm*1905", dept:"관리자"}
  ],
  users:[
    {id:"u1", name:"홍길동", empNo:"2026001", birth:"1990-01-01", phone:"010-1111-2222", password:"1234", role:"user", dept:"개발팀", status:"가입승인", createdAt:"2026-07-03"}
  ],
  settings:{
    bankName:"국민은행",
    bankAccount:"123456-01-789012",
    bankHolder:"주식회사 위드메디컬",
    nightlyPrice:270000,
    friendDiscountRate:50,
    annualNightLimit:10,
    condolenceEmail:"withm1905@withmedical.com",
    vacationEmail:"withm1905@withmedical.com"
  },
  usePolicies:[
    {id:"self", name:"본인 사용", discountRate:100, paymentRequired:false, description:"임직원 본인 사용 무료"},
    {id:"family", name:"직계가족", discountRate:100, paymentRequired:false, description:"직계가족 사용 무료"},
    {id:"friend", name:"지인", discountRate:50, paymentRequired:true, description:"지인 이용 시 1박 기준 50% 할인 금액 입금"}
  ],
  condolenceTypes:[
    {id:"ct1", name:"결혼", description:"결혼 축하 지원"},
    {id:"ct2", name:"출산", description:"출산 축하 지원"},
    {id:"ct3", name:"장례", description:"장례 조의 지원"},
    {id:"ct4", name:"생일", description:"생일 복지"},
    {id:"ct5", name:"기타", description:"기타 경조사"}
  ],
  rooms:[
    {id:"stella", name:"스텔라동", basePeople:5, maxPeople:8, address:"제주특별자치도 서귀포시 안덕면 사계북로41번길 27-45, 사계펜션"},
    {id:"solar", name:"솔라동", basePeople:5, maxPeople:8, address:"제주특별자치도 서귀포시 안덕면 사계북로41번길 27-45, 사계펜션"}
  ],
  reservations:[],
  condolences:[],
  events:[
    {id:"ev1",title:"하계 워크숍",date:"2026-07-19",limit:40,memo:"전사 워크숍 참석 신청",isOpen:true},
    {id:"ev2",title:"가족 초청 행사",date:"2026-09-12",limit:60,memo:"임직원 가족 초청 행사",isOpen:true}
  ],
  eventApplications:[],
  discounts:[
    {id:"d1",category:"건강검진",title:"제휴 병원 건강검진",rate:"30% 할인",method:"임직원 확인 후 예약",link:""},
    {id:"d2",category:"리조트",title:"전국 제휴 리조트",rate:"임직원가",method:"복지몰 신청 후 예약코드 발급",link:""},
    {id:"d3",category:"렌터카",title:"제주 렌터카 제휴",rate:"최대 25% 할인",method:"제휴 링크 이용",link:""},
    {id:"d4",category:"쇼핑",title:"생활용품 특가몰",rate:"월별 특가",method:"임직원 인증 후 이용",link:""}
  ],
  vacationSupport:[],
  notices:[
    {id:"n1",title:"제주 사계펜션 예약 운영 안내",important:true,body:"스텔라동, 솔라동은 각각 기본 5인 기준입니다. 직원당 연간 10박 기준으로 운영합니다.",views:0},
    {id:"n2",title:"지인 이용 시 50% 할인 금액 입금 안내",important:true,body:"지인 이용은 1박 270,000원 기준 50% 할인 금액을 회사 지정 계좌로 이체합니다.",views:0}
  ],
  mailOutbox:[]
};

let state=load();
migrate();
let session=JSON.parse(localStorage.getItem("with_session_v5")||"null");
let page="home", loginTab="user", adminTab="adminDashboard", calDate=new Date();

function load(){const s=localStorage.getItem("with_welfare_v5"); if(s) return JSON.parse(s); localStorage.setItem("with_welfare_v5",JSON.stringify(seed)); return JSON.parse(JSON.stringify(seed));}
function save(){
  localStorage.setItem("with_welfare_v5",JSON.stringify(state));
  scheduleCloudSave();
}
function migrate(){
  let changed=false;
  if(!state.admins){state.admins=seed.admins; changed=true;}
  if(!state.usePolicies){state.usePolicies=seed.usePolicies; changed=true;}
  if(!state.condolenceTypes){state.condolenceTypes=seed.condolenceTypes; changed=true;}
  if(!state.mailOutbox){state.mailOutbox=[]; changed=true;}
  if(!state.settings.condolenceEmail){state.settings.condolenceEmail="withm1905@withmedical.com"; changed=true;}
  if(!state.settings.vacationEmail){state.settings.vacationEmail="withm1905@withmedical.com"; changed=true;}
  if(!state.passwordResetRequests){state.passwordResetRequests=[]; changed=true;}
  if(!state.discountApplications){state.discountApplications=[]; changed=true;}
  if(state.discounts && !state.discounts.some(d=>d.title==="영화무료상영권")){
    state.discounts.push({id:"movie_ticket",category:"문화",title:"영화무료상영권",rate:"무료",method:"선착순 5명 신청 접수 후 관리자 확인",link:"",applyEnabled:true,limitCount:5});
    changed=true;
  }
  if(state.discounts){
    state.discounts=state.discounts.map(d=>({...d, applyEnabled:d.applyEnabled||false, limitCount:d.limitCount||0}));
  }
  if(!state.auditLogs){state.auditLogs=[]; changed=true;}
  if(!state.roomBlocks){state.roomBlocks=[]; changed=true;}
  if(!state.seasonRates){state.seasonRates=[
    {id:"weekday",name:"평일",type:"weekday",surchargeRate:0,enabled:true},
    {id:"weekend",name:"주말",type:"weekend",surchargeRate:50,enabled:true},
    {id:"peak",name:"성수기",type:"dateRange",start:"2026-07-20",end:"2026-08-20",surchargeRate:70,enabled:true},
    {id:"holiday",name:"명절",type:"dateRange",start:"2026-09-24",end:"2026-09-30",surchargeRate:100,enabled:true}
  ]; changed=true;}
  if(state.rooms&&!state.rooms[0].photos){state.rooms=state.rooms.map(r=>({...r,photos:[]})); changed=true;}
  if(!state.settings.logoUrl){state.settings.logoUrl="logo.gif"; changed=true;}
  if(!state.settings.homeBadge){state.settings.homeBadge="Company Welfare Platform"; changed=true;}
  if(!state.settings.homeTitle){state.settings.homeTitle="회원 승인형 회사 복지몰"; changed=true;}
  if(!state.settings.homeDescription){state.settings.homeDescription="경조사·휴가지원사업 접수 시 담당자 이메일 발송대기함에 신청 내역이 자동 생성됩니다. 실제 운영 시 SMTP 또는 그룹웨어 메일 API로 연결하면 자동 발송됩니다."; changed=true;}
  if(!state.settings.homeButtons){state.settings.homeButtons=[{id:"hb1",label:"숙소 예약하기",page:"stay"},{id:"hb2",label:"휴가지원사업 신청",page:"vacation"}]; changed=true;}
  if(!state.menuSettings){
    state.menuSettings={
      stay:{name:"숙소예약",enabled:true},
      family:{name:"경조사",enabled:true},
      event:{name:"행사",enabled:true},
      discount:{name:"할인",enabled:true},
      vacation:{name:"휴가지원사업",enabled:true},
      notice:{name:"공지",enabled:true}
    };
    changed=true;
  }
  state.events=(state.events||seed.events).map(e=>({id:e.id||uid(), title:e.title, date:e.date, limit:e.limit||0, memo:e.memo||"", isOpen:e.isOpen!==false}));
  state.discounts=(state.discounts||seed.discounts).map(d=>({id:d.id||uid(), category:d.category||"", title:d.title||"", rate:d.rate||"", method:d.method||"", link:d.link||""}));
  state.notices=(state.notices||seed.notices).map(n=>({id:n.id||uid(), title:n.title||"", important:!!n.important, body:n.body||"", views:n.views||0}));
  
  if(state.condolenceTypes){
    state.condolenceTypes=state.condolenceTypes.map(t=>{
      if(typeof t==="string") return {id:uid(),name:t,amount:0};
      return {...t, amount:Number(t.amount||0)};
    });
    const defaultAmounts={"결혼":300000,"출산":300000,"장례":500000,"생일":0,"기타":0};
    state.condolenceTypes.forEach(t=>{if(!t.amount && defaultAmounts[t.name]) t.amount=defaultAmounts[t.name];});
  }
  if(state.condolences){
    state.condolences=state.condolences.map(c=>({
      ...c,
      position:c.position||"",
      contact:c.contact||c.phone||"",
      condolenceContent:c.condolenceContent||c.memo||"",
      amount:Number(c.amount||c.requestAmount||0),
      targetName:c.targetName||"",
      targetBirth:c.targetBirth||"",
      targetRelation:c.targetRelation||"",
      paymentStatus:c.paymentStatus||"",
      approvedAt:c.approvedAt||"",
      paidAt:c.paidAt||""
    }));
  }
  if(changed) save();
}

function v16DedupeState(){
  if(!state.settings) state.settings={};
  state.settings.condolenceEmail=state.settings.condolenceEmail||"withm1905@withmedical.com";
  state.settings.vacationEmail=state.settings.vacationEmail||"withm1905@withmedical.com";
  state.settings.homeBadge=state.settings.homeBadge||"Company Welfare Platform";
  state.settings.homeTitle=state.settings.homeTitle||"회원 승인형 회사 복지몰";
  state.settings.homeDescription=state.settings.homeDescription||"직원 25명 규모에 맞춘 위드메디컬 복지몰입니다.";
  if(!state.admins || !state.admins.length){
    state.admins=[{id:"a1", name:"김경진", role:"admin", loginId:"with1905", password:"withm*1905", dept:"관리자"}];
  }
  const adminSeen=new Set();
  state.admins=state.admins.filter(a=>{
    const key=a.loginId||a.login_id||a.id;
    if(adminSeen.has(key)) return false;
    adminSeen.add(key);
    if(a.login_id&&!a.loginId) a.loginId=a.login_id;
    return true;
  });
  if(!state.rooms) state.rooms=[];
  state.rooms=state.rooms.map(r=>{
    if(r.name==="솔레동") r.name="솔라동";
    return r;
  });
  const roomByName={};
  state.rooms.forEach(r=>{
    if(!roomByName[r.name]) roomByName[r.name]=r;
  });
  state.rooms=Object.values(roomByName);
  if(!state.rooms.find(r=>r.name==="스텔라동")) state.rooms.push({id:"stella", name:"스텔라동", basePeople:5, maxPeople:8, address:"제주특별자치도 서귀포시 안덕면 사계북로41번길 27-45, 사계펜션", photos:[]});
  if(!state.rooms.find(r=>r.name==="솔라동")) state.rooms.push({id:"solar", name:"솔라동", basePeople:5, maxPeople:8, address:"제주특별자치도 서귀포시 안덕면 사계북로41번길 27-45, 사계펜션", photos:[]});
  state.rooms=state.rooms.filter(r=>r.name==="스텔라동"||r.name==="솔라동");
  state.rooms.forEach(r=>{
    if(!r.photos) r.photos=[];
    if(!r.basePeople) r.basePeople=5;
    if(!r.maxPeople) r.maxPeople=8;
  });
  if(!state.menuSettings){
    state.menuSettings={
      stay:{name:"숙소예약",enabled:true},
      family:{name:"경조사",enabled:true},
      event:{name:"행사",enabled:true},
      discount:{name:"할인",enabled:true},
      vacation:{name:"휴가지원사업",enabled:true},
      notice:{name:"공지",enabled:true}
    };
  }
}

function scheduleCloudSave(){
  if(!supabaseClient || !cloudReady || cloudHydrating) return;
  clearTimeout(cloudSaveTimer);
  cloudSaveTimer=setTimeout(saveCloudState,500);
}

async function saveCloudState(){
  if(!supabaseClient || cloudHydrating) return;
  try{
    v16DedupeState();
    const payload=JSON.parse(JSON.stringify(state));
    const {error}=await supabaseClient.from("app_state").upsert({
      id:"main",
      data:payload,
      updated_at:new Date().toISOString()
    });
    if(error) throw error;
    cloudStatus="Supabase 저장 완료";
  }catch(err){
    console.error("Supabase 저장 실패",err);
    cloudStatus="Supabase 저장 실패";
  }
}

async function initCloudSync(){
  if(!supabaseClient){
    cloudStatus="Supabase 미연결";
    v16DedupeState();
    render();
    toast("Supabase 미연결: 로컬 테스트 모드입니다.");
    return;
  }
  try{
    const {data,error}=await supabaseClient.from("app_state").select("data,updated_at").eq("id","main").maybeSingle();
    if(error) throw error;
    if(data && data.data && Object.keys(data.data).length){
      cloudHydrating=true;
      state=data.data;
      v16DedupeState();
      migrate();
      localStorage.setItem("with_welfare_v5",JSON.stringify(state));
      cloudHydrating=false;
      cloudReady=true;
      cloudStatus="Supabase 연결 완료";
      render();
      toast("Supabase 연결 완료");
    }else{
      v16DedupeState();
      cloudReady=true;
      cloudStatus="초기 데이터 저장";
      await saveCloudState();
      render();
      toast("초기 데이터를 Supabase에 저장했습니다.");
    }
  }catch(err){
    cloudHydrating=false;
    console.error("Supabase 연결 실패",err);
    cloudStatus="Supabase 연결 실패";
    v16DedupeState();
    render();
    toast("Supabase 연결 실패: URL/키/RLS를 확인해 주세요.");
  }
}

function v16CloudStatusPanel(){
  const urlOk=!!SUPABASE_URL && SUPABASE_URL.includes(".supabase.co") && !SUPABASE_URL.includes("/rest/v1");
  const keyOk=!!SUPABASE_KEY && (SUPABASE_KEY.startsWith("sb_publishable_") || SUPABASE_KEY.startsWith("eyJ"));
  return `<div class="panel" style="margin-bottom:16px">
    <h3>운영 연결 상태</h3>
    <p class="muted">상태: <b>${cloudStatus}</b></p>
    <p class="muted">SUPABASE_URL: ${urlOk?"정상":"확인 필요"} ${SUPABASE_URL?`<br><small>${SUPABASE_URL}</small>`:""}</p>
    <p class="muted">SUPABASE_ANON_KEY: ${keyOk?"입력됨":"확인 필요"}</p>
  </div>`;
}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7);}
function money(n){return Number(n||0).toLocaleString()+"원";}
function toast(msg){const t=document.createElement("div");t.className="toast";t.innerText=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),2500);}
function user(){if(!session)return null;if(session.role==="admin")return state.admins.find(a=>a.id===session.id);return state.users.find(u=>u.id===session.id);}
function setPage(p){if(!ensureEnabledPage(p)){toast("현재 비활성화된 메뉴입니다.");return;}page=p;render();scrollTo(0,0);}
function logout(){session=null;localStorage.removeItem("with_session_v5");render();}

function onlyDigits(v){return String(v||"").replace(/\D/g,"");}
function isValidMobile(v){const p=onlyDigits(v);return /^01[0-9]{8,9}$/.test(p);}
function loginUser(e){
  e.preventDefault();
  const f=new FormData(e.target);
  const phone=onlyDigits(f.get("phone"));
  if(!isValidMobile(phone)) return toast("휴대폰 번호는 하이픈 없이 10~11자리 숫자로 입력해 주세요.");
  const u=state.users.find(x=>x.name===f.get("name")&&onlyDigits(x.phone)===phone&&x.password===f.get("password"));
  if(!u)return toast("로그인 정보가 일치하지 않습니다.");
  if(u.status!=="가입승인")return toast("관리자 가입 승인 후 로그인 가능합니다.");
  session={id:u.id,role:"user"};
  localStorage.setItem("with_session_v5",JSON.stringify(session));
  render();
}
function loginAdmin(e){e.preventDefault();const f=new FormData(e.target);const a=state.admins.find(x=>x.loginId===f.get("id")&&x.password===f.get("password"));if(!a)return toast("관리자 ID 또는 비밀번호가 일치하지 않습니다.");session={id:a.id,role:"admin"};localStorage.setItem("with_session_v5",JSON.stringify(session));render();}
function signup(e){
  e.preventDefault();
  const f=new FormData(e.target);
  const phone=onlyDigits(f.get("phone"));
  const empNo=String(f.get("empNo")||"").trim();
  const password=f.get("password");
  const passwordConfirm=f.get("passwordConfirm");
  if(!isValidMobile(phone)) return toast("휴대폰 번호는 하이픈 없이 10~11자리 숫자로 입력해 주세요.");
  if(password!==passwordConfirm) return toast("비밀번호와 비밀번호 확인이 일치하지 않습니다.");
  if(state.users.some(u=>onlyDigits(u.phone)===phone || (empNo && u.empNo===empNo))) return toast("이미 등록된 휴대폰 번호 또는 사원번호입니다.");
  state.users.push({id:uid(),name:f.get("name"),empNo,birth:f.get("birth"),phone,password,role:"user",dept:f.get("dept")||"",status:"가입대기",createdAt:new Date().toLocaleString()});
  save();
  toast("회원가입 신청 완료. 관리자 승인 후 로그인 가능합니다.");
  loginTab="user";
  render();
}

function requestPasswordReset(e){
  e.preventDefault();
  const f=new FormData(e.target);
  const phone=onlyDigits(f.get("phone"));
  if(!isValidMobile(phone)) return toast("휴대폰 번호는 하이픈 없이 10~11자리 숫자로 입력해 주세요.");
  const u=state.users.find(x=>x.name===f.get("name")&&onlyDigits(x.phone)===phone);
  if(!u) return toast("등록된 회원 정보를 찾을 수 없습니다.");
  if(!state.passwordResetRequests) state.passwordResetRequests=[];
  if(state.passwordResetRequests.some(r=>r.userId===u.id&&r.status==="요청")) return toast("이미 처리 대기 중인 초기화 요청이 있습니다.");
  state.passwordResetRequests.push({id:uid(),userId:u.id,userName:u.name,dept:u.dept||"",phone:u.phone,status:"요청",createdAt:new Date().toLocaleString(),processedAt:""});
  save();
  toast("비밀번호 초기화 요청이 접수되었습니다.");
  loginTab="user";
  render();
}
function loginView(){
  app.innerHTML=`<div class="loginbox panel">
    <div class="brand"><div class="logo">${state.settings.logoUrl?`<img src="${state.settings.logoUrl}">`:`W`}</div><div><b>WITH Welfare Mall</b><small>(주)위드메디컬 복지몰</small></div></div>
    <h1>복지몰 로그인</h1>
    <div class="tabs">
      <button class="${loginTab==='user'?'active':''}" onclick="loginTab='user';render()">직원 로그인</button>
      <button class="${loginTab==='signup'?'active':''}" onclick="loginTab='signup';render()">회원가입</button>
      <button class="${loginTab==='reset'?'active':''}" onclick="loginTab='reset';render()">비밀번호 초기화</button>
      <button class="${loginTab==='admin'?'active':''}" onclick="loginTab='admin';render()">관리자</button>
    </div>
    ${loginTab==='user'?`<form class="form" onsubmit="loginUser(event)">
      <label class="wide">이름<input name="name" required></label>
      <label class="wide">휴대폰 번호<input name="phone" placeholder="01012345678" inputmode="numeric" pattern="[0-9]{10,11}" required></label>
      <label class="wide">비밀번호<input type="password" name="password" required></label>
      <button class="wide">직원 로그인</button>
      <p class="wide muted">휴대폰 번호는 하이픈(-) 없이 숫자만 입력해 주세요.</p>
    </form>`:""}
    ${loginTab==='signup'?`<form class="form" onsubmit="signup(event)">
      <label>이름<input name="name" required></label>
      <label>사원번호 <span class="muted">(선택)</span><input name="empNo" placeholder="선택 입력"></label>
      <label>생년월일<input type="date" name="birth" required></label>
      <label>휴대폰 번호<input name="phone" placeholder="01012345678" inputmode="numeric" pattern="[0-9]{10,11}" required></label>
      <label>부서<input name="dept"></label>
      <label>비밀번호<input type="password" name="password" required></label>
      <label class="wide">비밀번호 확인<input type="password" name="passwordConfirm" required></label>
      <button class="wide">회원가입 신청</button>
      <p class="wide muted">휴대폰 번호는 하이픈(-) 없이 숫자만 입력해 주세요. 사원번호는 선택 입력입니다.</p>
    </form>`:""}
    ${loginTab==='reset'?`<form class="form" onsubmit="requestPasswordReset(event)">
      <label class="wide">이름<input name="name" required></label>
      <label class="wide">휴대폰 번호<input name="phone" placeholder="01012345678" inputmode="numeric" pattern="[0-9]{10,11}" required></label>
      <button class="wide">비밀번호 초기화 요청</button>
      <p class="wide muted">관리자가 요청을 확인한 후 임시 비밀번호로 변경해 줍니다.</p>
    </form>`:""}
    ${loginTab==='admin'?`<form class="form" onsubmit="loginAdmin(event)">
      <label class="wide">관리자 ID<input name="id" required></label>
      <label class="wide">비밀번호<input type="password" name="password" required></label>
      <button class="wide">관리자 로그인</button>
    </form>`:""}
  </div>`;
}

function toggleMobileMore(){
  const m=document.getElementById("mobileMoreSheet");
  if(m) m.classList.toggle("show");
}
function closeMobileMore(){
  const m=document.getElementById("mobileMoreSheet");
  if(m) m.classList.remove("show");
}
function goMobile(p){
  closeMobileMore();
  setPage(p);
}
function mobileBottomNav(){
  if(!session) return "";
  const isAdmin=user() && user().role==="admin";
  const moreItems=[
    {key:"discount",name:pageLabel("discount"),show:ensureEnabledPage("discount")},
    {key:"vacation",name:pageLabel("vacation"),show:ensureEnabledPage("vacation")},
    {key:"notice",name:pageLabel("notice"),show:ensureEnabledPage("notice")},
    {key:isAdmin?"admin":"mypage",name:isAdmin?"관리자":"내 정보",show:true}
  ].filter(x=>x.show);
  return `<div id="mobileMoreSheet" class="mobile-more-sheet">
    <div class="mobile-more-head"><b>더보기</b><button onclick="closeMobileMore()">닫기</button></div>
    ${moreItems.map(i=>`<button onclick="goMobile('${i.key}')">${i.name}</button>`).join("")}
    <button class="danger" onclick="logout()">로그아웃</button>
  </div>
  <nav class="mobile-bottom-nav">
    <button class="${page==='home'?'active':''}" onclick="goMobile('home')"><span>⌂</span><small>홈</small></button>
    <button class="${page==='stay'?'active':''}" onclick="goMobile('stay')"><span>🏡</span><small>숙소</small></button>
    <button class="${page==='family'?'active':''}" onclick="goMobile('family')"><span>🎁</span><small>경조사</small></button>
    <button class="${page==='event'?'active':''}" onclick="goMobile('event')"><span>🎉</span><small>행사</small></button>
    <button onclick="toggleMobileMore()"><span>☰</span><small>더보기</small></button>
  </nav>`;
}

function layout(content){const u=user();return `<div class="top"><div class="topin"><div class="brand"><div class="logo">${state.settings.logoUrl?`<img src="${state.settings.logoUrl}">`:`W`}</div><div><b>WITH Welfare Mall</b><small>${u.name} · ${u.role==="admin"?"관리자":"임직원"}</small></div></div><div class="nav">${navItems().map(item=>`<button class="${page===item.key?'active':''}" onclick="setPage('${item.key}')">${item.name}</button>`).join("")}${u.role==="admin"?`<button class="${page==='admin'?'active':''}" onclick="setPage('admin')">관리자</button>`:`<button class="${page==='mypage'?'active':''}" onclick="setPage('mypage')">내 정보</button>`}<button class="gray" onclick="logout()">로그아웃</button></div></div></div><div class="wrap">${content}</div>${mobileBottomNav()}<div class="footer">WITH Welfare Mall · 제주 사계펜션 복지몰</div>`;}


function navItems(){
  const base=[{key:"home",name:"홈",enabled:true}];
  const keys=["stay","family","event","discount","notice"];
  keys.forEach(k=>{
    const m=state.menuSettings?.[k]||{name:k,enabled:true};
    if(m.enabled) base.push({key:k,name:m.name,enabled:true});
  });
  return base;
}
function pageLabel(key){
  if(key==="home") return "홈";
  return state.menuSettings?.[key]?.name || key;
}
function ensureEnabledPage(p){
  if(p==="home"||p==="admin"||p==="mypage") return true;
  return state.menuSettings?.[p]?.enabled!==false;
}
function calcNights(a,b){return Math.max(0,Math.round((new Date(b)-new Date(a))/(1000*60*60*24)));}
function annualUsedNights(userId, year=new Date().getFullYear()){return state.reservations.filter(r=>r.userId===userId&&r.status!=="반려"&&r.status!=="취소"&&String(r.checkin).slice(0,4)==String(year)).reduce((s,r)=>s+calcNights(r.checkin,r.checkout),0);}
function overlaps(aStart,aEnd,bStart,bEnd){return aStart<bEnd&&bStart<aEnd;}
function isRoomAvailable(roomId,checkin,checkout){return !isBlocked(roomId,checkin,checkout)&&!state.reservations.some(r=>r.roomId===roomId&&r.status!=="취소"&&r.status!=="반려"&&overlaps(checkin,checkout,r.checkin,r.checkout));}
function getPolicy(name){return state.usePolicies.find(p=>p.name===name)||state.usePolicies[0];}
function calcPrice(useType,nights,checkin,checkout){const p=getPolicy(useType);if(!p||!p.paymentRequired)return 0;const base=(checkin&&checkout)?calcBaseBySeason(checkin,checkout):state.settings.nightlyPrice*nights;const payableRate=100-Number(p.discountRate||0);return Math.round(base*(payableRate/100));}
function makeMail(kind,to,subject,body,attachment){
  // V16 최종 복구판: 이메일 자동발송/발송대기 기능은 사용하지 않습니다.
  return;
}
function audit(action,detail){if(!state.auditLogs)state.auditLogs=[];state.auditLogs.unshift({id:uid(),actor:user()?user().name:"시스템",action,detail,createdAt:new Date().toLocaleString()});state.auditLogs=state.auditLogs.slice(0,300);}
function isBlocked(roomId,checkin,checkout){return (state.roomBlocks||[]).some(b=>b.roomId===roomId&&overlaps(checkin,checkout,b.start,b.end));}
function dateList(checkin,checkout){const arr=[];let d=new Date(checkin),e=new Date(checkout);while(d<e){arr.push(d.toISOString().slice(0,10));d.setDate(d.getDate()+1);}return arr;}
function surchargeForDate(ds){const d=new Date(ds);let rate=0;(state.seasonRates||[]).filter(x=>x.enabled!==false).forEach(r=>{if(r.type==="weekend"&&(d.getDay()===5||d.getDay()===6))rate=Math.max(rate,+r.surchargeRate||0);if(r.type==="dateRange"&&ds>=r.start&&ds<=r.end)rate=Math.max(rate,+r.surchargeRate||0);});return rate;}
function calcBaseBySeason(checkin,checkout){return dateList(checkin,checkout).reduce((s,ds)=>s+Math.round(state.settings.nightlyPrice*(1+surchargeForDate(ds)/100)),0);}

function condolenceTable(rows,admin){
  if(!rows.length) return `<div class="panel empty">신청 내역이 없습니다.</div>`;
  return `<table class="table"><thead><tr>${admin?`<th>선택</th>`:""}<th>신청자</th><th>구분/일자</th><th>내용/대상</th><th>금액</th><th>상태</th><th>증빙</th><th>승인/출력 관리</th></tr></thead><tbody>
  ${rows.map(c=>`<tr>
    ${admin?`<td>${rowCheck('chkCondolence',c.id)}</td>`:""}
    <td>${c.userName||""}<br><span class="muted">${c.dept||""} / ${c.position||""}<br>${c.contact||""}</span></td>
    <td>${c.type||""}<br><span class="muted">${c.eventDate||c.date||""}</span></td>
    <td>${c.condolenceContent||c.memo||""}<br><span class="muted">${c.targetName||""} / ${c.targetRelation||""}</span></td>
    <td>${money(c.amount||0)}</td>
    <td><span class="status ${c.status||"접수"}">${c.status||"접수"}</span>${c.paymentStatus?`<br><span class="status">${c.paymentStatus}</span>`:""}</td>
    <td>${attachmentPreviewLink(c.attachment)}</td>
    <td>${admin?condolenceAdminButtons(c):"-"}</td>
  </tr>`).join("")}</tbody></table>`;
}

function adminDataCleanupPanel(){
  const items=[
    {key:"reservations",label:"숙소 예약 내역",count:(state.reservations||[]).length},
    {key:"condolences",label:"경조사 접수 내역",count:(state.condolences||[]).length},
    {key:"eventApplications",label:"행사 신청 내역",count:(state.eventApplications||state.eventApps||[]).length, alt: state.eventApplications?"eventApplications":"eventApps"},
    {key:"discountApplications",label:"할인 신청 내역",count:(state.discountApplications||[]).length},
    {key:"auditLogs",label:"감사 로그",count:(state.auditLogs||[]).length}
  ];
  return `<div class="panel"><h3>데이터 정리</h3><p class="muted">신청 현황 데이터가 누적될 때 전체삭제할 수 있습니다. 삭제 전 확인창이 표시됩니다.</p>
  <table class="table"><thead><tr><th>항목</th><th>건수</th><th>관리</th></tr></thead><tbody>
    ${items.map(i=>`<tr><td>${i.label}</td><td>${i.count}건</td><td><button class="danger" onclick="clearRows('${i.alt||i.key}','${i.label}')">전체삭제</button></td></tr>`).join("")}
  </tbody></table></div>`;
}

function adminSelectAll(className, checked){
  document.querySelectorAll("." + className).forEach(x=>x.checked=checked);
}
function selectedIds(className){
  return Array.from(document.querySelectorAll("." + className + ":checked")).map(x=>x.value);
}
function deleteRowsByIds(key, ids, label){
  if(!ids.length) return toast("삭제할 항목을 선택해 주세요.");
  if(!confirm(`${label} ${ids.length}건을 삭제할까요? 삭제 후 복구할 수 없습니다.`)) return;
  state[key]=(state[key]||[]).filter(x=>!ids.includes(x.id));
  save();
  toast("선택 항목이 삭제되었습니다.");
  render();
}
function clearRows(key, label){
  const count=(state[key]||[]).length;
  if(!count) return toast("삭제할 내역이 없습니다.");
  if(!confirm(`${label} 전체 ${count}건을 모두 삭제할까요? 삭제 후 복구할 수 없습니다.`)) return;
  state[key]=[];
  save();
  toast(`${label} 전체 내역이 삭제되었습니다.`);
  render();
}
function adminBulkToolbar(key,label,className){
  return `<div class="bulk-toolbar">
    <button class="secondary" onclick="adminSelectAll('${className}',true)">전체선택</button>
    <button class="secondary" onclick="adminSelectAll('${className}',false)">선택해제</button>
    <button class="danger" onclick="deleteRowsByIds('${key}',selectedIds('${className}'),'${label}')">선택삭제</button>
    <button class="danger" onclick="clearRows('${key}','${label}')">전체삭제</button>
  </div>`;
}
function rowCheck(className,id){
  return `<input type="checkbox" class="${className}" value="${id}">`;
}

function adminReservationButtons(r){
  let html="";
  if(r.status==="대기" || r.status==="접수완료"){
    html += `<button onclick="setStatus('reservations','${r.id}','승인')">승인</button><button class="danger" onclick="setStatus('reservations','${r.id}','반려')">반려</button>`;
  }
  if(r.status==="승인"){
    html += `<button class="danger" onclick="adminCancelReservation('${r.id}')">예약취소</button>`;
  }
  if(r.status==="취소"){
    html += `<button class="secondary" onclick="setStatus('reservations','${r.id}','대기')">대기로 복원</button>`;
  }
  return html||"-";
}
function adminCancelReservation(id){
  const r=state.reservations.find(x=>x.id===id);
  if(!r) return toast("예약 정보를 찾을 수 없습니다.");
  if(!confirm("승인된 예약을 취소 처리할까요? 취소 후 해당 날짜는 다시 예약 가능합니다.")) return;
  r.status="취소";
  r.checkinStatus=r.checkinStatus||"관리자 취소";
  if(typeof audit==="function") audit("숙소 예약 관리자 취소",`${r.userName||""} / ${r.roomName||""} / ${r.checkin||""}~${r.checkout||""}`);
  save();
  toast("예약이 취소되었습니다.");
  render();
}
function markCheckin(id){
  const r=state.reservations.find(x=>x.id===id);
  if(!r) return toast("예약을 찾을 수 없습니다.");
  if(r.userId!==user().id) return toast("예약자만 체크인할 수 있습니다.");
  if(r.status!=="승인") return toast("승인된 예약만 체크인할 수 있습니다.");
  r.checkinStatus="체크인 완료";
  audit("숙소 체크인",`${r.userName}/${r.roomName}`);
  save();toast("체크인 완료");render();
}
function markCheckout(id){
  const r=state.reservations.find(x=>x.id===id);
  if(!r) return toast("예약을 찾을 수 없습니다.");
  if(r.userId!==user().id) return toast("예약자만 체크아웃할 수 있습니다.");
  if(r.status!=="승인") return toast("승인된 예약만 체크아웃할 수 있습니다.");
  r.checkinStatus="체크아웃 완료";
  audit("숙소 체크아웃",`${r.userName}/${r.roomName}`);
  save();toast("체크아웃 완료");render();
}
function validateFile(input){
  const file=input.files && input.files[0];
  if(!file) return {ok:true, name:""};
  if(!ALLOWED_FILES.includes(file.type)) return {ok:false, msg:"PDF 또는 이미지 파일만 첨부 가능합니다."};
  if(file.size>MAX_FILE_SIZE) return {ok:false, msg:"첨부파일은 500KB 이하만 가능합니다."};
  return {ok:true, name:file.name};
}



function showApprovedRoomManual(reservationId){
  const r=state.reservations.find(x=>x.id===reservationId && x.userId===user().id && x.status==="승인");
  if(!r) return toast("승인된 예약자만 숙소 사용 설명을 볼 수 있습니다.");
  const room=state.rooms.find(x=>x.id===r.roomId);
  alert(`[${r.roomName} 사용 설명]\n\n${room && room.manual ? room.manual : "관리자가 아직 사용 설명을 등록하지 않았습니다."}`);
}
function approvedReservationCards(){
  if(!user() || user().role==="admin") return "";
  const rows=state.reservations.filter(r=>r.userId===user().id && r.status==="승인");
  if(!rows.length) return "";
  return `<section class="section"><h2>승인된 숙소 예약</h2><div class="grid2">${rows.map(r=>{
    let action="";
    if(!r.checkinStatus || r.checkinStatus==="미체크인" || r.checkinStatus==="이용대기"){
      action+=`<button onclick="markCheckin('${r.id}')">체크인</button>`;
    }else if(r.checkinStatus==="체크인 완료"){
      action+=`<button onclick="markCheckout('${r.id}')">체크아웃</button>`;
    }
    action+=` <button class="secondary" onclick="showApprovedRoomManual('${r.id}')">숙소 사용 설명</button>`;
    return `<div class="card"><h3>${r.roomName}</h3><p>${r.checkin} ~ ${r.checkout}</p><p><span class="status">${r.checkinStatus||"이용대기"}</span></p><div class="actions">${action}</div></div>`;
  }).join("")}</div></section>`;
}

function dashboardCounts(){
  const u=user();
  const myReservations = u.role==="admin" ? state.reservations.length : state.reservations.filter(r=>r.userId===u.id).length;
  const myCondolences = u.role==="admin" ? state.condolences.length : state.condolences.filter(r=>r.userId===u.id).length;
  const myVacations = 0;
  const eventApps = u.role==="admin" ? state.eventApplications.length : state.eventApplications.filter(r=>r.userId===u.id).length;
  return {myReservations,myCondolences,myVacations,eventApps};
}
function adminQuickStats(){
  return {
    joinPending: state.users.filter(u=>u.status==="가입대기").length,
    reservationPending: state.reservations.filter(r=>r.status==="대기").length,
    condolenceCount: state.condolences.length,
    vacationCount: 0,
    mailCount: 0,
    eventApps: state.eventApplications.length,
    activeUsers: state.users.filter(u=>u.status==="가입승인").length,
    payAmount: state.reservations.reduce((s,r)=>s+(r.status!=="반려"&&r.status!=="취소"?Number(r.amount||0):0),0)
  };
}
function roomUsageSummary(){
  const year=String(new Date().getFullYear());
  return state.rooms.map(room=>{
    const nights=state.reservations.filter(r=>r.roomId===room.id&&r.status!=="반려"&&r.status!=="취소"&&String(r.checkin).slice(0,4)===year).reduce((s,r)=>s+calcNights(r.checkin,r.checkout),0);
    const rate=Math.min(100,Math.round(nights/365*100));
    return {room,nights,rate};
  });
}
function home(){
  const u=user();
  const c=dashboardCounts();
  const used=u.role==="admin"?0:annualUsedNights(u.id);
  const limit=state.settings.annualNightLimit||10;
  const usedRate=u.role==="admin"?0:Math.min(100,Math.round((used/limit)*100));
  const buttons=(state.settings.homeButtons||[]).filter(b=>b.label&&b.page&&ensureEnabledPage(b.page)).map((b,i)=>`<button class="${i===0?'':'secondary'}" onclick="setPage('${b.page}')">${b.label}</button>`).join(" ");
  const featureItems=[
    ["stay","🏡",pageLabel("stay"),"제주 사계펜션 예약 및 사용 현황"],
    ["family","🎁",pageLabel("family"),"경조사 신청 및 접수 내역"],
    ["event","🎉",pageLabel("event"),"사내 행사 참여 신청"],
    ["discount","🏷️",pageLabel("discount"),"제휴 할인 혜택 안내"],

    ["notice","📢",pageLabel("notice"),"복지몰 공지 확인"]
  ].filter(x=>ensureEnabledPage(x[0]));
  return layout(`<section class="dashboard-hero">
    <div class="welcome-card">
      <span class="badge">${state.settings.homeBadge||""}</span>
      <h1>${state.settings.homeTitle||""}</h1>
      <p class="muted">${state.settings.homeDescription||""}</p>
      <div class="welcome-actions">${buttons}</div>
    </div>
    <div class="profile-card">
      <b>${u.name}님, 안녕하세요.</b>
      <p class="muted">${u.role==="admin"?"관리자":"임직원"} 계정</p>
      ${u.role==="admin"?`<div class="kpi-card"><small>관리자 모드</small><strong>운영중</strong></div>`:`<div><small class="muted">올해 숙소 사용</small><div class="kpi">${used} / ${limit}박</div><div class="progressbar"><span style="width:${usedRate}%"></span></div></div>`}
    </div>
  </section>
  <section class="kpi-row">
    <div class="kpi-card"><small>숙소 예약</small><strong>${c.myReservations}</strong></div>
    <div class="kpi-card"><small>경조사</small><strong>${c.myCondolences}</strong></div>
    <div class="kpi-card"><small>행사 신청</small><strong>${c.eventApps}</strong></div>
    
  </section>
  ${approvedReservationCards()}
  <section class="feature-grid">
    ${featureItems.map(x=>`<div class="feature-card"><div class="icon">${x[1]}</div><h3>${x[2]}</h3><p class="muted">${x[3]}</p><button onclick="setPage('${x[0]}')">바로가기</button></div>`).join("")}
  </section>
  <section class="section"><h2>숙소 이용 현황</h2><div class="room-status-grid">${roomUsageSummary().map(r=>`<div class="room-status"><span class="pill">${new Date().getFullYear()}</span><p class="room-name">${r.room.name}</p><p class="muted">누적 예약 ${r.nights}박</p><div class="progressbar"><span style="width:${r.rate}%"></span></div></div>`).join("")}</div></section>`);
}

function roomMainPhoto(roomId){
  const r=state.rooms.find(x=>x.id===roomId);
  return r && r.photos && r.photos.length ? r.photos[0].data : "";
}
function roomPhotoBlock(room){
  const photo=roomMainPhoto(room.id);
  return photo
    ? `<div class="room-photo"><img src="${photo}" alt="${room.name}"></div>`
    : `<div class="room-img ${room.id}">${room.name}</div>`;
}
function stay(){const u=user();const used=u.role==="admin"?0:annualUsedNights(u.id);return layout(`<section class="section"><h2>제주 사계펜션 숙소 예약</h2><p class="muted">스텔라동 / 솔라동 2개 동 운영 · 각 동 기본 5명 · 추가 인원 입력 가능 · 직원당 연간 ${state.settings.annualNightLimit}박 기준</p><div class="grid2">${state.rooms.map(r=>`<div class="card room-card">${roomPhotoBlock(r)}<div class="room-body"><h3>${r.name}</h3><p class="muted">기본 ${r.basePeople}명 · 최대 ${r.maxPeople}명</p><button onclick="showReserve('${r.id}')">예약 신청</button></div></div>`).join("")}</div></section><section class="section panel"><div class="cal-head"><h2>예약 현황 캘린더</h2><div><button class="secondary" onclick="moveMonth(-1)">이전</button> <b>${calDate.getFullYear()}년 ${calDate.getMonth()+1}월</b> <button class="secondary" onclick="moveMonth(1)">다음</button></div></div>${calendar()}</section><section id="reserveForm" class="section"></section><section class="section"><h2>내 예약 현황</h2><p class="muted">올해 사용/신청 박수: ${used}박 / ${state.settings.annualNightLimit}박</p>${reservationTable(state.reservations.filter(r=>r.userId===u.id),false)}</section>`);}
function moveMonth(n){calDate.setMonth(calDate.getMonth()+n);render();}
function calendar(){const y=calDate.getFullYear(),m=calDate.getMonth();const start=new Date(y,m,1-new Date(y,m,1).getDay());let html=`<div class="calendar">${["일","월","화","수","목","금","토"].map(d=>`<div class="dow">${d}</div>`).join("")}`;for(let i=0;i<42;i++){const d=new Date(start);d.setDate(start.getDate()+i);const ds=d.toISOString().slice(0,10);const out=d.getMonth()!==m;const marks=[];state.reservations.filter(r=>r.status!=="취소"&&r.status!=="반려"&&ds>=r.checkin&&ds<r.checkout).forEach(r=>marks.push(`<span class="mark ${r.roomId}M">${r.roomName} X</span>`));
(state.roomBlocks||[]).filter(b=>ds>=b.start&&ds<b.end).forEach(b=>{const rr=state.rooms.find(x=>x.id===b.roomId);marks.push(`<span class="mark ${b.roomId}M">${rr?rr.name:"숙소"} 차단</span>`);});
html+=`<div class="day ${out?'out':''}"><div class="daynum">${d.getDate()}</div>${marks.join("")}</div>`;}return html+"</div>";}
function showReserve(roomId){const r=state.rooms.find(x=>x.id===roomId);document.getElementById("reserveForm").innerHTML=`<div class="panel"><h2>${r.name} 예약 신청</h2><form class="form" oninput="updateEstimate(this)" onsubmit="submitReservation(event,'${roomId}')"><label>체크인<input type="date" name="checkin" min="${today}" required></label><label>체크아웃<input type="date" name="checkout" min="${today}" required></label><label>이용 구분<select name="useType" required>${state.usePolicies.map(p=>`<option>${p.name}</option>`).join("")}</select></label><label>이용 인원<input type="number" name="people" min="1" max="${r.maxPeople}" value="${r.basePeople}" required></label><label>연락처<input name="phone" value="${user().phone||''}" required></label><label>입금자명<input name="payer" placeholder="입금 필요 시 입력"></label><label class="wide">요청사항<textarea name="memo"></textarea></label><div class="wide pricebox" id="estimate">선택한 조건에 따라 금액이 계산됩니다.</div><div class="wide"><button>예약 신청 제출</button></div></form></div>`;document.getElementById("reserveForm").scrollIntoView({behavior:"smooth"});}
function updateEstimate(form){const nights=calcNights(form.checkin.value,form.checkout.value);const useType=form.useType.value;const p=getPolicy(useType);const price=calcPrice(useType,nights,form.checkin.value,form.checkout.value);const seasonBase=(form.checkin.value&&form.checkout.value)?calcBaseBySeason(form.checkin.value,form.checkout.value):state.settings.nightlyPrice*(nights||0);const txt=p.paymentRequired?`${p.name}: 시즌요금 ${money(seasonBase)} 기준 할인율 ${p.discountRate}% 적용 · 예상 입금액 ${money(price)} · 입금계좌 ${state.settings.bankName} ${state.settings.bankAccount} ${state.settings.bankHolder}`:`${p.name}: 무료 적용 조건입니다. 예상 ${nights||0}박`;document.getElementById("estimate").innerText=txt;}
function submitReservation(e,roomId){e.preventDefault();const f=new FormData(e.target);const checkin=f.get("checkin"),checkout=f.get("checkout"),people=Number(f.get("people")),useType=f.get("useType");const room=state.rooms.find(r=>r.id===roomId);const nights=calcNights(checkin,checkout);if(nights<=0)return toast("체크아웃은 체크인 이후 날짜여야 합니다.");if(people>room.maxPeople)return toast(`${room.name} 최대 인원은 ${room.maxPeople}명입니다.`);if(isBlocked(roomId,checkin,checkout))return toast("해당 기간은 예약 차단 기간입니다.");if(!isRoomAvailable(roomId,checkin,checkout))return toast("해당 기간은 이미 예약되어 있습니다.");const used=annualUsedNights(user().id,checkin.slice(0,4));if(used+nights>state.settings.annualNightLimit)return toast(`직원당 연간 ${state.settings.annualNightLimit}박 기준을 초과합니다. 현재 ${used}박 사용/신청 중입니다.`);const amount=calcPrice(useType,nights,checkin,checkout);const policy=getPolicy(useType);state.reservations.push({id:uid(),userId:user().id,userName:user().name,dept:user().dept||"",roomId,roomName:room.name,checkin,checkout,nights,people,extraPeople:Math.max(0,people-room.basePeople),useType,discountRate:policy.discountRate,paymentRequired:policy.paymentRequired,amount,bankInfo:`${state.settings.bankName} ${state.settings.bankAccount} ${state.settings.bankHolder}`,phone:f.get("phone"),payer:f.get("payer"),memo:f.get("memo"),status:"대기",checkinStatus:"이용대기",createdAt:new Date().toLocaleString()});audit("숙소 예약 신청",`${user().name}/${room.name}/${checkin}~${checkout}`);save();toast("예약 신청이 접수되었습니다.");setPage("stay");}
function reservationTable(rows,admin){
  if(!rows.length)return`<div class="panel empty">예약 내역이 없습니다.</div>`;
  return`<table class="table"><thead><tr>${admin?`<th>선택</th>`:""}<th>숙소</th><th>신청자</th><th>기간</th><th>구분/금액</th><th>인원</th><th>상태</th><th>관리</th></tr></thead><tbody>${rows.map(r=>`<tr>${admin?`<td>${rowCheck('chkReservation',r.id)}</td>`:""}<td>${r.roomName}</td><td>${r.userName}<br><span class="muted">${r.dept||""}</span></td><td>${r.checkin} ~ ${r.checkout}<br><b>${r.nights||calcNights(r.checkin,r.checkout)}박</b></td><td>${r.useType||"-"}<br>${r.amount?`<b>${money(r.amount)}</b><br><span class="muted">${r.bankInfo||""}</span>`:"무료"}</td><td>${r.people}명${r.extraPeople?`<br><span class="muted">추가 ${r.extraPeople}명</span>`:""}</td><td><span class="status ${r.status}">${r.status}</span><br><span class="muted">${r.status==="승인"?(r.checkinStatus||"이용대기"):""}</span></td><td class="actions">${admin?adminReservationButtons(r):userReservationButtons(r)}</td></tr>`).join("")}</tbody></table>`;
}

function userReservationButtons(r){
  if(!r) return "-";
  let html="";
  if(r.status==="대기" || r.status==="접수완료"){
    html+=`<button class="danger" onclick="userCancel('reservations','${r.id}')">취소</button>`;
  }
  if(r.status==="승인"){
    if(!r.checkinStatus || r.checkinStatus==="미체크인" || r.checkinStatus==="이용대기"){
      html+=`<button onclick="markCheckin('${r.id}')">체크인</button>`;
    }else if(r.checkinStatus==="체크인 완료"){
      html+=`<button onclick="markCheckout('${r.id}')">체크아웃</button>`;
    }
    html+=`<button class="secondary" onclick="showApprovedRoomManual('${r.id}')">사용 설명</button>`;
  }
  return html||"-";
}

function userCancelButton(type,id,status){
  return userReservationButtons(state[type].find(x=>x.id===id));
}
function userCancel(type,id){state[type].find(x=>x.id===id).status="취소";save();toast("취소 처리되었습니다.");render();}

function commonAdminButtons(type,id){
  return `<button onclick="setStatus('${type}','${id}','승인')">승인</button><button class="danger" onclick="setStatus('${type}','${id}','반려')">반려</button><button class="danger" onclick="deleteOne('${type}','${id}')">삭제</button>`;
}
function deleteOne(type,id){
  if(!confirm("삭제할까요?")) return;
  state[type]=state[type].filter(x=>x.id!==id);
  save();toast("삭제되었습니다.");render();
}

function adminButtons(type,id,status){
  return commonAdminButtons(type,id);
}
function setStatus(type,id,status){state[type].find(x=>x.id===id).status=status;save();toast(`${status} 처리되었습니다.`);render();}



function getCondolenceTypeId(t){
  return t.id || ("ct_" + String(t.name||t).replace(/\s+/g,"_"));
}
function condolenceAmountByType(type){
  const t=(state.condolenceTypes||[]).find(x=>(typeof x==="string"?x:x.name)===type);
  if(!t) return 0;
  return Number(typeof t==="string"?0:(t.amount||0));
}
function updateCondolenceAmountPreview(sel){
  const form=sel.form;
  const amount=condolenceAmountByType(sel.value);
  if(form && form.amount) form.amount.value=amount;
  const target=document.getElementById("condolenceAmountPreview");
  if(target) target.innerText=money(amount);
}
function typeName(t){return typeof t==="string"?t:t.name;}
function typeAmount(t){return Number(typeof t==="string"?0:(t.amount||0));}
function attachmentPreviewLink(url){
  if(!url) return "-";
  return `<button class="secondary" onclick="openAttachment('${url}')">증빙자료 보기/출력</button>`;
}
function openAttachment(url){
  const w=window.open("", "_blank");
  if(!w) return toast("팝업 차단을 해제해 주세요.");
  const isImg=/\.(png|jpg|jpeg|gif|webp)$/i.test(url) || String(url).startsWith("data:image");
  const isPdf=/\.pdf/i.test(url) || String(url).startsWith("data:application/pdf");
  w.document.write(`<html><head><title>증빙자료</title><style>body{margin:0;padding:20px;font-family:Arial}img{max-width:100%;height:auto}iframe{width:100%;height:90vh;border:0}.bar{margin-bottom:12px}@media print{.bar{display:none}}</style></head><body><div class="bar"><button onclick="window.print()">출력</button></div>${isImg?`<img src="${url}">`:isPdf?`<iframe src="${url}"></iframe>`:`<p>첨부파일을 열 수 있습니다.</p><a href="${url}" target="_blank">${url}</a>`}</body></html>`);
  w.document.close();
}
function printCondolenceForm(id){
  const c=state.condolences.find(x=>x.id===id);
  if(!c) return toast("신청 내역을 찾을 수 없습니다.");
  const printDate=new Date().toLocaleDateString("ko-KR",{year:"numeric",month:"2-digit",day:"2-digit"}).replace(/\. /g,"년 ").replace(".","일");
  const w=window.open("", "_blank");
  if(!w) return toast("팝업 차단을 해제해 주세요.");
  const html=`<!doctype html><html><head><meta charset="utf-8"><title>경조금 지급 신청서</title>
  <style>
    @page{size:A4;margin:14mm}
    body{font-family:"Malgun Gothic",Arial,sans-serif;margin:0;color:#000;background:#fff}
    .printbar{position:fixed;left:0;right:0;top:0;background:#172033;color:white;padding:10px;text-align:center;z-index:5}
    .printbar button{padding:8px 14px;border:0;border-radius:8px;background:#2357d9;color:white;font-weight:800}
    .page{width:190mm;margin:18mm auto 0;position:relative}
    .head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12mm}
    h1{text-align:left;font-size:34px;letter-spacing:2px;margin:6mm 0 0 18mm}
    .approval{border-collapse:collapse;width:62mm;margin-left:auto}
    .approval th,.approval td{border:1px solid #333;text-align:center;height:13mm;font-size:13px}
    h2{font-size:18px;margin:8mm 0 4mm}
    table.form{width:100%;border-collapse:collapse;table-layout:fixed;font-size:15px}
    table.form th,table.form td{border:1px solid #555;height:13mm;padding:3mm;vertical-align:middle}
    table.form th{text-align:center;font-weight:800;background:#fff}
    .center{text-align:center}.note{margin:7mm 0;font-size:14px;line-height:1.8}.request{text-align:center;margin-top:10mm;font-size:16px;font-weight:800}.date{text-align:center;margin-top:10mm;font-size:18px;font-weight:800}.sign{text-align:right;margin-top:16mm;font-size:16px}
    @media print{.printbar{display:none}.page{margin:0 auto}}
  </style></head><body><div class="printbar"><button onclick="window.print()">A4 출력 / PDF 저장</button></div>
  <div class="page">
    <div class="head"><h1>경조금 지급 신청서</h1><table class="approval"><tr><th>신청자</th><th>경영총괄</th></tr><tr><td>${c.userName||""}</td><td></td></tr></table></div>
    <h2>1. 인적사항</h2>
    <table class="form"><tr><th>성 명</th><td>${c.userName||""}</td><th>소 속</th><td>${c.dept||""}</td></tr><tr><th>직 위</th><td>${c.position||""}</td><th>연락처</th><td>${c.contact||""}</td></tr></table>
    <h2>2. 경조사항</h2>
    <table class="form"><tr><th>신청구분</th><td colspan="3" class="center">${c.type||""}</td></tr><tr><th>경조내용</th><td>${c.condolenceContent||""}</td><th>신청금액</th><td>${money(c.amount||0)}</td></tr><tr><th>경조일자</th><td colspan="3" class="center">${c.eventDate||c.date||""}</td></tr><tr><th>경조대상자</th><td colspan="3">- 생년월일 : ${c.targetBirth||""}<br>- 성명 : ${c.targetName||""}<br>- 신청인과의 관계 : ${c.targetRelation||""}</td></tr></table>
    <div class="note">* 근조화환 여부는 경조금 지급 기준을 따른다.<br>* 증빙자료는 별도 첨부파일을 확인한다.</div>
    <div class="request">상기의 내용으로 경조금의 지급을 신청합니다.</div>
    <div class="date">${printDate}</div>
    <div class="sign">신청자 : ${c.userName||""}</div>
  </div></body></html>`;
  w.document.write(html);w.document.close();
}
function family(){
  const u=user();
  const types=(state.condolenceTypes||[]);
  const firstType=types.length?typeName(types[0]):"기타";
  return layout(`<section class="section"><h2>${pageLabel("family")}</h2>
  <div class="panel">
    <h3>경조금 지급 신청</h3>
    <form class="form" onsubmit="submitCondolence(event)">
      <label>성명<input name="userName" value="${u.name}" readonly></label>
      <label>소속<input name="dept" value="${u.dept||""}" readonly></label>
      <label>직위<input name="position" placeholder="예: 사원, 대리, 과장, 전무" required></label>
      <label>연락처<input name="contact" value="${u.phone||""}" required></label>
      <label>신청구분<select name="type" onchange="updateCondolenceAmountPreview(this)">${types.map(t=>`<option value="${typeName(t)}">${typeName(t)}</option>`).join("")}</select></label>
      <label>신청금액<input name="amount" type="number" value="${condolenceAmountByType(firstType)}" readonly></label>
      <label class="wide">경조내용<input name="condolenceContent" placeholder="예: 본인 결혼, 부친상, 자녀 출산 등" required></label>
      <label>경조일자<input type="date" name="eventDate" required></label>
      <label>경조대상자 성명<input name="targetName" required></label>
      <label>경조대상자 생년월일<input type="date" name="targetBirth"></label>
      <label class="wide">신청인과의 관계<input name="targetRelation" placeholder="예: 본인, 배우자, 부, 모, 자녀 등" required></label>
      <label class="wide">증빙자료 첨부 PDF/이미지<input type="file" name="file" accept=".pdf,image/*"></label>
      <p class="wide muted">예상 신청금액: <b id="condolenceAmountPreview">${money(condolenceAmountByType(firstType))}</b> · 증빙자료는 관리자 승인 후 별도 보기/출력 가능합니다.</p>
      <button class="wide">경조사 신청</button>
    </form>
  </div>
  <section class="section"><h2>내 경조사 신청 이력</h2>${condolenceTable(state.condolences.filter(c=>c.userId===u.id),false)}</section>
  </section>`);
}

function submitCondolence(e){
  e.preventDefault();
  const f=new FormData(e.target);
  const file=e.target.file.files[0];
  if(file && file.size>5*1024*1024) return toast("첨부파일은 5MB 이하만 가능합니다.");
  if(file && !(file.type.startsWith("image/") || file.type==="application/pdf")) return toast("PDF 또는 이미지 파일만 첨부 가능합니다.");
  const saveRow=(attachment)=>{
    state.condolences.push({
      id:uid(),
      userId:user().id,
      userName:f.get("userName"),
      dept:f.get("dept"),
      position:f.get("position"),
      contact:f.get("contact"),
      type:f.get("type"),
      amount:Number(f.get("amount")||0),
      condolenceContent:f.get("condolenceContent"),
      eventDate:f.get("eventDate"),
      targetName:f.get("targetName"),
      targetBirth:f.get("targetBirth"),
      targetRelation:f.get("targetRelation"),
      attachment:attachment||"",
      fileName:file?file.name:"",
      status:"접수",
      paymentStatus:"",
      createdAt:new Date().toLocaleString()
    });
    save();
    toast("경조사 신청이 접수되었습니다.");
    render();
  };
  if(file){
    const reader=new FileReader();
    reader.onload=()=>saveRow(reader.result);
    reader.readAsDataURL(file);
  }else{
    saveRow("");
  }
}
function eventPage(){return layout(`<section class="section"><h2>사내 행사 신청</h2><div class="grid2">${state.events.filter(e=>e.isOpen!==false).map(ev=>{const cnt=state.eventApplications.filter(a=>a.eventId===ev.id&&a.status!=="취소").length;const applied=state.eventApplications.find(a=>a.eventId===ev.id&&a.userId===user().id&&a.status!=="취소");return`<div class="card"><span class="badge">${ev.date}</span><h3>${ev.title}</h3><p class="muted">${ev.memo}</p><p>신청 ${cnt}/${ev.limit}명</p>${applied?`<button class="gray" disabled>신청 완료</button>`:`<button onclick="applyEvent('${ev.id}')">참석 신청</button>`}</div>`}).join("")}</div></section>`);}
function applyEvent(id){const ev=state.events.find(e=>e.id===id);const cnt=state.eventApplications.filter(a=>a.eventId===id&&a.status!=="취소").length;if(cnt>=ev.limit)return toast("마감되었습니다.");state.eventApplications.push({id:uid(),eventId:id,type:ev.title,date:ev.date,userId:user().id,userName:user().name,dept:user().dept,status:"접수완료",createdAt:new Date().toLocaleString()});save();toast("행사 신청 완료");render();}

function discountApplyCount(id){
  return (state.discountApplications||[]).filter(a=>a.discountId===id && a.status!=="취소").length;
}
function myDiscountApplied(id){
  return (state.discountApplications||[]).some(a=>a.discountId===id && a.userId===user().id && a.status!=="취소");
}
function applyDiscount(id){
  const d=state.discounts.find(x=>x.id===id);
  if(!d) return toast("할인 항목을 찾을 수 없습니다.");
  if(!d.applyEnabled) {
    if(d.link){ window.open(d.link,"_blank"); return; }
    return toast("관리자가 등록한 이용 방법을 확인해 주세요.");
  }
  if(myDiscountApplied(id)) return toast("이미 신청한 항목입니다.");
  const count=discountApplyCount(id);
  if(d.limitCount && count>=Number(d.limitCount)) return toast("선착순 신청이 마감되었습니다.");
  if(!state.discountApplications) state.discountApplications=[];
  state.discountApplications.push({
    id:uid(),
    discountId:id,
    title:d.title,
    category:d.category,
    userId:user().id,
    userName:user().name,
    dept:user().dept||"",
    phone:user().phone||"",
    status:"접수완료",
    createdAt:new Date().toLocaleString()
  });
  if(typeof audit==="function") audit("할인 신청 접수",`${user().name} / ${d.title}`);
  save();
  toast("신청이 접수되었습니다.");
  render();
}
function discount(){
  return layout(`<section class="section"><h2>${pageLabel("discount")}</h2>
  <p class="muted">제휴 할인과 복지 혜택을 확인하고, 신청형 항목은 이용하기 버튼으로 접수할 수 있습니다.</p>
  <div class="grid4">${state.discounts.map(d=>{
    const count=discountApplyCount(d.id);
    const closed=d.applyEnabled && d.limitCount && count>=Number(d.limitCount);
    const applied=d.applyEnabled && myDiscountApplied(d.id);
    return `<div class="card">
      <span class="badge">${d.category}</span>
      <h3>${d.title}</h3>
      <p>${d.rate}</p>
      <p class="muted">${d.method}</p>
      ${d.applyEnabled?`<p class="muted">신청 현황: ${count}${d.limitCount?` / ${d.limitCount}명`:"명"}</p>`:""}
      <button class="${closed?'gray':''}" ${closed||applied?'disabled':''} onclick="applyDiscount('${d.id}')">${applied?"신청 완료":closed?"마감":"이용하기"}</button>
    </div>`;
  }).join("")}</div>
  <section class="section"><h2>내 할인 신청 내역</h2>${discountApplicationTable((state.discountApplications||[]).filter(a=>a.userId===user().id),false)}</section>
  </section>`);
}
function vacation(){return layout(`<section class="section"><h2>휴가지원사업 신청 접수</h2><p class="muted">신청 즉시 담당자 이메일 발송대기함에 기록됩니다. 별도 승인 절차 없이 접수완료 상태로 저장됩니다.</p><div class="panel"><form class="form" onsubmit="submitVacation(event)"><label>신청자명<input name="name" value="${user().name}" required></label><label>부서<input name="dept" value="${user().dept||''}" required></label><label>연락처<input name="phone" value="${user().phone||''}" required></label><label>첨부파일명<input name="file" placeholder="신청서.pdf"></label><label class="wide">신청 사유<textarea name="reason" required></textarea></label><label class="wide"><input type="checkbox" name="agree" required> 개인정보 수집 및 이용 동의</label><button class="wide">신청 접수</button></form></div></section><section class="section"><h2>내 신청 현황</h2>${genericTable(state.vacationSupport.filter(x=>x.userId===user().id),"vacationSupport",false)}</section>`);}
function submitVacation(e){e.preventDefault();const f=new FormData(e.target);const item={id:uid(),userId:user().id,userName:f.get("name"),dept:f.get("dept"),type:"휴가지원사업",date:today,phone:f.get("phone"),file:f.get("file"),memo:f.get("reason"),status:"접수완료",createdAt:new Date().toLocaleString()};state.vacationSupport.push(item);makeMail("휴가지원사업",state.settings.vacationEmail,`[복지몰] 휴가지원사업 신청 접수 - ${item.userName}`,`신청자: ${item.userName}\n부서: ${item.dept||""}\n연락처: ${item.phone}\n신청사유: ${item.memo}`,item.file);save();toast("휴가지원사업 신청이 접수되고 담당자 이메일 발송대기함에 등록되었습니다.");setPage("vacation");}
function notice(){return layout(`<section class="section"><h2>공지사항</h2><div class="panel">${state.notices.map(n=>`<div class="notice"><div><b>${n.important?"[중요] ":""}${n.title}</b><p class="muted">${n.body}</p></div><div class="muted">조회 ${n.views}</div></div>`).join("")}</div></section>`);}
function genericTable(rows,type,admin){
  if(!rows.length)return`<div class="panel empty">신청 내역이 없습니다.</div>`;
  return`${admin?adminBulkToolbar(type,type==='eventApplications'?'행사 신청 내역':'신청 내역','chkGeneric_'+type):""}<table class="table"><thead><tr>${admin?`<th>선택</th>`:""}<th>구분</th><th>신청자</th><th>일자</th><th>첨부</th><th>상태</th><th>관리</th></tr></thead><tbody>${rows.map(r=>`<tr>${admin?`<td>${rowCheck('chkGeneric_'+type,r.id)}</td>`:""}<td>${r.type||r.title||""}</td><td>${r.userName}<br><span class="muted">${r.dept||""}</span></td><td>${r.date||r.createdAt||""}</td><td>${r.file||"-"}</td><td><span class="status ${r.status}">${r.status}</span></td><td>${admin?commonAdminButtons(type,r.id):"-"}</td></tr>`).join("")}</tbody></table>`;
}
function mypage(){
  const u=user();
  return layout(`<section class="section"><h2>내 정보</h2>
    <div class="group-box">
      <div class="group-section">
        <h3>회원 정보</h3>
        <table class="table"><tbody>
          <tr><th>이름</th><td>${u.name}</td></tr>
          <tr><th>부서</th><td>${u.dept||"-"}</td></tr>
          <tr><th>사원번호</th><td>${u.empNo||"-"}</td></tr>
          <tr><th>휴대폰 번호</th><td>${u.phone}</td></tr>
        </tbody></table>
      </div>
      <div class="group-section">
        <h3>비밀번호 변경</h3>
        <form class="form" onsubmit="changeMyPassword(event)">
          <label>현재 비밀번호<input type="password" name="currentPassword" required></label>
          <label>새 비밀번호<input type="password" name="newPassword" required></label>
          <label class="wide">새 비밀번호 확인<input type="password" name="newPasswordConfirm" required></label>
          <button class="wide">비밀번호 변경</button>
        </form>
      </div>
    </div>
  </section>`);
}
function changeMyPassword(e){
  e.preventDefault();
  const f=new FormData(e.target);
  const u=state.users.find(x=>x.id===session.id);
  if(!u) return toast("회원 정보를 찾을 수 없습니다.");
  if(u.password!==f.get("currentPassword")) return toast("현재 비밀번호가 일치하지 않습니다.");
  if(f.get("newPassword")!==f.get("newPasswordConfirm")) return toast("새 비밀번호 확인이 일치하지 않습니다.");
  u.password=f.get("newPassword");
  save();
  toast("비밀번호가 변경되었습니다.");
  render();
}
function admin(){
  const tabs=[
    ["adminDashboard","대시보드"],
    ["homeAdmin","홈/메뉴/로고"],
    ["stayAdmin","숙소 관리"],
    ["condolenceAdmin","경조사 관리"],
    ["eventAdminGroup","행사 관리"],
    ["discountAdminGroup","할인 관리"],
    ["noticeAdminGroup","공지 관리"],
    ["memberAdmin","회원/관리자"],
    ["auditLog","감사 로그"],
    ["aiAssistant","AI 비서"],
    ["stats","통계"]
  ];
  let body="";
  if(adminTab==="adminDashboard") body=adminDashboard();
  if(adminTab==="homeAdmin") body=homeAdminGroup();
  if(adminTab==="stayAdmin") body=stayAdminGroup();
  if(adminTab==="condolenceAdmin") body=condolenceAdminGroup();
  if(adminTab==="eventAdminGroup") body=eventAdminGroup();
  if(adminTab==="discountAdminGroup") body=discountAdminGroup();
  if(adminTab==="noticeAdminGroup") body=noticeAdminGroup();
  if(adminTab==="memberAdmin") body=memberAdminGroup();
  if(adminTab==="auditLog") body=auditLogAdmin();
  if(adminTab==="aiAssistant") body=aiAssistantAdmin();
  if(adminTab==="stats") body=stats();
  return layout(`<section class="section">
    <div class="admin-titlebar"><div><h2>관리자 페이지</h2><p class="muted">현재 관리자: ${user().name}</p></div><div><button class="secondary" onclick="exportCSV()">Excel용 CSV</button> <button class="danger" onclick="resetData()">초기화</button></div></div>
    <div class="admin-shell">
      <aside class="admin-side">${tabs.map(t=>`<button class="${adminTab===t[0]?'active':''}" onclick="adminTab='${t[0]}';render()">${t[1]}</button>`).join("")}</aside>
      <main class="admin-main">${body}</main>
    </div>
  </section>`);
}

function adminDashboard(){
  const s=adminQuickStats();
  return `<div class="group-box">
    <div class="admin-quick">
      <div class="admin-stat"><small>가입대기</small><strong>${s.joinPending}</strong></div>
      <div class="admin-stat"><small>예약대기</small><strong>${s.reservationPending}</strong></div>
      
      <div class="admin-stat"><small>회원수</small><strong>${s.activeUsers}</strong></div>
    </div>
    <div class="group-section"><div class="subtle-title"><h3>오늘의 운영 요약</h3><span class="muted">복지몰 전체 현황</span></div>
      <div class="grid4">
        <div class="kpi-card"><small>경조사 접수</small><strong>${s.condolenceCount}</strong></div>
        <div class="kpi-card"><small>행사 신청</small><strong>${s.eventApps}</strong></div>
        <div class="kpi-card"><small>휴가지원 접수</small><strong>${s.vacationCount}</strong></div>
        <div class="kpi-card"><small>입금 예정</small><strong>${money(s.payAmount)}</strong></div>
      </div>
    </div>
    <div class="group-section"><div class="subtle-title"><h3>숙소 예약률</h3><span class="muted">${new Date().getFullYear()}년 기준</span></div>
      <div class="room-status-grid">${roomUsageSummary().map(r=>`<div class="room-status"><p class="room-name">${r.room.name}</p><p class="muted">${r.nights}박 사용 / 예상 예약률 ${r.rate}%</p><div class="progressbar"><span style="width:${r.rate}%"></span></div></div>`).join("")}</div>
    </div>
    <div class="group-section"><div class="subtle-title"><h3>빠른 이동</h3></div>
      <div class="grid4">
        <button onclick="adminTab='memberAdmin';render()">회원 승인</button>
        <button onclick="adminTab='stayAdmin';render()">예약 승인</button>
        <button onclick="adminTab='homeAdmin';render()">홈 수정</button>
        
      </div>
    </div>
  </div>`;
}
function homeAdminGroup(){
  return `<div class="group-box">
    <div class="group-section"><div class="subtle-title"><h3>로고 변경</h3><span class="muted">GIF/PNG/JPG 가능</span></div>
      <div class="brand" style="margin-bottom:14px"><div class="logo">${state.settings.logoUrl?`<img src="${state.settings.logoUrl}">`:`W`}</div><div><b>현재 로고</b><small>이미지를 업로드하면 즉시 반영됩니다.</small></div></div>
      <form class="form" onsubmit="saveLogo(event)">
        <label class="wide">로고 이미지<input type="file" name="logo" accept="image/*" required></label>
        <button class="wide">로고 변경</button>
      </form>
    </div>
    <div class="group-section"><div class="subtle-title"><h3>홈 화면 문구 수정</h3></div>
      <form class="form" onsubmit="saveHomeText(event)">
        <label>상단 배지<input name="homeBadge" value="${state.settings.homeBadge||""}"></label>
        <label>제목<input name="homeTitle" value="${state.settings.homeTitle||""}"></label>
        <label class="wide">설명<textarea name="homeDescription">${state.settings.homeDescription||""}</textarea></label>
        <button class="wide">홈 문구 저장</button>
      </form>
    </div>
    <div class="group-section"><div class="subtle-title"><h3>홈 화면 버튼 관리</h3><span class="muted">예: 숙소 예약하기, 휴가지원사업 신청 등</span></div>
      <form class="form" onsubmit="addHomeButton(event)">
        <label>버튼명<input name="label" required placeholder="예: 예약하기"></label>
        <label>연결 메뉴<select name="page">${navItems().filter(i=>i.key!=="home").map(i=>`<option value="${i.key}">${i.name}</option>`).join("")}</select></label>
        <button class="wide">버튼 추가</button>
      </form>
      <table class="table" style="margin-top:14px"><thead><tr><th>버튼명</th><th>연결 메뉴</th><th>관리</th></tr></thead><tbody>${(state.settings.homeButtons||[]).map(b=>`<tr><td><input id="hbl_${b.id}" value="${b.label}"></td><td><select id="hbp_${b.id}">${navItems().filter(i=>i.key!=="home").map(i=>`<option value="${i.key}" ${b.page===i.key?'selected':''}>${i.name}</option>`).join("")}</select></td><td class="actions"><button onclick="updateHomeButton('${b.id}')">수정</button><button class="danger" onclick="deleteHomeButton('${b.id}')">삭제</button></td></tr>`).join("")}</tbody></table>
    </div>
    <div class="group-section"><div class="subtle-title"><h3>사용자 메뉴명 및 활성/비활성</h3><span class="muted">변경 시 상단 메뉴와 홈 버튼 선택에 반영</span></div>
      ${menuAdminTable()}
    </div>
  </div>`;
}

function menuAdminTable(){
  const keys=["stay","family","event","discount","notice"];
  return `<table class="table"><thead><tr><th>기능</th><th>탭 명칭</th><th>상태</th><th>관리</th></tr></thead><tbody>${keys.map(k=>{const m=state.menuSettings[k];return`<tr><td>${k}</td><td><input id="mn_${k}" value="${m.name}"></td><td><select id="me_${k}"><option value="true" ${m.enabled?'selected':''}>활성</option><option value="false" ${!m.enabled?'selected':''}>비활성</option></select></td><td><button onclick="updateMenu('${k}')">저장</button></td></tr>`}).join("")}</tbody></table>`;
}

function saveLogo(e){
  e.preventDefault();
  const file=e.target.logo.files[0];
  if(!file) return toast("로고 파일을 선택해 주세요.");
  if(!file.type.startsWith("image/")) return toast("이미지 파일만 가능합니다.");
  const reader=new FileReader();
  reader.onload=()=>{state.settings.logoUrl=reader.result;save();toast("로고가 변경되었습니다.");render();};
  reader.readAsDataURL(file);
}
function saveHomeText(e){
  e.preventDefault();
  const f=new FormData(e.target);
  state.settings.homeBadge=f.get("homeBadge");
  state.settings.homeTitle=f.get("homeTitle");
  state.settings.homeDescription=f.get("homeDescription");
  save();toast("홈 화면 문구가 저장되었습니다.");render();
}
function addHomeButton(e){
  e.preventDefault();
  const f=new FormData(e.target);
  if(!state.settings.homeButtons) state.settings.homeButtons=[];
  state.settings.homeButtons.push({id:uid(),label:f.get("label"),page:f.get("page")});
  save();toast("홈 버튼이 추가되었습니다.");render();
}
function updateHomeButton(id){
  const b=state.settings.homeButtons.find(x=>x.id===id);
  b.label=document.getElementById("hbl_"+id).value;
  b.page=document.getElementById("hbp_"+id).value;
  save();toast("홈 버튼이 수정되었습니다.");render();
}
function deleteHomeButton(id){
  state.settings.homeButtons=state.settings.homeButtons.filter(b=>b.id!==id);
  save();toast("홈 버튼이 삭제되었습니다.");render();
}
function updateMenu(key){
  state.menuSettings[key].name=document.getElementById("mn_"+key).value;
  state.menuSettings[key].enabled=document.getElementById("me_"+key).value==="true";
  save();toast("메뉴 설정이 저장되었습니다.");render();
}
function stayAdminGroup(){
  return `<div class="group-box">
    <div class="group-section"><div class="subtle-title"><h3>숙소 예약 승인 현황</h3><span class="muted">승인/반려 처리</span></div>${adminBulkToolbar('reservations','숙소 예약 내역','chkReservation')}${reservationTable(state.reservations,true)}</div>
    <div class="group-section"><div class="subtle-title"><h3>숙소/계좌/메일 기본 설정</h3></div>${settingsAdmin()}</div>
    <div class="group-section"><div class="subtle-title"><h3>숙소 할인 조건 설정</h3></div>${policyAdmin()}</div><div class="group-section"><div class="subtle-title"><h3>숙소 사진 관리</h3></div>${roomPhotoAdmin()}</div><div class="group-section"><div class="subtle-title"><h3>숙소 사용 설명서</h3><span class="muted">승인된 예약자만 홈 화면에서 확인 가능</span></div>${roomManualAdmin()}</div><div class="group-section"><div class="subtle-title"><h3>예약 차단 관리</h3></div>${roomBlockAdmin()}</div><div class="group-section"><div class="subtle-title"><h3>성수기/주말 요금 설정</h3></div>${seasonRateAdmin()}</div>
  </div>`;
}


function condolenceAdminButtons(c){
  let html="";
  const status=c.status||"접수";
  if(status==="접수" || status==="대기"){
    html+=`<button onclick="approveCondolence('${c.id}')">승인</button>`;
    html+=`<button class="danger" onclick="rejectCondolence('${c.id}')">반려</button>`;
  }
  if(status==="승인"){
    html+=`<button onclick="printCondolenceForm('${c.id}')">신청서 출력</button>`;
    html+=`<button class="secondary" onclick="markCondolencePaid('${c.id}')">지급완료</button>`;
    html+=`<button class="danger" onclick="rejectCondolence('${c.id}')">반려</button>`;
  }
  if(status==="반려"){
    html+=`<button class="secondary" onclick="setCondolenceStatus('${c.id}','접수')">접수로 복원</button>`;
  }
  if(status==="지급완료" || c.paymentStatus==="지급완료"){
    html+=`<button onclick="printCondolenceForm('${c.id}')">신청서 출력</button>`;
  }
  if(c.attachment){
    html+=`<button class="secondary" onclick="openAttachment('${c.attachment}')">증빙자료 출력</button>`;
  }
  return `<div class="actions">${html||"-"}</div>`;
}
function setCondolenceStatus(id,status){
  const c=state.condolences.find(x=>x.id===id);
  if(!c) return toast("신청 내역을 찾을 수 없습니다.");
  c.status=status;
  save();
  toast(`${status} 처리되었습니다.`);
  render();
}
function approveCondolence(id){
  const c=state.condolences.find(x=>x.id===id);
  if(!c) return toast("신청 내역을 찾을 수 없습니다.");
  c.status="승인";
  c.approvedAt=new Date().toLocaleString();
  save();
  toast("승인 처리되었습니다.");
  render();
}
function rejectCondolence(id){
  setCondolenceStatus(id,"반려");
}
function markCondolencePaid(id){
  const c=state.condolences.find(x=>x.id===id);
  if(!c) return toast("신청 내역을 찾을 수 없습니다.");
  c.status="지급완료";
  c.paymentStatus="지급완료";
  c.paidAt=new Date().toLocaleString();
  save();
  toast("지급완료 처리되었습니다.");
  render();
}
function condolenceTypeAdmin(){
  const rows=(state.condolenceTypes||[]).map(t=>({...t,amount:Number(t.amount||0)}));
  return`<div class="panel"><h3>경조사 구분 추가</h3><form class="form" onsubmit="addCondolenceType(event)">
    <label>구분명<input name="name" required placeholder="예: 입학, 부모님 생신"></label>
    <label>설명<input name="description"></label>
    <label>신청금액<input type="number" name="amount" value="0" min="0" required></label>
    <button class="wide">구분 추가</button>
  </form></div><section class="section"><h2>경조사 구분 목록 / 신청금액 설정</h2><table class="table"><thead><tr><th>구분명</th><th>설명</th><th>신청금액</th><th>관리</th></tr></thead><tbody>${rows.map(t=>`<tr><td><input id="ctn_${t.id}" value="${t.name}"></td><td><input id="ctd_${t.id}" value="${t.description||t.desc||""}"></td><td><input id="cta_${t.id}" type="number" min="0" value="${t.amount||0}"></td><td class="actions"><button onclick="updateCondolenceType('${t.id}')">수정</button>${state.condolenceTypes.length<=1?``:`<button class="danger" onclick="deleteCondolenceType('${t.id}')">삭제</button>`}</td></tr>`).join("")}</tbody></table></section>`;
}
function addCondolenceType(e){
  e.preventDefault();
  const f=new FormData(e.target);
  const name=f.get("name").trim();
  if(state.condolenceTypes.some(t=>t.name===name))return toast("이미 등록된 구분입니다.");
  state.condolenceTypes.push({id:uid(),name,description:f.get("description")||"",amount:Number(f.get("amount")||0)});
  save();toast("경조사 구분 추가");render();
}
function updateCondolenceType(id){
  const t=state.condolenceTypes.find(x=>x.id===id);
  const name=document.getElementById("ctn_"+id).value.trim();
  if(!name)return toast("구분명을 입력해 주세요.");
  t.name=name;
  t.description=document.getElementById("ctd_"+id).value;
  t.amount=Number(document.getElementById("cta_"+id).value||0);
  save();toast("수정 완료");render();
}
function deleteCondolenceType(id){
  const idx=(state.condolenceTypes||[]).findIndex(x=>getCondolenceTypeId(x)===id);
  if(idx<0) return toast("구분을 찾을 수 없습니다.");
  const name=typeName(state.condolenceTypes[idx]);
  if((state.condolences||[]).some(c=>c.type===name)){
    return toast("신청 내역이 있는 구분은 삭제할 수 없습니다.");
  }
  if(!confirm("해당 경조사 구분을 삭제할까요?")) return;
  state.condolenceTypes.splice(idx,1);
  save();
  toast("삭제되었습니다.");
  render();
}
function condolenceAdminGroup(){
  return `<div class="group-box">
    <div class="group-section">
      <div class="subtle-title"><h3>경조사 구분 관리</h3><span class="muted">구분별 신청금액 설정</span></div>
      ${condolenceTypeAdmin()}
    </div>
    <div class="group-section">
      <div class="subtle-title"><h3>경조사 접수 현황</h3><span class="muted">승인, 반려, 신청서 출력, 증빙자료 출력</span></div>
      ${adminBulkToolbar('condolences','경조사 접수 내역','chkCondolence')}
      ${condolenceTable(state.condolences||[],true)}
    </div>
  </div>`;
}
function eventAdminGroup(){
  return `<div class="group-box">
    <div class="group-section"><div class="subtle-title"><h3>행사 등록 및 수정</h3></div>${eventAdmin()}</div>
    <div class="group-section"><div class="subtle-title"><h3>행사 신청 현황</h3></div>${genericTable(state.eventApplications,"eventApplications",true)}</div>
  </div>`;
}


function discountApplicationTable(rows,admin){
  if(!rows.length) return `<div class="panel empty">신청 내역이 없습니다.</div>`;
  return `<table class="table"><thead><tr>${admin?`<th>선택</th>`:""}<th>혜택명</th><th>신청자</th><th>부서</th><th>연락처</th><th>신청일</th><th>상태</th><th>관리</th></tr></thead><tbody>
    ${rows.map(a=>`<tr>
      ${admin?`<td>${rowCheck('chkDiscountApply',a.id)}</td>`:""}
      <td>${a.title}</td>
      <td>${a.userName}</td>
      <td>${a.dept||""}</td>
      <td>${a.phone||""}</td>
      <td>${a.createdAt||""}</td>
      <td><span class="status ${a.status}">${a.status}</span></td>
      <td>${admin?commonAdminButtons('discountApplications',a.id):"-"}</td>
    </tr>`).join("")}
  </tbody></table>`;
}
function cancelDiscountApplication(id){
  const a=(state.discountApplications||[]).find(x=>x.id===id);
  if(!a) return toast("신청 내역을 찾을 수 없습니다.");
  if(!confirm("해당 할인 신청을 취소 처리할까요?")) return;
  a.status="취소";
  save();
  toast("신청이 취소되었습니다.");
  render();
}
function discountAdmin(embedded=false){
  if(!state.discounts) state.discounts=[];
  if(!state.discountApplications) state.discountApplications=[];
  return `<div class="panel"><h3>할인 항목 추가</h3>
  <form class="form" onsubmit="addDiscount(event)">
    <label>카테고리<input name="category" required></label>
    <label>제목<input name="title" required></label>
    <label>할인 내용<input name="rate" required></label>
    <label>링크<input name="link" placeholder="https://"></label>
    <label>신청 접수 여부<select name="applyEnabled"><option value="false">일반 안내</option><option value="true">신청 접수</option></select></label>
    <label>신청 제한 인원<input type="number" name="limitCount" value="0" min="0"><span class="muted">0은 제한 없음</span></label>
    <label class="wide">이용 방법<textarea name="method"></textarea></label>
    <button class="wide">할인 항목 추가</button>
  </form></div>
  <section class="section"><h2>할인 항목 목록</h2>
  <p class="muted">기존 할인 항목을 바로 수정하거나 삭제할 수 있습니다.</p>
  <table class="table"><thead><tr><th>카테고리</th><th>제목</th><th>할인</th><th>이용방법</th><th>신청/제한</th><th>링크</th><th>관리</th></tr></thead><tbody>
  ${state.discounts.map(d=>`<tr>
    <td><input id="dc_${d.id}" value="${d.category||""}"></td>
    <td><input id="dt_${d.id}" value="${d.title||""}"></td>
    <td><input id="dr_${d.id}" value="${d.rate||""}"></td>
    <td><input id="dm_${d.id}" value="${d.method||""}"></td>
    <td>
      <select id="da_${d.id}"><option value="false" ${!d.applyEnabled?'selected':''}>일반 안내</option><option value="true" ${d.applyEnabled?'selected':''}>신청 접수</option></select>
      <input id="dlm_${d.id}" type="number" min="0" value="${d.limitCount||0}">
      <span class="muted">현재 ${discountApplyCount(d.id)}명</span>
    </td>
    <td><input id="dl_${d.id}" value="${d.link||""}"></td>
    <td class="actions"><button onclick="updateDiscount('${d.id}')">수정</button><button class="danger" onclick="deleteDiscount('${d.id}')">삭제</button></td>
  </tr>`).join("")||`<tr><td colspan="7">등록된 할인 항목이 없습니다.</td></tr>`}
  </tbody></table></section>
  <section class="section"><h2>할인 신청 접수 현황</h2>
  ${adminBulkToolbar('discountApplications','할인 신청 내역','chkDiscountApply')}
  ${discountApplicationTable(state.discountApplications||[],true)}</section>`;
}
function vacationAdminGroup(){
  return `<div class="group-box">
    <div class="group-section"><div class="subtle-title"><h3>휴가지원사업 접수 현황</h3><span class="muted">신청 즉시 접수완료</span></div>${genericTable(state.vacationSupport,"vacationSupport",false)}</div>
    <div class="group-section"><div class="subtle-title"><h3>휴가지원사업 담당자 이메일</h3></div><form class="form" onsubmit="saveVacationEmail(event)"><label class="wide">이메일<input type="email" name="vacationEmail" value="${state.settings.vacationEmail}" required></label><button class="wide">저장</button></form></div>
  </div>`;
}

function noticeAdminGroup(){
  return `<div class="group-box">
    <div class="group-section"><div class="subtle-title"><h3>공지 등록 및 수정</h3></div>${noticeAdmin()}</div>
    <div class="group-section"><div class="subtle-title"><h3>공지 미리보기</h3></div><div class="panel">${state.notices.map(n=>`<div class="notice"><div><b>${n.important?"[중요] ":""}${n.title}</b><p class="muted">${n.body}</p></div><div class="muted">조회 ${n.views}</div></div>`).join("")}</div></div>
  </div>`;
}

function memberAdminGroup(){
  return `<div class="group-box">
    <div class="group-section"><div class="subtle-title"><h3>회원 직접 추가</h3><span class="muted">관리자가 직원 계정을 직접 생성</span></div>${employeeAddForm()}</div>
    <div class="group-section"><div class="subtle-title"><h3>회원 가입 승인/삭제</h3></div>${userAdmin()}</div>
    <div class="group-section"><div class="subtle-title"><h3>비밀번호 초기화 요청</h3></div>${passwordResetAdmin()}</div>
    <div class="group-section"><div class="subtle-title"><h3>관리자 계정 관리</h3></div>${adminManage()}</div>
  </div>`;
}
function employeeAddForm(){
  return `<form class="form" onsubmit="addEmployeeByAdmin(event)">
    <label>이름<input name="name" required></label>
    <label>사원번호 <span class="muted">(선택)</span><input name="empNo" placeholder="선택 입력"></label>
    <label>생년월일<input type="date" name="birth" required></label>
    <label>휴대폰 번호<input name="phone" placeholder="01012345678" inputmode="numeric" pattern="[0-9]{10,11}" required></label>
    <label>부서<input name="dept"></label>
    <label>초기 비밀번호<input name="password" required></label>
    <button class="wide">회원 추가</button>
  </form>`;
}
function addEmployeeByAdmin(e){
  e.preventDefault();
  const f=new FormData(e.target);
  const phone=onlyDigits(f.get("phone"));
  const empNo=String(f.get("empNo")||"").trim();
  if(!isValidMobile(phone)) return toast("휴대폰 번호는 하이픈 없이 10~11자리 숫자로 입력해 주세요.");
  if(state.users.some(u=>onlyDigits(u.phone)===phone || (empNo && u.empNo===empNo))) return toast("이미 등록된 휴대폰 번호 또는 사원번호입니다.");
  state.users.push({id:uid(),name:f.get("name"),empNo,birth:f.get("birth"),phone,password:f.get("password"),role:"user",dept:f.get("dept")||"",status:"가입승인",createdAt:new Date().toLocaleString()});
  save();toast("회원이 추가되었습니다.");render();
}
function deleteUser(id){
  if(state.reservations.some(r=>r.userId===id&&r.status!=="취소"&&r.status!=="반려")) return toast("진행 중인 숙소 예약이 있는 회원은 삭제할 수 없습니다.");
  if(!confirm("해당 회원을 삭제할까요?")) return;
  state.users=state.users.filter(u=>u.id!==id);
  save();toast("회원이 삭제되었습니다.");render();
}

function passwordResetAdmin(){
  const rows=state.passwordResetRequests||[];
  if(!rows.length) return `<div class="panel empty">비밀번호 초기화 요청이 없습니다.</div>`;
  return `<table class="table"><thead><tr><th>요청자</th><th>휴대폰</th><th>요청일</th><th>상태</th><th>임시 비밀번호</th><th>관리</th></tr></thead><tbody>
    ${rows.map(r=>`<tr>
      <td>${r.userName}<br><span class="muted">${r.dept||""}</span></td>
      <td>${r.phone}</td>
      <td>${r.createdAt}</td>
      <td><span class="status ${r.status}">${r.status}</span><br><span class="muted">QR ${r.qrCode||"-"}</span><br><span class="muted">${r.checkinStatus||"미체크인"}</span></td>
      <td>${r.status==="요청"?`<input id="tmp_${r.id}" placeholder="임시 비밀번호 입력">`:`처리완료`}</td>
      <td>${r.status==="요청"?`<button onclick="approvePasswordReset('${r.id}')">비밀번호 변경/승인</button><button class="danger" onclick="rejectPasswordReset('${r.id}')">반려</button>`:"-"}</td>
    </tr>`).join("")}
  </tbody></table>`;
}
function approvePasswordReset(id){
  const r=state.passwordResetRequests.find(x=>x.id===id);
  const pw=document.getElementById("tmp_"+id).value;
  if(!pw) return toast("임시 비밀번호를 입력해 주세요.");
  const u=state.users.find(x=>x.id===r.userId);
  if(!u) return toast("회원 정보를 찾을 수 없습니다.");
  u.password=pw;
  r.status="처리완료";
  r.processedAt=new Date().toLocaleString();
  save();
  toast("비밀번호가 변경되고 요청이 처리완료되었습니다.");
  render();
}
function rejectPasswordReset(id){
  const r=state.passwordResetRequests.find(x=>x.id===id);
  r.status="반려";
  r.processedAt=new Date().toLocaleString();
  save();
  toast("초기화 요청이 반려되었습니다.");
  render();
}
function saveCondolenceEmail(e){e.preventDefault();state.settings.condolenceEmail=new FormData(e.target).get("condolenceEmail");save();toast("경조사 담당자 이메일 저장 완료");render();}
function saveVacationEmail(e){e.preventDefault();state.settings.vacationEmail=new FormData(e.target).get("vacationEmail");save();toast("휴가지원사업 담당자 이메일 저장 완료");render();}
function adminManage(){return`<div class="panel"><h3>관리자 추가</h3><form class="form" onsubmit="addAdmin(event)"><label>관리자 성명<input name="name" required></label><label>관리자 ID<input name="loginId" required></label><label>비밀번호<input type="password" name="password" required></label><label>부서/직책<input name="dept" value="관리자"></label><button class="wide">관리자 추가</button></form></div><section class="section"><h2>관리자 목록</h2><table class="table"><thead><tr><th>성명</th><th>ID</th><th>부서/직책</th><th>관리</th></tr></thead><tbody>${state.admins.map(a=>`<tr><td>${a.name}</td><td>${a.loginId}</td><td>${a.dept||"관리자"}</td><td>${state.admins.length<=1?`최소 1명 필요`:`<button class="danger" onclick="deleteAdmin('${a.id}')">삭제</button>`}</td></tr>`).join("")}</tbody></table></section>`;}
function addAdmin(e){e.preventDefault();const f=new FormData(e.target);const loginId=f.get("loginId").trim();if(state.admins.some(a=>a.loginId===loginId))return toast("이미 사용 중인 관리자 ID입니다.");state.admins.push({id:uid(),name:f.get("name").trim(),role:"admin",loginId,password:f.get("password"),dept:f.get("dept")||"관리자"});save();toast("관리자가 추가되었습니다.");render();}
function deleteAdmin(id){if(state.admins.length<=1)return toast("관리자는 최소 1명 이상 필요합니다.");if(id===session.id)return toast("현재 로그인한 관리자 계정은 삭제할 수 없습니다.");if(!confirm("해당 관리자 계정을 삭제할까요?"))return;state.admins=state.admins.filter(a=>a.id!==id);save();toast("관리자가 삭제되었습니다.");render();}
function userAdmin(){
  return`<table class="table"><thead><tr><th>이름</th><th>사원번호</th><th>생년월일</th><th>전화번호</th><th>부서</th><th>상태</th><th>관리</th></tr></thead><tbody>${state.users.map(u=>`<tr><td>${u.name}</td><td>${u.empNo}</td><td>${u.birth}</td><td>${u.phone}</td><td>${u.dept||""}</td><td><span class="status ${u.status}">${u.status}</span></td><td class="actions">${u.status==="가입대기"?`<button onclick="setUserStatus('${u.id}','가입승인')">승인</button><button class="danger" onclick="setUserStatus('${u.id}','가입반려')">반려</button>`:""}<button class="danger" onclick="deleteUser('${u.id}')">삭제</button></td></tr>`).join("")}</tbody></table>`;
}
function setUserStatus(id,status){state.users.find(u=>u.id===id).status=status;save();toast(status+" 처리");render();}
function settingsAdmin(){
  const s=state.settings;
  return`<div class="panel"><form class="form" onsubmit="saveSettings(event)">
    <label>은행명<input name="bankName" value="${s.bankName}" required></label>
    <label>계좌번호<input name="bankAccount" value="${s.bankAccount}" required></label>
    <label>예금주<input name="bankHolder" value="${s.bankHolder}" required></label>
    <label>숙소 1박 기준 금액<input type="number" name="nightlyPrice" value="${s.nightlyPrice}" required></label>
    <label>직원당 연간 박수 기준<input type="number" name="annualNightLimit" value="${s.annualNightLimit}" required></label>
    <button class="wide">설정 저장</button>
  </form></div>`;
}
function saveSettings(e){
  e.preventDefault();
  const f=new FormData(e.target);
  state.settings={...state.settings,bankName:f.get("bankName"),bankAccount:f.get("bankAccount"),bankHolder:f.get("bankHolder"),nightlyPrice:Number(f.get("nightlyPrice")),annualNightLimit:Number(f.get("annualNightLimit"))};
  save();toast("설정 저장 완료");render();
}
function policyAdmin(){return`<div class="panel"><h3>숙소 할인 조건 추가</h3><form class="form" onsubmit="addPolicy(event)"><label>이용 구분명<input name="name" required></label><label>할인율 %<input type="number" name="discountRate" min="0" max="100" value="0" required></label><label>입금 필요 여부<select name="paymentRequired"><option value="true">입금 필요</option><option value="false">입금 불필요</option></select></label><label>설명<input name="description"></label><button class="wide">할인 조건 추가</button></form></div><section class="section"><h2>할인 조건 목록</h2><table class="table"><thead><tr><th>이용 구분</th><th>할인율</th><th>입금 여부</th><th>설명</th><th>관리</th></tr></thead><tbody>${state.usePolicies.map(p=>`<tr><td><input id="pn_${p.id}" value="${p.name}"></td><td><input id="pr_${p.id}" type="number" min="0" max="100" value="${p.discountRate}">%</td><td><select id="pp_${p.id}"><option value="true" ${p.paymentRequired?'selected':''}>입금 필요</option><option value="false" ${!p.paymentRequired?'selected':''}>입금 불필요</option></select></td><td><input id="pd_${p.id}" value="${p.description||''}"></td><td class="actions"><button onclick="updatePolicy('${p.id}')">수정</button>${state.usePolicies.length<=1?``:`<button class="danger" onclick="deletePolicy('${p.id}')">삭제</button>`}</td></tr>`).join("")}</tbody></table></section>`;}
function addPolicy(e){e.preventDefault();const f=new FormData(e.target);const name=f.get("name").trim();if(state.usePolicies.some(p=>p.name===name))return toast("이미 등록된 이용 구분명입니다.");state.usePolicies.push({id:uid(),name,discountRate:Number(f.get("discountRate")),paymentRequired:f.get("paymentRequired")==="true",description:f.get("description")||""});save();toast("할인 조건 추가");render();}
function updatePolicy(id){const p=state.usePolicies.find(x=>x.id===id);const name=document.getElementById("pn_"+id).value.trim();if(!name)return toast("이용 구분명을 입력해 주세요.");if(state.usePolicies.some(x=>x.id!==id&&x.name===name))return toast("이미 등록된 이용 구분명입니다.");p.name=name;p.discountRate=Number(document.getElementById("pr_"+id).value);p.paymentRequired=document.getElementById("pp_"+id).value==="true";p.description=document.getElementById("pd_"+id).value;save();toast("할인 조건 수정");render();}
function deletePolicy(id){if(state.usePolicies.length<=1)return toast("할인 조건은 최소 1개 이상 필요합니다.");const p=state.usePolicies.find(x=>x.id===id);if(state.reservations.some(r=>r.useType===p.name&&r.status!=="취소"&&r.status!=="반려"))return toast("사용 중인 할인 조건은 삭제할 수 없습니다.");if(!confirm("삭제할까요?"))return;state.usePolicies=state.usePolicies.filter(x=>x.id!==id);save();toast("삭제 완료");render();}

function condolenceTypeAdmin(){return`<div class="panel"><h3>경조사 구분 추가</h3><form class="form" onsubmit="addCondolenceType(event)"><label>구분명<input name="name" required placeholder="예: 입학, 부모님 생신"></label><label>설명<input name="description"></label><button class="wide">구분 추가</button></form></div><section class="section"><h2>경조사 구분 목록</h2><table class="table"><thead><tr><th>구분명</th><th>설명</th><th>관리</th></tr></thead><tbody>${state.condolenceTypes.map(t=>`<tr><td><input id="ctn_${t.id}" value="${t.name}"></td><td><input id="ctd_${t.id}" value="${t.description||''}"></td><td class="actions"><button onclick="updateCondolenceType('${t.id}')">수정</button>${state.condolenceTypes.length<=1?``:`<button class="danger" onclick="deleteCondolenceType('${t.id}')">삭제</button>`}</td></tr>`).join("")}</tbody></table></section>`;}
function addCondolenceType(e){e.preventDefault();const f=new FormData(e.target);const name=f.get("name").trim();if(state.condolenceTypes.some(t=>t.name===name))return toast("이미 등록된 구분입니다.");state.condolenceTypes.push({id:uid(),name,description:f.get("description")||""});save();toast("경조사 구분 추가");render();}
function updateCondolenceType(id){const t=state.condolenceTypes.find(x=>x.id===id);const name=document.getElementById("ctn_"+id).value.trim();if(!name)return toast("구분명을 입력해 주세요.");if(state.condolenceTypes.some(x=>x.id!==id&&x.name===name))return toast("이미 등록된 구분입니다.");t.name=name;t.description=document.getElementById("ctd_"+id).value;save();toast("수정 완료");render();}
function deleteCondolenceType(id){const t=state.condolenceTypes.find(x=>x.id===id);if(state.condolences.some(c=>c.type===t.name))return toast("접수 이력이 있는 구분은 삭제할 수 없습니다.");if(!confirm("삭제할까요?"))return;state.condolenceTypes=state.condolenceTypes.filter(x=>x.id!==id);save();toast("삭제 완료");render();}

function eventAdmin(){return`<div class="panel"><h3>행사 추가</h3><form class="form" onsubmit="addEvent(event)"><label>행사명<input name="title" required></label><label>행사일<input type="date" name="date" required></label><label>신청 제한 인원<input type="number" name="limit" value="30" required></label><label>노출 여부<select name="isOpen"><option value="true">노출</option><option value="false">숨김</option></select></label><label class="wide">안내 내용<textarea name="memo"></textarea></label><button class="wide">행사 추가</button></form></div><section class="section"><h2>행사 목록</h2><table class="table"><thead><tr><th>행사명</th><th>일자</th><th>제한</th><th>노출</th><th>내용</th><th>관리</th></tr></thead><tbody>${state.events.map(e=>`<tr><td><input id="et_${e.id}" value="${e.title}"></td><td><input id="ed_${e.id}" type="date" value="${e.date}"></td><td><input id="el_${e.id}" type="number" value="${e.limit}"></td><td><select id="eo_${e.id}"><option value="true" ${e.isOpen!==false?'selected':''}>노출</option><option value="false" ${e.isOpen===false?'selected':''}>숨김</option></select></td><td><input id="em_${e.id}" value="${e.memo||''}"></td><td class="actions"><button onclick="updateEvent('${e.id}')">수정</button><button class="danger" onclick="deleteEvent('${e.id}')">삭제</button></td></tr>`).join("")}</tbody></table></section>`;}
function addEvent(e){e.preventDefault();const f=new FormData(e.target);state.events.push({id:uid(),title:f.get("title"),date:f.get("date"),limit:Number(f.get("limit")),memo:f.get("memo")||"",isOpen:f.get("isOpen")==="true"});save();toast("행사 추가");render();}
function updateEvent(id){const e=state.events.find(x=>x.id===id);e.title=document.getElementById("et_"+id).value;e.date=document.getElementById("ed_"+id).value;e.limit=Number(document.getElementById("el_"+id).value);e.isOpen=document.getElementById("eo_"+id).value==="true";e.memo=document.getElementById("em_"+id).value;save();toast("행사 수정");render();}
function deleteEvent(id){if(state.eventApplications.some(a=>a.eventId===id))return toast("신청 이력이 있는 행사는 삭제할 수 없습니다. 숨김 처리해 주세요.");if(!confirm("삭제할까요?"))return;state.events=state.events.filter(e=>e.id!==id);save();toast("삭제 완료");render();}

function discountAdmin(embedded=false){
  return`<div class="panel"><h3>할인 항목 추가</h3>
  <form class="form" onsubmit="addDiscount(event)">
    <label>카테고리<input name="category" required></label>
    <label>제목<input name="title" required></label>
    <label>할인 내용<input name="rate" required></label>
    <label>링크<input name="link" placeholder="https://"></label>
    <label>신청 접수 여부<select name="applyEnabled"><option value="false">일반 안내</option><option value="true">신청 접수</option></select></label>
    <label>신청 제한 인원<input type="number" name="limitCount" value="0" min="0"><span class="muted">0은 제한 없음</span></label>
    <label class="wide">이용 방법<textarea name="method"></textarea></label>
    <button class="wide">할인 항목 추가</button>
  </form></div>
  ${embedded?`<h3>할인 항목 목록</h3>`:`<section class="section"><h2>할인 항목 목록</h2>`}
  <table class="table"><thead><tr><th>카테고리</th><th>제목</th><th>할인</th><th>이용방법</th><th>신청/제한</th><th>링크</th><th>관리</th></tr></thead><tbody>
  ${state.discounts.map(d=>`<tr>
    <td><input id="dc_${d.id}" value="${d.category||""}"></td>
    <td><input id="dt_${d.id}" value="${d.title||""}"></td>
    <td><input id="dr_${d.id}" value="${d.rate||""}"></td>
    <td><input id="dm_${d.id}" value="${d.method||""}"></td>
    <td>
      <select id="da_${d.id}"><option value="false" ${!d.applyEnabled?'selected':''}>일반 안내</option><option value="true" ${d.applyEnabled?'selected':''}>신청 접수</option></select>
      <input id="dlm_${d.id}" type="number" min="0" value="${d.limitCount||0}" placeholder="제한 인원">
      <span class="muted">현재 ${discountApplyCount(d.id)}명</span>
    </td>
    <td><input id="dl_${d.id}" value="${d.link||""}"></td>
    <td class="actions"><button onclick="updateDiscount('${d.id}')">수정</button><button class="danger" onclick="deleteDiscount('${d.id}')">삭제</button></td>
  </tr>`).join("")}
  </tbody></table>${embedded?``:`</section>`}
  <section class="section"><h2>할인 신청 접수 현황</h2>${discountApplicationTable(state.discountApplications||[],true)}</section>`;
}
function addDiscount(e){
  e.preventDefault();
  const f=new FormData(e.target);
  if(!state.discounts) state.discounts=[];
  state.discounts.push({
    id:uid(),
    category:f.get("category"),
    title:f.get("title"),
    rate:f.get("rate"),
    method:f.get("method")||"",
    link:f.get("link")||"",
    applyEnabled:f.get("applyEnabled")==="true",
    limitCount:Number(f.get("limitCount")||0)
  });
  save();
  toast("할인 항목이 추가되었습니다.");
  render();
}
function updateDiscount(id){
  const d=state.discounts.find(x=>x.id===id);
  if(!d) return toast("할인 항목을 찾을 수 없습니다.");
  d.category=document.getElementById("dc_"+id).value;
  d.title=document.getElementById("dt_"+id).value;
  d.rate=document.getElementById("dr_"+id).value;
  d.method=document.getElementById("dm_"+id).value;
  d.link=document.getElementById("dl_"+id).value;
  d.applyEnabled=document.getElementById("da_"+id).value==="true";
  d.limitCount=Number(document.getElementById("dlm_"+id).value||0);
  (state.discountApplications||[]).forEach(a=>{
    if(a.discountId===id){a.title=d.title;a.category=d.category;}
  });
  save();
  toast("할인 항목이 수정되었습니다.");
  render();
}
function deleteDiscount(id){
  const d=state.discounts.find(x=>x.id===id);
  if(!d) return toast("할인 항목을 찾을 수 없습니다.");
  const applyCount=(state.discountApplications||[]).filter(a=>a.discountId===id).length;
  const msg=applyCount?`신청 내역 ${applyCount}건이 있는 항목입니다. 할인 항목만 삭제하고 신청 내역은 보관할까요?`:"해당 할인 항목을 삭제할까요?";
  if(!confirm(msg)) return;
  state.discounts=state.discounts.filter(x=>x.id!==id);
  save();
  toast("할인 항목이 삭제되었습니다.");
  render();
}
function noticeAdmin(){return`<div class="panel"><h3>공지 추가</h3><form class="form" onsubmit="addNotice(event)"><label>제목<input name="title" required></label><label>중요공지<select name="important"><option value="true">중요</option><option value="false">일반</option></select></label><label class="wide">내용<textarea name="body" required></textarea></label><button class="wide">공지 추가</button></form></div><section class="section"><h2>공지 목록</h2><table class="table"><thead><tr><th>제목</th><th>중요</th><th>내용</th><th>관리</th></tr></thead><tbody>${state.notices.map(n=>`<tr><td><input id="nt_${n.id}" value="${n.title}"></td><td><select id="ni_${n.id}"><option value="true" ${n.important?'selected':''}>중요</option><option value="false" ${!n.important?'selected':''}>일반</option></select></td><td><input id="nb_${n.id}" value="${n.body}"></td><td class="actions"><button onclick="updateNotice('${n.id}')">수정</button><button class="danger" onclick="deleteNotice('${n.id}')">삭제</button></td></tr>`).join("")}</tbody></table></section>`;}
function addNotice(e){e.preventDefault();const f=new FormData(e.target);state.notices.push({id:uid(),title:f.get("title"),important:f.get("important")==="true",body:f.get("body"),views:0});save();toast("공지 추가");render();}
function updateNotice(id){const n=state.notices.find(x=>x.id===id);n.title=document.getElementById("nt_"+id).value;n.important=document.getElementById("ni_"+id).value==="true";n.body=document.getElementById("nb_"+id).value;save();toast("공지 수정");render();}
function deleteNotice(id){if(!confirm("삭제할까요?"))return;state.notices=state.notices.filter(n=>n.id!==id);save();toast("삭제 완료");render();}

function mailOutboxAdmin(){if(!state.mailOutbox.length)return`<div class="panel empty">발송대기 메일이 없습니다.</div>`;return`<table class="table"><thead><tr><th>구분</th><th>받는 사람</th><th>제목</th><th>첨부</th><th>생성일</th><th>상태</th></tr></thead><tbody>${state.mailOutbox.map(m=>`<tr><td>${m.kind}</td><td>${m.to}</td><td>${m.subject}<br><span class="muted">${String(m.body).replace(/\n/g," / ")}</span></td><td>${m.attachment||"-"}</td><td>${m.createdAt}</td><td>${m.status}</td></tr>`).join("")}</tbody></table>`;}


function roomManualAdmin(){
  return `<div class="grid2">${state.rooms.map(r=>`<div class="panel"><h3>${r.name} 사용 설명서</h3><form class="form" onsubmit="saveRoomManual(event,'${r.id}')"><label class="wide">사용 설명 / 방키 번호 / 주의사항<textarea name="manual" placeholder="예: 방키 번호, 입실 방법, 와이파이, 퇴실 정리 기준 등">${r.manual||""}</textarea></label><button class="wide">설명서 저장</button></form></div>`).join("")}</div>`;
}
function saveRoomManual(e,id){
  e.preventDefault();
  const r=state.rooms.find(x=>x.id===id);
  r.manual=new FormData(e.target).get("manual");
  save();toast("숙소 사용 설명서 저장 완료");render();
}

function roomPhotoAdmin(){
  return `<p class="muted">사진은 숙소별로 등록 가능하며, 첫 번째 사진이 직원 예약 화면의 대표 사진으로 표시됩니다. 이미지는 500KB 이하만 등록 가능합니다.</p>
  <div class="grid2">${state.rooms.map(r=>`<div class="card"><h3>${r.name}</h3>
    <form class="form" onsubmit="addRoomPhoto(event,'${r.id}')">
      <label class="wide">사진 업로드<input type="file" name="photo" accept="image/*" required></label>
      <button class="wide">사진 추가</button>
    </form>
    <div class="photo-preview-grid">
      ${(r.photos||[]).map((p,i)=>`<div class="photo-tile">
        <img src="${p.data}" alt="${p.name}">
        <p class="muted">${i===0?"대표사진 · ":""}${p.name}</p>
        <div class="actions">
          ${i>0?`<button class="secondary" onclick="makeMainRoomPhoto('${r.id}','${p.id}')">대표로 설정</button>`:""}
          <button class="danger" onclick="deleteRoomPhoto('${r.id}','${p.id}')">삭제</button>
        </div>
      </div>`).join("")||"<p class='muted'>등록된 사진이 없습니다.</p>"}
    </div>
  </div>`).join("")}</div>`;
}
function addRoomPhoto(e,roomId){
  e.preventDefault();
  const file=e.target.photo.files[0];
  if(!file) return toast("사진 파일을 선택해 주세요.");
  if(!file.type.startsWith("image/")) return toast("이미지 파일만 가능합니다.");
  if(file.size>500*1024) return toast("사진은 500KB 이하만 등록 가능합니다. 용량을 줄여 다시 올려주세요.");
  const reader=new FileReader();
  reader.onload=()=>{
    const r=state.rooms.find(x=>x.id===roomId);
    if(!r.photos) r.photos=[];
    r.photos.push({id:uid(),name:file.name,data:reader.result,createdAt:new Date().toLocaleString()});
    audit("숙소 사진 추가",r.name+"/"+file.name);
    save();
    toast("사진이 추가되었습니다. 직원 숙소 예약 화면에도 반영됩니다.");
    render();
  };
  reader.readAsDataURL(file);
}
function makeMainRoomPhoto(roomId,photoId){
  const r=state.rooms.find(x=>x.id===roomId);
  const idx=(r.photos||[]).findIndex(p=>p.id===photoId);
  if(idx<=0) return;
  const [photo]=r.photos.splice(idx,1);
  r.photos.unshift(photo);
  audit("숙소 대표사진 변경",r.name+"/"+photo.name);
  save();
  toast("대표 사진이 변경되었습니다.");
  render();
}
function deleteRoomPhoto(roomId,photoId){
  const r=state.rooms.find(x=>x.id===roomId);
  const before=(r.photos||[]).length;
  r.photos=(r.photos||[]).filter(p=>p.id!==photoId);
  if(before===r.photos.length) return toast("삭제할 사진을 찾지 못했습니다.");
  audit("숙소 사진 삭제",r.name);
  save();
  toast("사진이 삭제되었습니다.");
  render();
}
function roomBlockAdmin(){return `<div class="panel"><form class="form" onsubmit="addRoomBlock(event)"><label>숙소<select name="roomId">${state.rooms.map(r=>`<option value="${r.id}">${r.name}</option>`).join("")}</select></label><label>시작일<input type="date" name="start" required></label><label>종료일<input type="date" name="end" required></label><label>사유<input name="reason" required></label><button class="wide">예약 차단 추가</button></form></div><table class="table" style="margin-top:12px"><thead><tr><th>숙소</th><th>기간</th><th>사유</th><th>관리</th></tr></thead><tbody>${(state.roomBlocks||[]).map(b=>`<tr><td>${(state.rooms.find(r=>r.id===b.roomId)||{}).name}</td><td>${b.start} ~ ${b.end}</td><td>${b.reason}</td><td><button class="danger" onclick="deleteRoomBlock('${b.id}')">삭제</button></td></tr>`).join("")}</tbody></table>`;}
function addRoomBlock(e){e.preventDefault();const f=new FormData(e.target);if(f.get("end")<=f.get("start"))return toast("종료일은 시작일 이후여야 합니다.");state.roomBlocks.push({id:uid(),roomId:f.get("roomId"),start:f.get("start"),end:f.get("end"),reason:f.get("reason")});audit("예약 차단 추가",`${f.get("start")}~${f.get("end")}/${f.get("reason")}`);save();toast("예약 차단 추가 완료");render();}
function deleteRoomBlock(id){state.roomBlocks=state.roomBlocks.filter(b=>b.id!==id);audit("예약 차단 삭제",id);save();toast("삭제 완료");render();}
function seasonRateAdmin(){return `<div class="panel"><form class="form" onsubmit="addSeasonRate(event)"><label>요금명<input name="name" required></label><label>구분<select name="type"><option value="dateRange">기간요금</option><option value="weekend">주말</option><option value="weekday">평일</option></select></label><label>시작일<input type="date" name="start"></label><label>종료일<input type="date" name="end"></label><label>추가요율 %<input type="number" name="surchargeRate" value="0" required></label><label>상태<select name="enabled"><option value="true">활성</option><option value="false">비활성</option></select></label><button class="wide">요금 조건 추가</button></form></div><table class="table" style="margin-top:12px"><thead><tr><th>명칭</th><th>구분</th><th>기간</th><th>추가요율</th><th>상태</th><th>관리</th></tr></thead><tbody>${(state.seasonRates||[]).map(r=>`<tr><td>${r.name}</td><td>${r.type}</td><td>${r.start||"-"} ~ ${r.end||"-"}</td><td>${r.surchargeRate}%</td><td>${r.enabled?"활성":"비활성"}</td><td><button class="danger" onclick="deleteSeasonRate('${r.id}')">삭제</button></td></tr>`).join("")}</tbody></table>`;}
function addSeasonRate(e){e.preventDefault();const f=new FormData(e.target);state.seasonRates.push({id:uid(),name:f.get("name"),type:f.get("type"),start:f.get("start"),end:f.get("end"),surchargeRate:Number(f.get("surchargeRate")),enabled:f.get("enabled")==="true"});audit("요금 조건 추가",f.get("name"));save();toast("요금 조건 추가 완료");render();}
function deleteSeasonRate(id){state.seasonRates=state.seasonRates.filter(r=>r.id!==id);audit("요금 조건 삭제",id);save();toast("삭제 완료");render();}
function auditLogAdmin(){const rows=state.auditLogs||[];if(!rows.length)return`<div class="panel empty">감사 로그가 없습니다.</div>`;return `<table class="table"><thead><tr><th>일시</th><th>사용자</th><th>행위</th><th>상세</th></tr></thead><tbody>${rows.map(l=>`<tr><td>${l.createdAt}</td><td>${l.actor}</td><td>${l.action}</td><td>${l.detail}</td></tr>`).join("")}</tbody></table>`;}
function aiAssistantAdmin(){return `<div class="group-box"><div class="group-section"><h3>AI 비서</h3><p class="muted">예: 예약률 보여줘 / 올해 숙소 이용 순위 / 10박 초과 직원 / 휴가지원 미신청 직원 / 경조사 많은 부서</p><form class="form" onsubmit="askAI(event)"><label class="wide">질문<input name="q" id="aiq" required></label><button class="wide">조회</button></form></div><div class="group-section" id="aiResult"><h3>결과</h3><p class="muted">질문을 입력하면 결과가 표시됩니다.</p></div></div>`;}
function askAI(e){e.preventDefault();document.getElementById("aiResult").innerHTML=aiAnswer(new FormData(e.target).get("q"));}
function aiAnswer(q){const text=q.replace(/\s/g,"");if(text.includes("예약률"))return `<h3>숙소 예약률</h3><div class="room-status-grid">${roomUsageSummary().map(r=>`<div class="room-status"><p class="room-name">${r.room.name}</p><p>${r.nights}박 / ${r.rate}%</p><div class="progressbar"><span style="width:${r.rate}%"></span></div></div>`).join("")}</div>`;if(text.includes("10박")||text.includes("초과")){const rows=state.users.map(u=>({u,n:annualUsedNights(u.id)})).filter(x=>x.n>=(state.settings.annualNightLimit||10));return `<h3>연간 기준 도달/초과 직원</h3>${rows.length?`<table class="table"><tbody>${rows.map(x=>`<tr><td>${x.u.name}</td><td>${x.n}박</td></tr>`).join("")}</tbody></table>`:"<p class='muted'>해당 직원이 없습니다.</p>"}`;}if(text.includes("휴가")&&text.includes("미신청")){const applied=new Set(state.vacationSupport.map(v=>v.userId));const rows=state.users.filter(u=>u.status==="가입승인"&&!applied.has(u.id));return `<h3>휴가지원 미신청 직원</h3><table class="table"><tbody>${rows.map(u=>`<tr><td>${u.name}</td><td>${u.dept||""}</td></tr>`).join("")}</tbody></table>`;}if(text.includes("경조사")&&text.includes("부서")){const m={};state.condolences.forEach(c=>m[c.dept||"미지정"]=(m[c.dept||"미지정"]||0)+1);return `<h3>부서별 경조사 건수</h3><table class="table"><tbody>${Object.entries(m).map(x=>`<tr><td>${x[0]}</td><td>${x[1]}건</td></tr>`).join("")||"<tr><td>데이터 없음</td></tr>"}</tbody></table>`;}if(text.includes("순위")||text.includes("이용")){const rows=state.users.map(u=>({u,n:annualUsedNights(u.id)})).sort((a,b)=>b.n-a.n);return `<h3>숙소 이용 순위</h3><table class="table"><tbody>${rows.map((x,i)=>`<tr><td>${i+1}</td><td>${x.u.name}</td><td>${x.n}박</td></tr>`).join("")}</tbody></table>`;}return `<h3>AI 비서 결과</h3><p class="muted">예약률, 숙소 이용 순위, 10박 초과 직원, 휴가지원 미신청 직원, 경조사 많은 부서 등을 물어보세요.</p>`;}
function stats(){
  return`<div class="grid4">
    <div class="card"><span class="muted">회원 대기</span><div class="kpi">${state.users.filter(u=>u.status==="가입대기").length}</div></div>
    <div class="card"><span class="muted">관리자 수</span><div class="kpi">${state.admins.length}</div></div>
    <div class="card"><span class="muted">숙소 예약</span><div class="kpi">${state.reservations.length}</div></div>
    <div class="card"><span class="muted">지인 결제 예정</span><div class="kpi">${money(state.reservations.reduce((s,r)=>s+(r.status!=="반려"&&r.status!=="취소"?Number(r.amount||0):0),0))}</div></div>
  </div>`;
}
function exportCSV(){const rows=[["구분","신청자","부서","내용","일자","박수","금액","상태"]];state.reservations.forEach(r=>rows.push(["숙소예약",r.userName,r.dept,r.roomName,`${r.checkin}~${r.checkout}`,r.nights,r.amount||0,r.status]));state.condolences.forEach(r=>rows.push(["경조사",r.userName,r.dept,r.type,r.date,"",0,r.status]));state.vacationSupport.forEach(r=>rows.push(["휴가지원사업",r.userName,r.dept,r.type,r.date,"",0,r.status]));const csv="\ufeff"+rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="welfare_export.csv";a.click();}
function resetData(){if(!confirm("데모 데이터를 초기화할까요?"))return;localStorage.removeItem("with_welfare_v5");localStorage.removeItem("with_session_v5");state=load();session=null;toast("초기화되었습니다.");render();}
function render(){if(!session)return loginView();if(!user()){logout();return;}if(!ensureEnabledPage(page)){page="home";}if(page==="home")app.innerHTML=home();if(page==="stay")app.innerHTML=stay();if(page==="family")app.innerHTML=family();if(page==="event")app.innerHTML=eventPage();if(page==="discount")app.innerHTML=discount();if(page==="vacation")page="home";if(page==="notice")app.innerHTML=notice();if(page==="admin")app.innerHTML=admin();if(page==="mypage")app.innerHTML=mypage();}
render();
initCloudSync();