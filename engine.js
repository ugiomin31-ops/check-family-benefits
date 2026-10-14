// Pure, dependency-free date/state utilities shared by the UI and tests.
export const VERSION = 1;
export const STORAGE_KEY = 'check.family.v1';
export const CHECKED_AT = '2026-10-14';
export const RANGE = { start: '2026-10', end: '2029-12' };
export const REGIONS = { unknown:'아직 설정하지 않음', dongducheon:'경기 동두천시', uijeongbu:'경기 의정부시', gyeonggi:'경기도 다른 시군', seoul:'서울특별시', other:'그 밖의 지역' };
export const STATUS = { todo:'준비 전', doing:'준비 중', applied:'신청했어요', done:'챙겼어요', na:'해당 없음' };
export const EVIDENCE = { current:'공식 기준 확인', conditional:'조건 확인 필요', 'future-check':'다시 확인', unverified:'상세 미확인', ended:'지난 모집' };
export const DEFAULT_PROFILE = { dueMonth:'2027-06', dueDate:'', birthDate:'', region:'unknown', childOrder:'unknown', multiple:'unknown', motherWork:'unknown', fatherWork:'unknown', moveInDate:'', motherLeaveStart:'', fatherLeaveStart:'', district:'' };
const own = (obj,key) => Object.prototype.hasOwnProperty.call(obj,key);
export function parseDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y,m,d] = value.split('-').map(Number);
  if(y < 1900 || y > 2200 || m < 1 || m > 12 || d < 1 || d > 31) return null;
  const dt = new Date(Date.UTC(y,m-1,d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m-1 && dt.getUTCDate() === d ? dt : null;
}
export function iso(dt) { return dt.toISOString().slice(0,10); }
export function addDays(value, n=0) { const d=parseDate(value); if(!d || !Number.isFinite(n)) return null; d.setUTCDate(d.getUTCDate()+n); return iso(d); }
export function addMonths(value,n=0) {
  const d=parseDate(value); if(!d || !Number.isInteger(n)) return null;
  const target=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+n,1));
  const last=new Date(Date.UTC(target.getUTCFullYear(),target.getUTCMonth()+1,0)).getUTCDate();
  target.setUTCDate(Math.min(d.getUTCDate(),last)); return iso(target);
}
export function todayKST() {
  const parts = new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  const get=x=>parts.find(p=>p.type===x).value; return `${get('year')}-${get('month')}-${get('day')}`;
}
export function monthLabel(value) { const [y,m]=value.split('-'); return `${y}년 ${Number(m)}월`; }
export function dateLabel(value) { const d=parseDate(value); return d ? new Intl.DateTimeFormat('ko-KR',{timeZone:'UTC',month:'long',day:'numeric'}).format(d) : '날짜 확인 필요'; }
export function fullDateLabel(value) { return parseDate(value) ? `${value.slice(0,4)}년 ${dateLabel(value)}` : '미설정'; }
export function monthsInRange() {
  const out=[]; for(let d=`${RANGE.start}-01`;d.slice(0,7)<=RANGE.end;d=addMonths(d,1))out.push(d.slice(0,7)); return out;
}
export function safeURL(value) {
  if(typeof value!=='string' || value.length>2500) return '';
  if(/^tel:\+?[\d ()-]{2,30}$/.test(value))return value;
  try { const u=new URL(value); return ['https:','http:'].includes(u.protocol) && !u.username && !u.password ? u.href : ''; } catch{return '';}
}
export function sanitizeProfile(p={}) {
  const x={...DEFAULT_PROFILE};
  if(p && typeof p==='object') {
    if(/^20\d{2}-(0[1-9]|1[0-2])$/.test(p.dueMonth||''))x.dueMonth=p.dueMonth;
    for(const key of ['dueDate','birthDate'])if(parseDate(p[key]))x[key]=p[key];
    if(x.dueDate)x.dueMonth=x.dueDate.slice(0,7);
    if(own(REGIONS,p.region))x.region=p.region;
    if(['unknown','1','2','3'].includes(p.childOrder))x.childOrder=p.childOrder;
    if(['unknown','single','twins','more'].includes(p.multiple))x.multiple=p.multiple;
    for(const key of ['motherWork','fatherWork'])if(['unknown','employee','public','self','other'].includes(p[key]))x[key]=p[key];
    for(const key of ['moveInDate','motherLeaveStart','fatherLeaveStart'])x[key]=parseDate(p[key])?p[key]:'';
    x.district=typeof p.district==='string'?p.district.trim().slice(0,50):'';
  } return x;
}
export function freshState() { return {version:VERSION,profile:{...DEFAULT_PROFILE},checks:{},custom:[],updatedAt:null}; }
export function sanitizeState(raw) {
  if(!raw || typeof raw!=='object' || raw.version!==VERSION)throw new Error('이 CHECK 버전에서 읽을 수 있는 백업이 아니에요.');
  const out=freshState(); out.profile=sanitizeProfile(raw.profile);
  if(raw.checks && typeof raw.checks==='object' && !Array.isArray(raw.checks)) {
    for(const [id,c] of Object.entries(raw.checks).slice(0,2500)) {
      if(!/^[a-zA-Z0-9_-]{1,100}$/.test(id) || ['__proto__','constructor','prototype'].includes(id) || !c || typeof c!=='object')continue;
      out.checks[id]={status:own(STATUS,c.status)?c.status:'todo',notes:typeof c.notes==='string'?c.notes.slice(0,4000):'',docs:Array.isArray(c.docs)?[...new Set(c.docs.filter(n=>Number.isInteger(n)&&n>=0&&n<100))]:[],reviewed:parseDate(c.reviewed)?c.reviewed:'',date:parseDate(c.date)?c.date:''};
    }
  }
  if(Array.isArray(raw.custom))for(const c of raw.custom.slice(0,100)) {
    if(!c || typeof c!=='object' || !/^custom-[a-zA-Z0-9_-]{1,70}$/.test(c.id||'') || typeof c.title!=='string' || !c.title.trim())continue;
    if(out.custom.some(x=>x.id===c.id))continue;
    out.custom.push({id:c.id,title:c.title.trim().slice(0,120),summary:typeof c.summary==='string'?c.summary.slice(0,2000):'',url:safeURL(c.url||''),date:parseDate(c.date)?c.date:''});
  }
  out.updatedAt=typeof raw.updatedAt==='string'?raw.updatedAt:null; return out;
}
export function checkFor(state,id) { return state.checks[id] || {status:'todo',notes:'',docs:[],reviewed:'',date:''}; }
export function regionMatches(item,profile) {
  const r=item.region||'all';
  if(['all','전국','national'].includes(r))return true;
  const area=(profile.district||'').replace(/\s/g,'');
  if(profile.region==='gyeonggi'&&((r==='dongducheon'&&/동두천/.test(area))||(r==='uijeongbu'&&/의정부/.test(area))))return true;
  if(profile.region===r)return true;
  return r==='gyeonggi' && ['dongducheon','uijeongbu'].includes(profile.region);
}
export function regionLabel(r) { return ['all','전국','national',null,undefined].includes(r)?'전국':(REGIONS[r]||r); }
export function scheduleFor(item,profile,check={}) {
  if(parseDate(check.date))return {date:check.date,precise:true,label:'내가 정한 준비일',custom:true};
  const plan=item.plan || {basis:'due',month:-8,day:0};
  if(plan.basis==='birth-year'){
    const actual=profile.birthDate||profile.dueDate||`${profile.dueMonth}-15`;
    return {date:`${Number(actual.slice(0,4))+(plan.yearOffset||1)}-${String(plan.monthOfYear||1).padStart(2,'0')}-${String(plan.dayOfMonth||15).padStart(2,'0')}`,precise:!!profile.birthDate,label:profile.birthDate?'출생연도 기준 다음 해 준비':'예정연도 기준 임시 준비'};
  }
  if(item.id==='work-general-parental-leave-benefit'&&parseDate(profile.motherLeaveStart))return {date:addDays(profile.motherLeaveStart,-30),precise:true,label:'입력한 휴직 시작일 30일 전 준비'};
  if(item.id==='work-together'&&parseDate(profile.fatherLeaveStart))return {date:addDays(profile.fatherLeaveStart,-30),precise:true,label:'배우자 휴직 시작일 30일 전 준비'};
  if(plan.basis==='fixed')return {date:parseDate(plan.date)?plan.date:null,precise:true,label:plan.officialDate?'공고상 날짜':'준비 권장일'};
  let anchor=profile.dueDate||`${profile.dueMonth}-15`;
  let precise=!!profile.dueDate,label=profile.dueDate?'예정일 기준 준비일':'예정월 기준 추정';
  if(plan.basis==='birth') {
    if(profile.birthDate){anchor=profile.birthDate;precise=true;label='출생일 기준 준비일';}
    else {precise=false;label='출생 전 임시 일정';}
  }
  let date;
  if(plan.basis==='gestation')date=addDays(anchor,(plan.week||0)*7-280+(plan.day||0));
  else date=addDays(addMonths(anchor,plan.month||0),plan.day||0);
  return {date,precise,label};
}
export function profileFit(item,profile){
 const notes=[];let fit='check';
 if(!regionMatches(item,profile)){fit='other-region';notes.push('현재 설정과 다른 지역의 사업이에요.');}
 else if(item.region!=='all'){notes.push('거주기간·출생신고지 등 지역 요건을 따로 확인해요.');}
 if(item.requirements?.multipleOnly){
  if(profile.multiple==='single'){fit='not-indicated';notes.push('다태아 전용 항목이에요. 현재 설정은 단태아예요.');}
  else if(['twins','more'].includes(profile.multiple))notes.push('다태아 설정에 해당하는 추가 요건을 확인해요.');
 }
 const worker=item.requirements?.worker;
 if(worker){
  const values=worker==='mother'?[profile.motherWork]:worker==='father'?[profile.fatherWork]:[profile.motherWork,profile.fatherWork];
  if(values.includes('public'))notes.push('공무원·교원·사학 등은 소속기관 규정부터 확인해요.');
  if(values.every(x=>['self','other'].includes(x))){fit='not-indicated';notes.push('일반 근로자 제도예요. 현재 고용형태의 별도 제도를 확인해요.');}
  else if(values.includes('unknown'))notes.push('부모의 고용형태를 설정하면 우선순위를 더 좁힐 수 있어요.');
 }
  if(item.requirements?.conditional)notes.push('소득·건강·가족유형 등 추가 선정요건이 있는 항목이에요.');
  if(item.region==='seoul'&&parseDate(profile.moveInDate)&&['local-seoul-transport','local-seoul-post'].includes(item.id))notes.push(`입력한 전입일부터 3개월이 되는 날은 ${fullDateLabel(addMonths(profile.moveInDate,3))}이에요. 중간 전출·주소이력과 실제 접수자격은 기관에 확인하세요.`);
  if(item.id==='local-ddc'&&parseDate(profile.moveInDate))notes.push(`입력한 전입일부터 1년이 되는 날은 ${fullDateLabel(addMonths(profile.moveInDate,12))}이에요. 출생일·계속거주·동일세대에 따른 자격을 확인하세요.`);
 const currentYearOnly=['local-gg-meat','local-gg-eco-produce-pregnant'];
 const year=(profile.birthDate||profile.dueDate||profile.dueMonth).slice(0,4);
 if(currentYearOnly.includes(item.id)&&year!=='2026')notes.push('확인된 모집은 2026년 대상이에요. 입력한 출생연도의 새 모집을 확인해야 해요.');
 return {fit,notes,conditional:!!item.requirements?.conditional};
}
export function computedDeadline(item,profile){
 if(!parseDate(profile.birthDate))return null;
 if(['national-parental-benefit','national-child-allowance','national-diaper-formula'].includes(item.id))return {date:addDays(profile.birthDate,59),label:'출생월 소급·전기간 지원 신청 기준',basis:'현행 출생일 포함 60일 계산 · 신청연도 지침 재확인'};
 return null;
}
export function materializeItems(data,state,{asOf=todayKST()}={}) {
  const custom=state.custom.map(c=>({id:c.id,title:c.title,summary:c.summary,category:'내 할 일',amountText:'직접 추가한 준비 항목',kind:'custom',region:'all',priority:'normal',status:'conditional',plan:{basis:'fixed',date:c.date},eligibility:[],applicationWindow:'직접 정한 날짜이며 법정 신청 마감이 아닙니다.',documents:[],steps:[],cautions:[],sources:[],links:c.url?[{label:'저장한 링크',url:c.url,type:'guide'}]:[]}));
  const birthOrExpected=state.profile.birthDate||state.profile.dueDate||`${state.profile.dueMonth}-15`;
  const oldRegime=new Set(['national-first-meeting-voucher','national-parental-benefit','national-child-allowance']);
  return [...data.items,...custom].map(i=>{
    const out={...i,check:checkFor(state,i.id),schedule:scheduleFor(i,state.profile,checkFor(state,i.id)),mine:regionMatches(i,state.profile)};
    if(oldRegime.has(i.id)&&birthOrExpected>='2027-01-01'){
      out.status='conditional';
      out.regimeNotice=data.meta?.policyUpdate?.text||i.regimeNotice||'2027년 급여 개편과 소급 적용은 최종 시행공고를 확인하세요.';
    }
    if(i.id.startsWith('future-2027-'))out.regimeNotice=data.meta?.policyUpdate?.text||i.regimeNotice||'최종 시행공고를 확인하고 현행·개편 급여를 중복 합산하지 않아요.';
    out.profileFit=profileFit(i,state.profile);
    if(i.validity?.birthYear&&birthOrExpected.slice(0,4)!==i.validity.birthYear){
      out.status='future-check';
      out.profileFit.conditional=true;
      out.profileFit.notes.push('확인된 모집의 출생연도와 달라요. 다음 회차가 공고될 때 신청조건을 다시 확인하세요.');
    }
    if(i.validity?.end&&asOf>i.validity.end){
      out.status=i.validity.kind==='coverage'?'future-check':'ended';
      out.profileFit.notes.push(i.validity.kind==='coverage'?'확인된 보험기간이 끝났어요. 기간 중 발생한 사고의 청구권과 새 계약은 별도로 확인하세요.':'이 항목에서 확인한 회차의 접수·운영기간이 지났어요. 다음 회차가 자동으로 같은 조건으로 열리는 것은 아닙니다.');
    }
    out.deadline=computedDeadline(i,state.profile);
    out.forMyTimeline=out.mine&&out.profileFit.fit!=='not-indicated';
    out.personalAmount='';
    if(i.id==='national-first-meeting-voucher'&&state.profile.childOrder!=='unknown')out.personalAmount=state.profile.childOrder==='1'?'첫째 설정 · 현행 200만원 참고':'둘째 이상 설정 · 현행 300만원 참고';
    if(i.id==='local-ddc'&&state.profile.childOrder!=='unknown')out.personalAmount=state.profile.childOrder==='1'?'첫째 설정 · 현행 100만원 참고':state.profile.childOrder==='2'?'둘째 설정 · 현행 150만원 참고':'셋째 이상 설정 · 상세 출생순위에 따라 현행 250~500만원';
    if(i.id==='local-ui'&&state.profile.childOrder!=='unknown')out.personalAmount=state.profile.childOrder==='1'?'첫째 설정 · 현행 30만원 참고':'둘째 이상 설정 · 현행 100만원 참고';
    return out;
  });
}
export function isOpen(item) {return !['done','na'].includes(item.check?.status);}
export function rankItems(a,b) {
  const pr={high:0,medium:1,normal:1,low:2};
  return (pr[a.priority]??1)-(pr[b.priority]??1) || (a.schedule.date||'9999').localeCompare(b.schedule.date||'9999') || a.title.localeCompare(b.title,'ko');
}
export function normalizedSearch(s) { return String(s||'').normalize('NFKC').toLocaleLowerCase('ko').replace(/\s+/g,''); }
export function matchesSearch(item,q) {
  return normalizedSearch([item.title,item.summary,item.category,item.amountText,...(item.eligibility||[])].join(' ')).includes(normalizedSearch(q));
}
export function icsEscape(s) {return String(s||'').replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');}
export function foldICS(line) {
  const encoder=new TextEncoder(); let out='',part='',bytes=0;
  for(const c of line){const n=encoder.encode(c).length;if(bytes+n>75){out+=part+'\r\n';part=' ';bytes=1;}part+=c;bytes+=n;}
  return out+part;
}
export function buildICS(items,{includeEstimates=false,stamp=new Date()}={}) {
  const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//CHECK//Family checklist 1.0//KO','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:CHECK 가족 준비 일정'];
  let count=0,skipped=0;
  for(const item of items){
    if(!isOpen(item)||!item.mine||item.forMyTimeline===false||item.status==='ended')continue;
    const {date,precise}=item.schedule;
    if(!parseDate(date)||(!precise&&!includeEstimates)){skipped++;continue;}
    count++;
    const prefix=precise?'[준비] ':'[임시·예정월 기준] ';
    const description=[item.summary,`일정 의미: ${item.schedule.label}. 법정 신청 마감일이 아닙니다.`,item.applicationWindow,`확인일: ${CHECKED_AT}`,item.links?.find(l=>safeURL(l.url))?.url||''].filter(Boolean).join('\n');
    lines.push('BEGIN:VEVENT',`UID:${item.id}@check.local`,`DTSTAMP:${stamp.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z')}`,`DTSTART;VALUE=DATE:${date.replaceAll('-','')}`,`DTEND;VALUE=DATE:${addDays(date,1).replaceAll('-','')}`,`SUMMARY:${icsEscape(prefix+item.title)}`,`DESCRIPTION:${icsEscape(description)}`,'TRANSP:TRANSPARENT','BEGIN:VALARM','TRIGGER:-P7D','ACTION:DISPLAY','DESCRIPTION:CHECK 준비 일정 확인','END:VALARM','END:VEVENT');
  }
  lines.push('END:VCALENDAR'); return {text:lines.map(foldICS).join('\r\n')+'\r\n',count,skipped};
}
