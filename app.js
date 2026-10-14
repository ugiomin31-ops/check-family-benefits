import {homeV2,timelineV2,rowV2,badgeV2,cardV2,detailV2} from './ui-v2.js';
import {VERSION,STORAGE_KEY,CHECKED_AT,RANGE,REGIONS,STATUS,EVIDENCE,DEFAULT_PROFILE,parseDate,addDays,addMonths,todayKST,monthLabel,dateLabel,fullDateLabel,monthsInRange,safeURL,sanitizeProfile,sanitizeState,freshState,checkFor,materializeItems,isOpen,rankItems,matchesSearch,buildICS} from './engine.js';
import {validConfig,familyStorageKey,familyDiff,legacyMissing} from './cloud-logic.js';

const $=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paths={
 home:'M3 10.5 12 3l9 7.5M5 9v11h5v-6h4v6h5V9',
 calendar:'M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2ZM7 3v4M17 3v4M3 11h18M7 15h2M14 15h2M7 18h2',
 gift:'M3 8h18v4H3ZM5 12v9h14v-9M12 8v13M12 8H8a3 3 0 1 1 3-3l1 3Zm0 0h4a3 3 0 1 0-3-3l-1 3Z',
 heart:'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',
 settings:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM9 3h6l.5 3 2.6 1.5 2.9-1L23 12l-2.1 2 0 3-5.1 3.1L13 19h-2l-2.8 1.1L3.1 17v-3L1 12l2-5.5 2.9 1L8.5 6 9 3Z',
 check:'m5 12 4 4L19 6',
 arrow:'m9 5 7 7-7 7',
 external:'M14 3h7v7M10 14 21 3M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5',
 download:'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5',
 upload:'M12 16V4m-5 5 5-5 5 5M4 17v4h16v-4',
 shield:'M12 3 3 6v6c0 5 9 9 9 9s9-4 9-9V6l-9-3Zm-4 9 3 3 5-6',
 info:'M12 8v.1M12 11v6M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
 close:'m6 6 12 12M18 6 6 18',
 search:'M16 16l5 5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z',
 location:'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0ZM15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
 briefcase:'M8 6V3h8v3M3 7h18v13H3ZM3 12c6 4 12 4 18 0M10 12h4v4h-4Z',
 card:'M3 5h18v14H3ZM3 9h18M6 15h4',
 baby:'M12 3a9 9 0 1 0 9 9M12 3c4 0 4 5 0 5M8 11v1M16 11v1M8 16c2 2 6 2 8 0',
 doc:'M14 3H5v18h14V8l-5-5Zm0 0v5h5M8 12h8M8 16h5',
 train:'M6 3h12v14H6ZM6 10h12M9 3v7M15 3v7M9 14v.1M15 14v.1M9 17l-3 4M15 17l3 4M8 20h8',
 plus:'M12 5v14M5 12h14',
 refresh:'M20 7v5h-5M4 17v-5h5M19 11a7 7 0 0 0-12-5L4 9M5 13a7 7 0 0 0 12 5l3-3',
 clock:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM12 7v5l3 2',
 phone:'M7 2h10v20H7ZM10 18h4',
 lock:'M5 10h14v11H5ZM8 10V6a4 4 0 1 1 8 0v4M12 14v3',
 minus:'M5 12h14',
 spark:'m12 2 2.8 7.2L22 12l-7.2 2.8L12 22l-2.8-7.2L2 12l7.2-2.8L12 2Z',
};
const icon=(name,cls='')=>`<svg viewBox="0 0 24 24" aria-hidden="true"${cls?` class="${esc(cls)}"`:''}><path d="${paths[name]||paths.doc}"/></svg>`;
const categoryIcon=c=>/의료|건강|임신|출산/.test(c)?'heart':/직장|고용|휴직/.test(c)?'briefcase':/교통/.test(c)?'train':/세금|주거/.test(c)?'home':/지역/.test(c)?'location':/이벤트/.test(c)?'gift':/수당|급여|생활비|지원금/.test(c)?'card':/돌봄|보육/.test(c)?'baby':/점검/.test(c)?'refresh':'doc';
const NAV=[['home','home','홈'],['timeline','calendar','일정'],['benefits','heart','혜택'],['events','gift','이벤트'],['settings','settings','설정']];
let data,state,allItems=[],storageError='',corruptBackup='',activeItemId='',lastFocus=null,toastTimer,notesTimer,undoState=null,deferredInstall=null,registration=null,waitingWorker=null,reloadForUpdate=false,pendingImport=null;
let currentStorageKey=STORAGE_KEY,lastSavedState=null,cloudClient=null;
let cloudState={configured:false,phase:'setup',email:'',familyId:'',members:0,pending:0,owner:false,invitationUrl:'',detail:'Firebase 프로젝트 연결 전'};
const cloneState=v=>JSON.parse(JSON.stringify(v));
const today=todayKST();
const within=m=>m<RANGE.start?RANGE.start:m>RANGE.end?RANGE.end:m;
const ui={view:'home',month:within(today.slice(0,7)),year:within(today.slice(0,7)).slice(0,4),category:'전체',query:'',status:'all',mineOnly:false,hideComplete:false,sourceQuery:'',information:'all',timelineEvents:false};

function readState(key=currentStorageKey){
 try{const raw=localStorage.getItem(key);if(!raw)return freshState();try{return sanitizeState(JSON.parse(raw));}catch{corruptBackup=raw;storageError='저장된 기록을 읽지 못했어요. 기존 기록은 덮어쓰지 않았습니다. 설정에서 원본을 백업하고 초기화해 주세요.';return freshState();}}
 catch{storageError='브라우저 저장소를 사용할 수 없어요. 체크는 이 창에서만 유지됩니다. JSON 백업을 꼭 내려받아 주세요.';return freshState();}
}
function rebuild(){allItems=materializeItems(data,state);}
function persist({remote=false}={}){
 state.updatedAt=new Date().toISOString();
 if(corruptBackup)return false;
 try{
  localStorage.setItem(currentStorageKey,JSON.stringify(state));
  const previous=lastSavedState;
  lastSavedState=cloneState(state);
  if(!remote&&cloudClient?.familyId&&previous)cloudClient.syncChanges(familyDiff(previous,state));
  return true;
 }catch{storageError='기기 저장에 실패했어요. 용량·비공개 모드를 확인하고 JSON 백업을 내려받아 주세요.';toast(storageError);return false;}
}
function setCheck(id,patch){state.checks[id]={...checkFor(state,id),...patch};const saved=persist();rebuild();return saved;}
function itemById(id){return allItems.find(i=>i.id===id);}
function navHTML(){return NAV.map(([key,ic,title])=>`<button type="button" class="nav-button${ui.view===key?' active':''}" data-view="${key}" ${ui.view===key?'aria-current="page"':''}>${icon(ic)}<span>${title}</span></button>`).join('');}
function refreshNav(){ $('#desktop-nav').innerHTML=navHTML();$('#mobile-nav').innerHTML=navHTML(); }
function route(){
 const hash=location.hash.slice(1);
 if(hash.startsWith('join/')){ui.view='settings';render();return;}
 if(hash.startsWith('item/')){ui.view='benefits';render();openItem(decodeURIComponent(hash.slice(5)));return;}
 if(hash==='sources'){ui.view='sources';render();return;}
 if(NAV.some(n=>n[0]===hash)){ui.view=hash;render();return;}
 if(hash==='main')return;
 ui.view='home';render();
}
function go(view){
 if($('#detail-dialog').open)$('#detail-dialog').close();
 if($('#utility-dialog').open)$('#utility-dialog').close();
 if(location.hash===`#${view}`){ui.view=view;render();}else location.hash=view;
 window.scrollTo({top:0,behavior:'instant'});
}
function badge(item){return badgeV2(item,{esc,icon});}
function statusPill(status){const cls=status==='done'?'green':status==='applied'?'blue':status==='doing'?'amber':'';return `<span class="pill ${cls}">${esc(STATUS[status]||STATUS.todo)}</span>`;}
function row(item,options={}){return rowV2(item,{esc,icon,badge,...options});}
function empty(title,message,button=''){return `<div class="empty"><div class="empty-icon">${icon('check')}</div><h3>${esc(title)}</h3><p>${esc(message)}</p>${button}</div>`;}
function heading(eyebrow,title,subtitle,action=''){return `<div class="page-heading"><div><div class="eyebrow">${esc(eyebrow)}</div><h1>${title}</h1><p class="subtitle">${subtitle}</p></div>${action}</div>`;}
function familySummary(){return state.profile.birthDate?`아기가 태어난 날 ${esc(state.profile.birthDate.replaceAll('-','.'))}`:`출산 예정 ${esc(state.profile.dueDate?state.profile.dueDate.replaceAll('-','.') : state.profile.dueMonth.replace('-','.'))}`;}
function v2Context(){return {items:allItems,state,data,ui,month:within(today.slice(0,7)),today,esc,icon,row,badge,categoryIcon,externalLink,storageError};}
function renderHome(){return homeV2(v2Context());}
function renderTimeline(){return timelineV2(v2Context());}
function card(item){return cardV2(item,v2Context());}
function libraryCandidates(events=false){return allItems.filter(i=>events?i.kind==='event':['benefit','custom'].includes(i.kind));}
function filteredLibrary(events=false){return libraryCandidates(events).filter(i=>
 (ui.category==='전체'||i.category===ui.category)&&matchesSearch(i,ui.query)&&(!ui.mineOnly||i.forMyTimeline)&&
 (ui.information==='all'||i.status===ui.information)&&
 (ui.status==='all'||(ui.status==='open'?isOpen(i):i.check.status===ui.status))
 );}
function libraryBody(events=false){const list=filteredLibrary(events);return `<div class="result-count"><span>${list.length}개 ${events?'행사·프로젝트':'혜택·할 일'}</span><label class="mini-check"><input id="mine-only" type="checkbox"${ui.mineOnly?' checked':''}>전국 + 내 지역만</label></div><div class="library-grid">${list.length?list.map(card).join(''):empty('조건에 맞는 항목이 없어요','검색어를 짧게 바꾸거나 지역·분류 필터를 풀어 보세요.')}</div>`;}
function renderLibrary(events=false){
 const categories=['전체',...new Set(libraryCandidates(events).map(i=>i.category))];
 if(!categories.includes(ui.category))ui.category='전체';
 return heading(events?'A LITTLE EXTRA':'BENEFITS, WITH EVIDENCE',events?'작은 선물도 챙겨요':'받을 수 있는 혜택',events?'기관의 프로젝트와 기업의 체험·사은 행사를 모았어요.':'지원 내용보다 중요한 신청 조건과 방법까지.<br>2027~2029 금액은 신청연도에 다시 확인해 주세요.')+
 (events?`<div class="event-intro"><h3>‘무료’보다 먼저, 참여 조건을 봐주세요</h3><p>추첨·배송비·구매조건·마케팅 동의를 확인해요. 과거 행사와 현재 모집은 다릅니다. 앱에 ‘다시 확인’으로 표시한 행사는 신청 당일 공고 확인이 필요해요.</p></div>`:'')+
 `<div class="toolbar"><label class="searchbox"><span class="screen-reader">${events?'행사':'혜택'} 검색</span>${icon('search')}<input id="benefit-search" type="search" value="${esc(ui.query)}" placeholder="${events?'박스, 교육, 체험…':'국민행복카드, 산후도우미, 육아휴직…'}" autocomplete="off"></label><label><span class="screen-reader">진행상태 필터</span><select class="filter-select" id="status-filter">${[['all','모든 상태'],['open','아직 준비할 것'],['todo','준비 전'],['doing','준비 중'],['applied','신청했어요'],['done','챙겼어요'],['na','해당 없음']].map(([v,l])=>`<option value="${v}"${ui.status===v?' selected':''}>${l}</option>`).join('')}</select></label></div>
 ${!events?`<div class="filter-strip" role="group" aria-label="혜택 분류">${categories.map(c=>`<button class="filter-chip${ui.category===c?' active':''}" data-category="${esc(c)}" aria-pressed="${ui.category===c}">${esc(c)}</button>`).join('')}</div>`:''}
 <div class="filter-strip" role="group" aria-label="정보 상태"><span class="v2-filter-label">정보 상태</span>${[['all','전체'],['current','현행 안내'],['conditional','조건부'],['future-check','새 공고·미확정'],['ended','종료 회차'],['unverified','미확인']].map(([v,l])=>`<button class="filter-chip${ui.information===v?' active':''}" data-information="${v}" aria-pressed="${ui.information===v}">${l}</button>`).join('')}</div><div id="library-results">${libraryBody(events)}</div>`;
}
function options(values,current){return Object.entries(values).map(([v,l])=>`<option value="${esc(v)}"${v===current?' selected':''}>${esc(l)}</option>`).join('');}
function settingsAction(action,ic,title,sub){return `<button class="setting-action" data-action="${action}">${icon(ic)}<span><strong>${esc(title)}</strong><small>${esc(sub)}</small></span>${icon('arrow','arrow')}</button>`;}
function cloudPanel(){
 const c=cloudState;
 const help='<a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer">Firebase 콘솔 열기 ↗</a>';
 if(!c.configured)return `<div class="cloud-stack"><span class="pill amber">초기 설정 필요</span><h3>부부 자동 동기화를 준비했어요</h3><p>GitHub Pages 앱은 사용 가능하며, Firebase 프로젝트의 웹 설정을 넣으면 각자 Google 로그인과 가족 공유가 활성화돼요.</p><p>설치 설명: <strong>FIREBASE_SETUP.md</strong> · ${help}</p><div class="cloud-note">Firebase 연결 전에도 기존 CHECK 기록은 이 브라우저에 그대로 저장됩니다. 비밀번호나 서비스 계정 키를 GitHub에 올리지 마세요.</div></div>`;
 if(c.phase==='auth-loading')return '<p>Google 로그인 상태를 확인하고 있어요…</p>';
 if(c.phase==='signed-out'||c.phase==='error')return `<div class="cloud-stack"><span class="pill blue">보호되는 가족 공간</span><h3>Google 계정으로 가족 기록 연결</h3><p>부부가 서로 다른 Google 계정으로 로그인한 후 초대 링크로 하나의 체크리스트를 공유할 수 있어요.</p><button class="primary-button" data-action="cloud-login">${icon('lock')} Google 계정으로 로그인</button><small>Google 로그인을 선택하면 Firebase 인증으로 연결됩니다. 가족 정보와 메모는 가족 구성원에게만 공개되며 일반 웹 방문자에게는 공개하지 않습니다.</small></div>`;
 if(!c.familyId)return `<div class="cloud-stack"><span class="pill blue">로그인됨</span><strong>${esc(c.email||'Google 계정')}</strong><p>새 가족을 만들면 이 기기에 저장된 CHECK 기록을 첫 가족 기록으로 가져옵니다. 배우자는 받은 초대 링크로 참여합니다.</p><div class="cloud-buttons"><button class="primary-button" data-action="cloud-create-confirm">${icon('plus')} 현재 기록으로 가족 만들기</button><button class="secondary-button" data-action="cloud-signout">로그아웃</button></div><label class="field"><span>배우자에게 받은 초대 링크</span><input id="cloud-invite-input" type="text" autocomplete="off" spellcheck="false" placeholder="링크를 붙여넣어 주세요" value="${esc(location.hash.startsWith('#join/')?location.href:'')}"></label><button class="secondary-button" data-action="cloud-join">초대 링크로 가족 참여하기</button><div class="cloud-note">배우자 계정으로 참여하면 그 가족의 클라우드 기록을 불러옵니다. 현재 기기에 남아 있는 기존 기록은 별도로 보존하며 자동으로 덮어쓰거나 합치지 않습니다.</div></div>`;
 return `<div class="cloud-stack"><div class="cloud-connect-status"><span class="cloud-online-dot"></span><div><strong>우리 가족 체크리스트 연결됨</strong><small>${esc(c.email)} · ${c.members||1}/2명 · ${esc(c.detail||'연결됨')}</small></div></div><div class="cloud-buttons">${c.owner&&c.members<2?'<button class="primary-button" data-action="cloud-invite">배우자 초대 링크 만들기</button>':''}<button class="secondary-button" data-action="cloud-import">기존 기록에서 없는 항목 추가</button><button class="secondary-button" data-action="cloud-signout">로그아웃</button></div>${c.invitationUrl?`<label class="field"><span>48시간 유효한 일회용 초대 링크</span><input readonly id="cloud-invite-url" value="${esc(c.invitationUrl)}"></label><button class="secondary-button" data-action="cloud-copy-invite">${icon('download')} 초대 링크 복사</button>`:''}${c.owner&&c.members===2?'<button class="text-button" data-action="cloud-remove-confirm">배우자 연결 해제</button>':''}<div class="cloud-note">항목별 체크·메모·가족 설정을 자동 반영합니다. 인터넷이 끊기면 이 기기 기록을 사용하며 다시 연결되면 전송을 시도해요. 같은 항목을 동시에 수정하면 마지막으로 서버에 반영된 값이 남을 수 있어요. Google 로그인·브라우저 캐시는 신뢰할 수 있는 개인 기기에서만 사용하세요.</div></div>`;
}
function updateCloudPanel(){
 const area=$('#cloud-panel');
 if(area&&!(document.activeElement?.matches('input,textarea')&&document.activeElement.closest('#cloud-panel')))area.innerHTML=cloudPanel();
 network();
 const sb=$('.sidebar-bottom strong'),hint=$('.sidebar-bottom p');
 if(sb)sb.textContent=cloudState.familyId?'부부 가족 공유 연결됨':'이 기기에 안전하게 준비';
 if(hint)hint.textContent=cloudState.familyId?'Google 로그인 · Firestore 동기화':'계정 연결 전에도 오프라인 사용';
}
function renderSettings(){
 const p=state.profile;
 const work={unknown:'아직 설정하지 않음',employee:'일반 근로자 · 고용보험 확인',public:'공무원·교원·사학 등 별도 확인',self:'자영업·프리랜서 등',other:'그 밖의 경우'};
 return heading('YOUR SETTINGS','우리 가족에 맞게','부부 가족 공유를 설정하거나 기기별 기록을 백업할 수 있어요.<br>주민번호·계좌번호·증빙 파일은 입력하지 마세요.')+
 `<section class="section-block"><h2>부부 자동 동기화</h2><div class="panel panel-pad" id="cloud-panel">${cloudPanel()}</div></section>`+
 `<section class="section-block"><h2>우리 가족 정보</h2><form id="profile-form" class="panel panel-pad"><div class="form-grid">
 <label class="field"><span>출산 예정월</span><input type="month" name="dueMonth" value="${esc(p.dueMonth)}" min="2026-01" max="2029-12" required><small>날짜를 모르면 월만 입력해도 돼요.</small></label>
 <label class="field"><span>정확한 출산 예정일 · 선택</span><input type="date" name="dueDate" value="${esc(p.dueDate)}" min="2026-01-01" max="2029-12-31"><small>입력하면 위 예정월도 함께 바뀌어요.</small></label>
 <label class="field"><span>실제 출생일 · 출산 후 입력</span><input type="date" name="birthDate" value="${esc(p.birthDate)}" min="2026-01-01" max="${today}"><small>입력 후 산후 일정이 자동 재계산돼요.</small></label>
 <label class="field"><span>주민등록 거주지역</span><select name="region">${options(REGIONS,p.region)}</select><small>직장 소재지가 아닌 실제 거주지 기준이에요.</small></label>
 <label class="field"><span>시·군·구 이름 · 선택</span><input name="district" maxlength="50" value="${esc(p.district)}" placeholder="예: 동두천시, 의정부시, 노원구"><small>지원금 자격을 자동 확정하지 않아요. 시군구 공고를 확인하세요.</small></label>
 <label class="field"><span>현재 지역 전입일 · 선택</span><input type="date" name="moveInDate" value="${esc(p.moveInDate)}" max="${today}"><small>서울 3개월·동두천 1년 등 계속 거주기간 확인에 사용해요.</small></label>
 <label class="field"><span>이번 아이의 출생순위</span><select name="childOrder">${options({unknown:'아직 설정하지 않음','1':'첫째','2':'둘째','3':'셋째 이상'},p.childOrder)}</select><small>사업마다 자녀 수 계산이 다를 수 있어요.</small></label>
 <label class="field"><span>단태아·다태아</span><select name="multiple">${options({unknown:'아직 설정하지 않음',single:'단태아',twins:'쌍둥이',more:'세쌍둥이 이상'},p.multiple)}</select><small>의료기관 확인 기준으로 입력해요.</small></label>
 <label class="field"><span>출산하는 부모의 고용형태</span><select name="motherWork">${options(work,p.motherWork)}</select></label>
 <label class="field"><span>배우자의 고용형태</span><select name="fatherWork">${options(work,p.fatherWork)}</select></label>
 <label class="field"><span>출산하는 부모의 육아휴직 시작 예정일</span><input name="motherLeaveStart" type="date" value="${esc(p.motherLeaveStart)}" min="2026-01-01" max="2030-12-31"><small>입력 시 회사 신청 준비일을 30일 전으로 계산해요.</small></label>
 <label class="field"><span>배우자의 육아휴직 시작 예정일</span><input name="fatherLeaveStart" type="date" value="${esc(p.fatherLeaveStart)}" min="2026-01-01" max="2030-12-31"><small>부모함께 특례의 준비 시점을 다시 계산해요.</small></label>
 </div><div class="form-foot"><p>예정일·출생일·휴직 시작일로 일정을 계산해요. 지역·다태아·고용형태에 명백히 맞지 않는 항목은 내 일정에서 제외하되 전체 혜택에서 볼 수 있어요. 기존 체크·메모와 해당 없음 표시는 바꾸지 않아요.</p><button class="primary-button" type="submit">우리 가족 정보 저장</button></div></form></section>
 ${storageError?`<div class="info-card amber"><div class="info-icon">${icon('info')}</div><div><h3>저장 상태를 확인해 주세요</h3><p>${esc(storageError)}</p></div></div>`:''}
 <section class="section-block"><h2>기록과 백업</h2><div class="panel settings-actions">
 ${settingsAction('export','download','JSON 백업 내려받기','설정·체크·준비물·메모를 파일로 보관해요.')}
 ${settingsAction('import','upload','백업 불러오기','현재 기록을 자동 백업한 후 선택한 파일로 교체해요.')}
 ${settingsAction('calendar','calendar','캘린더에 일정 보내기','ICS 파일을 가져와 캘린더 앱에서 알림을 설정해요.')}
 ${settingsAction('add-custom','plus','내 할 일 추가','지역 창구에서 확인한 혜택이나 개인 준비를 추가해요.')}
 ${corruptBackup?settingsAction('export-corrupt','doc','읽지 못한 기존 기록 보관','초기화 전에 원본 저장값을 내려받아 주세요.'):''}
 </div><p class="settings-warning">Google 로그인과 가족 연결이 완료되면 변경을 자동 동기화합니다. 연결 전 기록이나 다른 주소에서 만든 기록은 별도 백업·이전이 필요합니다. 저장된 브라우저 데이터나 Firebase 오프라인 캐시는 기기의 잠금을 해제한 사람에게 보일 수 있으니 공용 기기는 피하세요.</p></section>
 <section class="section-block"><h2>앱과 정보</h2><div class="panel settings-actions">
 ${settingsAction('install','phone','홈 화면에 설치하기','PC는 localhost, 휴대폰은 HTTPS 주소에서 설치해요.')}
 ${settingsAction('sources','shield','출처와 정정 기록','공식안·확정 제도·미확인 정보를 나눠 볼 수 있어요.')}
 ${settingsAction('update-check','refresh','앱 파일 업데이트 확인','정책 자동 검색이 아니에요. 배포된 새 앱 버전만 확인해요.')}
 ${settingsAction('about','info','이 앱의 범위와 한계','실제 접수·선정·입금은 해당 기관에서 확인해요.')}
 ${settingsAction('reset','refresh','이 기기의 기록 초기화','확인 후 설정·체크·메모를 지워요. 먼저 백업하세요.')}
 </div></section>`;
}
function sourceCard(s){const u=safeURL(s.url);return `<article class="source-item"><span class="pill ${s.evidenceLevel==='media'?'amber':''}">${s.evidenceLevel==='media'?'언론 보도 · 최종 확정 근거 아님':s.evidenceLevel==='organizer'?'주최기관':'공식기관'}</span><h3>${esc(s.title||'공식 안내')}</h3><p>${esc(s.publisher||'기관')} · 확인 ${esc(s.checkedAt||CHECKED_AT)}${s.publishedAt?` · 자료일 ${esc(s.publishedAt)}`:''}<br>${esc(s.access||s.verifiedClaim||'공개 자료 확인')}</p>${u?`<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(new URL(u).hostname)} ${icon('external')}</a>`:''}</article>`;}
function renderSources(){
 const audit=data.meta.linkAudit;
 return heading('출처와 정정 기록','확인한 근거를 남겨요','정보 기준일 2026년 10월 14일.<br>검색·열람 확인과 개인별 신청 승인까지의 검증은 다릅니다.')+
 (audit?`<div class="v2-audit-summary"><div><strong>${audit.attempted}</strong><span>실패 링크 브라우저 재검증</span></div><div><strong>${audit.contentVerified}</strong><span>원문 확인 · ${audit.repaired}개 주소 정정</span></div><div><strong>${audit.unresolved}</strong><span>외부 접근 제한 남음</span></div></div><details class="v2-link-limit"><summary>남은 외부 사이트 접근 제한 보기</summary>${audit.blocked.map(x=>`<p><a href="${esc(safeURL(x.url))}" target="_blank" rel="noopener noreferrer">${esc(new URL(x.url).hostname)}</a> · ${esc(x.reason)}</p>`).join('')}<p>보안 인증 우회나 보안프로그램 설치는 하지 않았어요. 로그인 뒤 개인 신청은 검증범위가 아니에요.</p></details>`:'')+
 `<section class="section-block"><div class="info-card"><div class="info-icon">${icon('shield')}</div><div><h3>보장된 지원금 목록이 아니라, 신청 준비 도구예요</h3><p>공식기관 원문·검색본문·접근 제한의 차이를 기록했어요. 미래 예산과 민간 행사는 신청 당일 다시 확인해 주세요. 모든 시군구의 세부 사업을 빠짐없이 확정한 자료는 아닙니다.</p></div></div><h2>다시 확인하거나 정정한 내용</h2>${data.corrections.filter(c=>!c.superseded).map(c=>`<details class="correction"><summary>${esc(c.claim||c.title||'확인 내용')}</summary><p>${esc(c.correction||c.detail||'상세 원문 확인')}</p>${(c.sources||[]).filter(s=>safeURL(s.url)).map(s=>`<a href="${esc(safeURL(s.url))}" target="_blank" rel="noopener noreferrer">${esc(s.publisher||s.title||'원문')} ↗</a>`).join('')}</details>`).join('')}</section>
 <section class="section-block"><h2>연결한 공개 출처 <span class="subtle-count">${data.sources.length}</span></h2><div class="source-filter"><label class="searchbox">${icon('search')}<span class="screen-reader">출처 검색</span><input id="source-search" type="search" value="${esc(ui.sourceQuery)}" placeholder="기관 이름이나 자료 제목으로 찾기"></label></div><div class="source-list" id="source-results">${data.sources.filter(s=>matchesSearch({title:s.title,summary:s.publisher},ui.sourceQuery)).map(sourceCard).join('')}</div></section>`;
}
function render(){
 if(!data)return;
 rebuild();refreshNav();
 const renderers={home:renderHome,timeline:renderTimeline,benefits:()=>renderLibrary(false),events:()=>renderLibrary(true),settings:renderSettings,sources:renderSources};
  $('#main').innerHTML=(renderers[ui.view]||renderHome)();
  if(ui.view==='timeline')requestAnimationFrame(()=>{const wrap=$('.v2-months'),active=wrap?.querySelector('.active');if(wrap&&active)wrap.scrollLeft=Math.max(0,active.offsetLeft-wrap.offsetLeft-wrap.clientWidth/2+active.clientWidth/2);});
 document.title=`${({home:'지금 챙길 일',timeline:'우리 가족 일정',benefits:'혜택',events:'이벤트',settings:'설정',sources:'출처와 정정'})[ui.view]||'홈'} · CHECK`;
 updateCloudPanel();
}
function openItem(id){
 const item=itemById(id);if(!item){toast('이 항목은 현재 데이터에서 찾지 못했어요.');return;}
 activeItemId=id;lastFocus=document.activeElement;renderDetail(item);
 if(!$('#detail-dialog').open)$('#detail-dialog').showModal();
}
function externalLink(l){
 const url=safeURL(l.url);if(!url)return '';
 const isTel=url.startsWith('tel:');
 const label={apply:'신청 경로',portal:'포털에서 직접 검색',guide:'안내',source:'근거 원문',contact:'전화 문의',event:'모집 공고'}[l.type]||'안내';
 let host=isTel?url.slice(4):new URL(url).hostname;
 return `<a class="external-link${l.linkVerification?.result==='blocked'?' blocked':''}" href="${esc(url)}"${isTel?'':' target="_blank" rel="noopener noreferrer"'}>${icon(isTel?'phone':l.type==='apply'?'external':'doc')}<span>${esc(l.label)}<small>${esc(label)} · ${esc(host)}</small>${l.linkVerification?.result==='blocked'?'<span class="link-verification-note">현재 브라우저 접근 제한 · 아래 기관 안내도 확인</span>':l.linkVerification?.result==='repaired'?'<span class="link-verification-note">본문·메뉴를 대조해 수정한 주소</span>':''}</span>${icon('external','external-arrow')}</a>`;
}
function profileAdvice(item){
 const p=state.profile,notes=[];
 if(item.regimeNotice)notes.push(item.regimeNotice);
 if(item.region!=='all'&&!item.mine)notes.push(p.region==='unknown'?'거주지역을 설정하지 않았어요. 내 지역 혜택인지 먼저 확인하세요.':'현재 설정한 거주지역과 달라요. 지역 조건을 충족하는지 확인하세요.');
 if(item.id.includes('multiple')&&p.multiple==='single')notes.push('설정은 단태아예요. 다태아 전용 지원은 일반적으로 해당하지 않으므로 상세 요건을 확인하세요.');
 if(item.category==='직장'&&['public'].includes(p.motherWork))notes.push('출산하는 부모가 별도 보수체계로 설정돼 있어요. 고용보험 급여를 그대로 적용하지 말고 소속기관에 확인하세요.');
 if(item.id.includes('2027')||item.id==='review-birth-cutoff'){
  if(p.birthDate)notes.push(p.birthDate<'2027-07-01'?'입력한 출생일은 공식 예산안의 7월 1일 경계 이전이에요. 최종 시행법령과 현행급여 적용을 확인하세요.':'입력한 출생일이 7월 1일 이후여도 예산안만으로 대상 확정은 아니에요. 최종 시행공고를 확인하세요.');
 }
 return notes;
}
function renderDetail(item){$('#detail-dialog').innerHTML=detailV2(item,v2Context());}
function utility(title,content,buttons=''){
 lastFocus=document.activeElement;
 $('#utility-dialog').innerHTML=`<div class="dialog-top"><span class="tiny-label">CHECK</span><button class="icon-button" data-action="close-utility" aria-label="창 닫기">${icon('close')}</button></div><div class="utility-body"><h2 id="utility-title">${title}</h2>${content}${buttons?`<div class="utility-buttons">${buttons}</div>`:''}</div>`;
 if(!$('#utility-dialog').open)$('#utility-dialog').showModal();
}
function installGuide(){
 const secure=window.isSecureContext;
 utility('홈 화면에 CHECK를',`<p>자주 쓰는 앱처럼 꺼내 보세요. 처음 온라인으로 연 뒤에는 저장된 체크리스트를 오프라인에서도 사용할 수 있어요.</p>
 ${deferredInstall?'<button class="primary-button wide" data-action="install-native">이 기기에 앱 설치</button>':''}
 <h3>PC · Chrome / Edge</h3><ol><li><code>START_CHECK.cmd</code>를 실행해 앱을 여세요.</li><li>주소창의 설치 아이콘 또는 브라우저 메뉴의 ‘앱 설치’를 선택하세요.</li><li>같은 주소를 계속 사용해야 기존 기록이 보여요.</li></ol>
 <h3>Android · Chrome</h3><p>앱 파일을 올린 <strong>HTTPS 주소</strong>로 접속한 뒤 메뉴 → ‘앱 설치’ 또는 ‘홈 화면에 추가’를 선택하세요.</p>
 <h3>iPhone · Safari</h3><p>HTTPS 주소로 접속 → 공유 버튼 → ‘홈 화면에 추가’를 선택하세요. 설치 메뉴 이름은 OS 버전에 따라 달라질 수 있어요.</p>
 <div class="utility-info">${secure?'현재 페이지는 보안 컨텍스트예요.':'현재 페이지는 설치 요건을 충족하지 않는 HTTP 또는 파일 주소예요.'}<br>휴대폰에서 PC의 localhost는 열리지 않아요. 같은 Wi-Fi의 일반 HTTP IP 주소도 PWA 설치를 위한 HTTPS를 대신하지 못합니다. 휴대폰 실기기 설치는 아직 검증하지 않았어요.</div><p>앱 배포용 파일과 설치 설명은 CHECK 폴더의 <code>INSTALL.md</code>에 있어요. 이 앱은 서버 푸시나 자동 정책 검색을 제공하지 않아요.</p>`, '<button class="primary-button" data-action="close-utility">확인했어요</button>');
}
function calendarDialog(){
 const available=allItems.filter(i=>i.forMyTimeline&&i.kind!=='event'&&i.status!=='ended'&&isOpen(i)&&i.schedule.date&&i.schedule.date.slice(0,7)>=RANGE.start&&i.schedule.date.slice(0,7)<=RANGE.end);
 const precise=available.filter(i=>i.schedule.precise).length,estimated=available.length-precise;
 utility('캘린더로 준비 일정 보내기',`<p>열려 있는 내 지역·전국 항목을 ICS 파일로 내려받아요. 실제 접수 마감이 아니라 <strong>준비 권장일</strong>이에요.</p><div class="utility-info">날짜를 정할 수 있는 일정 ${precise}개<br>아직 임시인 일정 ${estimated}개</div><label class="document-check"><input type="checkbox" id="ics-estimates"><span>임시 일정도 포함하기<br><small>예정월만 입력한 경우 계산용 15일을 기준으로 배치돼요. ‘임시’라고 표시되며 출산 후 다시 내보내야 해요.</small></span></label><p>Google·Apple·삼성 캘린더에 파일을 가져온 뒤 알림 설정을 확인하세요. 파일에는 7일 전 알림이 들어 있지만 캘린더가 적용하는지는 별도로 확인해야 해요.</p><p>재가져오기는 중복 일정을 만들 수 있어요. 전용 CHECK 캘린더를 만들고 이전 일정을 정리한 후 다시 가져오는 편이 안전해요. 미래 일정을 앱이 자동으로 갱신하지 않아요.</p>`, '<button class="secondary-button" data-action="close-utility">취소</button><button class="primary-button" data-action="download-ics">ICS 내려받기</button>');
}
function customDialog(){
 utility('나만의 준비 추가',`<p>지역 창구에서 확인한 혜택이나 개인 준비를 기록해요.</p><form id="custom-form"><label class="field"><span>할 일 이름</span><input name="title" maxlength="120" required placeholder="예: 보건소 유축기 대여 예약"></label><label class="field"><span>준비할 날짜</span><input name="date" type="date" value="${ui.month}-15" min="2026-01-01" max="2030-12-31" required></label><label class="field"><span>기억할 내용</span><textarea name="summary" maxlength="2000" placeholder="신청 조건이나 준비물을 적어보세요."></textarea></label><label class="field"><span>안내 링크 · 선택</span><input name="url" type="url" maxlength="2500" placeholder="https://"></label><div class="utility-buttons"><button type="button" class="secondary-button" data-action="close-utility">취소</button><button class="primary-button" type="submit">할 일 추가</button></div></form>`);
}
function download(name,text,mime='application/json'){
 const url=URL.createObjectURL(new Blob([text],{type:mime}));const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);
}
function exportState(prefix='CHECK-backup'){download(`${prefix}-${today}.json`,JSON.stringify({...state,exportedAt:new Date().toISOString(),app:'CHECK'},null,2));toast('백업 파일을 내려받았어요. 안전한 곳에 보관해 주세요.');}
function toast(message,undo=false){clearTimeout(toastTimer);$('#toast').innerHTML=`<span>${esc(message)}</span>${undo?'<button data-action="undo">되돌리기</button>':''}`;$('#toast').hidden=false;toastTimer=setTimeout(()=>$('#toast').hidden=true,undo?6500:4500);}
function refreshAfterChange({detail=false}={}){render();if(detail&&activeItemId&&$('#detail-dialog').open){const scroll=$('#detail-dialog').scrollTop;renderDetail(itemById(activeItemId));$('#detail-dialog').scrollTop=scroll;}}
async function handleAction(action,button){
 if(action==='cloud-login'){
  if(!cloudClient){toast('Firebase 설정을 먼저 완료해 주세요.');return;}
  try{await cloudClient.signIn();}catch(err){toast(err?.message||'Google 로그인에 실패했어요. 팝업·승인 도메인을 확인해 주세요.');}
  return;
 }
 if(action==='cloud-signout'){
  await cloudClient?.signOut();toast('Google 계정에서 로그아웃했어요. 이전 기기 기록은 별도로 보존됩니다.');return;
 }
 if(action==='cloud-create-confirm'){
  utility('새 가족 공간을 만들까요?',`<p>현재 이 기기의 체크, 준비서류 상태, 개인 할 일, 가족 설정, 메모를 <strong>Firebase의 새 가족 공간</strong>에 복사합니다. 이후 초대받은 배우자와 공유할 수 있어요.</p><p>현재 CHECK 로컬 기록은 삭제하지 않으며, 별도 JSON 백업을 권장합니다. 주민번호·계좌번호·진단서 내용은 메모에 적지 마세요.</p>`,
    '<button class="secondary-button" data-action="close-utility">취소</button><button class="primary-button" data-action="cloud-create">가족 만들기</button>');return;
 }
 if(action==='cloud-create'){
  $('#utility-dialog').close();exportState('CHECK-before-family');
  try{await cloudClient.createFamily();toast('가족 공간을 만들고 이 기기 기록을 연결했어요.');}
  catch(err){toast(err?.message||'가족 공간 생성에 실패했어요. Firebase 규칙과 인터넷을 확인해 주세요.');}
  return;
 }
 if(action==='cloud-invite'){
  try{await cloudClient.createInvite();updateCloudPanel();toast('초대 링크가 만들어졌어요. 배우자에게만 전달하세요.');}
  catch(err){toast(err?.message||'초대 링크를 만들지 못했어요.');}
  return;
 }
 if(action==='cloud-copy-invite'){
  try{await navigator.clipboard.writeText(cloudState.invitationUrl||'');toast('초대 링크를 복사했어요. 배우자에게만 보내세요.');}
  catch{toast('복사가 안 되면 링크 입력란을 길게 눌러 복사해 주세요.');}
  return;
 }
 if(action==='cloud-join'){
  const raw=$('#cloud-invite-input')?.value||'';
  if(!raw.trim()){toast('배우자에게 받은 초대 링크를 붙여넣어 주세요.');return;}
  try{await cloudClient.joinFamily(raw);history.replaceState(null,'',location.pathname+'#settings');render();toast('부부 가족 공간에 연결됐어요.');}
  catch(err){toast(err?.message||'가족 참여에 실패했어요. 초대 링크 만료·사용 여부를 확인해 주세요.');}
  return;
 }
 if(action==='cloud-remove-confirm'){
  utility('배우자 연결을 해제할까요?',`<p>상대 계정의 <strong>새로운 Firestore 접근권한</strong>을 해제합니다. 이미 배우자의 기기에 저장된 오프라인 기록까지 원격으로 삭제할 수는 없습니다.</p><p>기록을 공유하기 전 꼭 당사자 간에 확인해 주세요.</p>`,
    '<button class="secondary-button" data-action="close-utility">취소</button><button class="primary-button" data-action="cloud-remove">연결 해제</button>');return;
 }
 if(action==='cloud-remove'){
  $('#utility-dialog').close();
  try{await cloudClient.removePartner();toast('배우자의 새 클라우드 접근을 해제했어요.');}catch(err){toast(err?.message||'연결 해제에 실패했어요.');}
  return;
 }
 if(action==='cloud-import'){$('#import-file').value='';$('#import-file').click();return;}
 if(action==='confirm-cloud-merge'&&pendingImport){
  const legacy=pendingImport;pendingImport=null;$('#utility-dialog').close();
  try{const result=await cloudClient.mergeLegacy(legacy);toast(`기존 기록에서 ${result.added}개를 가족 공간에 추가했어요. 이미 있던 항목은 바꾸지 않았어요.`);}
  catch(err){toast(err?.message||'기록 병합 중 문제가 생겼어요. 기존 체크는 보존됩니다.');}
  return;
 }
 if(action==='mark-applied'){flushNotes();const saved=setCheck(activeItemId,{status:'applied'});refreshAfterChange({detail:true});toast(saved?'신청했어요로 기록했어요. 실제 접수 완료 여부는 기관에서 확인하세요.':'기기 저장이 되지 않았어요. 백업해 주세요.');return;}
 if(action==='toggle'){
  const item=itemById(button.dataset.id);if(!item)return;
  undoState={id:item.id,check:{...item.check,docs:[...item.check.docs]}};
  const value=item.check.status==='done'?'todo':'done';const saved=setCheck(item.id,{status:value});render();toast(saved?(value==='done'?'준비 하나를 챙겼어요.':'준비 전으로 되돌렸어요.'):'현재 창에서만 변경됐어요. 백업을 내려받아 주세요.',true);return;
 }
 if(action==='undo'&&undoState){state.checks[undoState.id]=undoState.check;persist();rebuild();render();toast('직전 변경을 되돌렸어요.');undoState=null;return;}
 if(action==='this-month'){ui.month=within(today.slice(0,7));ui.year=ui.month.slice(0,4);render();return;}
 if(action==='close-detail'){flushNotes();$('#detail-dialog').close();return;}
 if(action==='close-utility'){$('#utility-dialog').close();return;}
 if(action==='install'){installGuide();return;}
 if(action==='install-native'){
  if(!deferredInstall){toast('브라우저 메뉴에서 설치해 주세요.');return;}
  try{await deferredInstall.prompt();await deferredInstall.userChoice;}catch{toast('설치를 열지 못했어요. 브라우저 메뉴를 확인해 주세요.');}deferredInstall=null;$('#utility-dialog').close();return;
 }
 if(action==='export'){flushNotes();exportState();return;}
 if(action==='export-corrupt'){download(`CHECK-unreadable-${today}.txt`,corruptBackup,'text/plain');return;}
 if(action==='import'){$('#import-file').value='';$('#import-file').click();return;}
 if(action==='confirm-import'&&pendingImport){
  if(corruptBackup)download(`CHECK-before-restore-unreadable-${today}.txt`,corruptBackup,'text/plain');else exportState('CHECK-before-restore');
  state=pendingImport;pendingImport=null;corruptBackup='';storageError='';const saved=persist();rebuild();$('#utility-dialog').close();render();toast(saved?'백업을 불러왔어요.':'불러왔지만 기기 저장에 실패했어요.');return;
 }
 if(action==='calendar'){flushNotes();calendarDialog();return;}
 if(action==='download-ics'){
  const entries=allItems.filter(i=>i.forMyTimeline&&i.kind!=='event'&&i.status!=='ended'&&i.schedule.date?.slice(0,7)>=RANGE.start&&i.schedule.date?.slice(0,7)<=RANGE.end);
  const result=buildICS(entries,{includeEstimates:$('#ics-estimates')?.checked});
  if(!result.count){toast('내보낼 확정 준비일이 없어요. 날짜를 입력하거나 임시 일정 포함을 선택해 주세요.');return;}
  download(`CHECK-calendar-${today}.ics`,result.text,'text/calendar;charset=utf-8');$('#utility-dialog').close();toast(`${result.count}개 준비 일정을 내보냈어요. 임시·날짜 미설정 ${result.skipped}개 제외.`);return;
 }
 if(action==='add-custom'){if(state.custom.length>=100){toast('개인 할 일은 최대 100개까지 저장할 수 있어요.');return;}customDialog();return;}
 if(action==='sources'){go('sources');return;}
 if(action==='reviewed'){
  setCheck(activeItemId,{reviewed:today});refreshAfterChange({detail:true});toast('내가 원문을 확인한 날짜를 기록했어요. 공식 기준일은 바뀌지 않아요.');return;
 }
 if(action==='share-item'){
  const url=new URL(location.href);url.hash=`item/${activeItemId}`;
  try{await navigator.clipboard.writeText(url.href);toast('항목 링크를 복사했어요. 링크에는 체크나 메모가 포함되지 않아요.');}catch{utility('항목 링크',`<p>다른 기기에서는 같은 배포 주소에 접근할 수 있어야 해요. 링크 자체에는 체크나 메모가 포함되지 않아요.</p><label class="field"><span>복사할 링크</span><input readonly value="${esc(url.href)}"></label>`);}
  return;
 }
 if(action==='update-check'){
  if(!registration){toast('앱 설치 환경이 아니거나 서비스 워커가 준비되지 않았어요.');return;}
  try{await registration.update();if(registration.waiting){waitingWorker=registration.waiting;$('#update-banner').hidden=false;toast('새 앱 버전을 적용할 수 있어요.');}else toast('앱 파일 업데이트를 확인했어요. 정책 정보가 자동으로 재조사되는 것은 아니에요.');}catch{toast('업데이트를 확인하지 못했어요. 인터넷 연결을 확인해 주세요.');}return;
 }
 if(action==='update'&&waitingWorker){flushNotes();reloadForUpdate=true;waitingWorker.postMessage({type:'SKIP_WAITING'});return;}
 if(action==='reset'){
  if(cloudClient?.familyId){toast('공유 중인 가족의 기록을 실수로 지우지 않도록 초기화를 제한했어요. 먼저 로그아웃해 기기별 기록을 정리하세요.');return;}
  utility('기록을 초기화할까요?',`<p>이 브라우저에 저장된 가족 설정, 체크, 서류 준비 표시, 메모와 개인 할 일을 지워요. 혜택 원문 데이터는 그대로 남아요.</p><p>‘초기화’를 누르면 먼저 현재 기록의 백업 파일을 내려받습니다.</p>`,'<button class="secondary-button" data-action="close-utility">취소</button><button class="primary-button danger-button" data-action="confirm-reset">백업 후 초기화</button>');return;
 }
 if(action==='confirm-reset'){if(corruptBackup)download(`CHECK-unreadable-${today}.txt`,corruptBackup,'text/plain');else exportState('CHECK-before-reset');state=freshState();corruptBackup='';storageError='';persist();$('#utility-dialog').close();render();toast('이 기기의 기록을 초기화했어요.');return;}
 if(action==='delete-custom'){utility('개인 할 일을 삭제할까요?',`<p>‘${esc(itemById(activeItemId)?.title)}’ 항목과 메모가 삭제됩니다.</p>`,'<button class="secondary-button" data-action="close-utility">취소</button><button class="primary-button danger-button" data-action="confirm-delete-custom">삭제</button>');return;}
 if(action==='confirm-delete-custom'){state.custom=state.custom.filter(c=>c.id!==activeItemId);delete state.checks[activeItemId];persist();$('#utility-dialog').close();$('#detail-dialog').close();render();toast('개인 할 일을 삭제했어요.');return;}
 if(action==='about'){utility('작지만, 중요한 기준',`<p>CHECK는 임신부터 육아까지의 신청 준비를 돕는 개인용 앱이에요. 공식기관·Toss와 제휴하지 않았어요.</p><h3>할 수 있는 일</h3><p>날짜·지역별 준비, 체크·서류·메모 저장, 공식 링크 확인, Google 로그인 후 부부 가족 공간 동기화(설정한 경우).</p><h3>하지 않는 일</h3><p>개인 자격 심사, 자동 정부 신청, 은행·보험 조회, 실제 지급 확인, 자동 정책 업데이트, 서버 푸시는 제공하지 않습니다.</p><h3>기기와 계정 주의</h3><p>클라우드를 연결하면 가족 프로필·메모가 Firebase에 저장되며 부부 모두 볼 수 있어요. 민감한 주민번호·계좌·진단서 정보는 입력하지 마세요. 기기의 오프라인 사본은 원격으로 삭제할 수 없습니다.</p><h3>의료·금융 판단</h3><p>검진·접종일과 근무 가능 여부는 의료진에게, 세금·대출·휴가 자격은 담당기관에 확인하세요.</p>`,'<button class="primary-button" data-action="close-utility">확인했어요</button>');}
}
function flushNotes(){
 clearTimeout(notesTimer);const el=$('#item-notes');
 if(el&&activeItemId&&itemById(activeItemId)&&el.value!==checkFor(state,activeItemId).notes){setCheck(activeItemId,{notes:el.value.slice(0,4000)});}
}
document.addEventListener('click',e=>{
 const view=e.target.closest('[data-view]');if(view){ui.category='전체';ui.query='';ui.information='all';go(view.dataset.view);return;}
 const open=e.target.closest('[data-open]');if(open){openItem(open.dataset.open);return;}
 const action=e.target.closest('[data-action]');if(action){e.preventDefault();handleAction(action.dataset.action,action).catch(err=>{console.error(err);toast('처리하지 못했어요. 백업 후 다시 시도해 주세요.');});return;}
 const year=e.target.closest('[data-year]');if(year){ui.year=year.dataset.year;const oldMonth=ui.month.slice(5);ui.month=within(`${ui.year}-${oldMonth}`);if(!ui.month.startsWith(ui.year))ui.month=monthsInRange().find(m=>m.startsWith(ui.year));render();return;}
 const month=e.target.closest('[data-month]');if(month){ui.month=month.dataset.month;render();return;}
 const info=e.target.closest('[data-information]');if(info){ui.information=info.dataset.information;render();return;}
 const category=e.target.closest('[data-category]');if(category){ui.category=category.dataset.category;render();return;}
 const status=e.target.closest('[data-item-status]');if(status){flushNotes();const saved=setCheck(activeItemId,{status:status.dataset.itemStatus});refreshAfterChange({detail:true});toast(saved?'진행상태를 저장했어요.':'기기 저장에 실패했어요. 백업해 주세요.');}
});
document.addEventListener('input',e=>{
 if(e.target.id==='benefit-search'){ui.query=e.target.value;$('#library-results').innerHTML=libraryBody(ui.view==='events');}
 if(e.target.id==='source-search'){ui.sourceQuery=e.target.value;$('#source-results').innerHTML=data.sources.filter(s=>matchesSearch({title:s.title,summary:s.publisher},ui.sourceQuery)).map(sourceCard).join('');}
 if(e.target.id==='item-notes'){clearTimeout(notesTimer);$('#note-save-status').textContent='저장 중…';notesTimer=setTimeout(()=>{const saved=setCheck(activeItemId,{notes:e.target.value.slice(0,4000)});const label=$('#note-save-status');if(label)label.textContent=saved?'이 기기에 저장했어요':'저장에 실패했어요. JSON 백업을 내려받아 주세요.';},350);}
});
document.addEventListener('change',e=>{
 if(e.target.id==='status-filter'){ui.status=e.target.value;$('#library-results').innerHTML=libraryBody(ui.view==='events');}
 if(e.target.id==='mine-only'){ui.mineOnly=e.target.checked;$('#library-results').innerHTML=libraryBody(ui.view==='events');}
 if(e.target.id==='timeline-events'){ui.timelineEvents=e.target.checked;render();}
 if(e.target.id==='hide-complete'){ui.hideComplete=e.target.checked;render();}
 if(e.target.hasAttribute('data-doc')){
  const n=Number(e.target.dataset.doc),current=checkFor(state,activeItemId);const docs=new Set(current.docs);e.target.checked?docs.add(n):docs.delete(n);setCheck(activeItemId,{docs:[...docs]});const item=itemById(activeItemId);$('#doc-progress').textContent=`${docs.size}/${item.documents.length}`;
 }
 if(e.target.id==='item-date'){const v=e.target.value;if(v&&!parseDate(v)){toast('올바른 날짜를 입력해 주세요.');return;}setCheck(activeItemId,{date:v});refreshAfterChange({detail:true});}
});
document.addEventListener('submit',e=>{
 if(e.target.id==='profile-form'){
  e.preventDefault();const values=Object.fromEntries(new FormData(e.target));
  if(values.birthDate&&values.birthDate>today){toast('실제 출생일은 출산 후 입력해 주세요.');return;}
  state.profile=sanitizeProfile(values);const saved=persist();render();toast(saved?'우리 가족 정보와 준비 일정을 업데이트했어요.':'현재 창에 적용했어요. 기기 저장은 실패했으니 백업해 주세요.');
 }
 if(e.target.id==='custom-form'){
  e.preventDefault();const f=Object.fromEntries(new FormData(e.target));if(!f.title.trim()||!parseDate(f.date))return;
  if(f.url&&!safeURL(f.url)){toast('http 또는 https 안내 링크를 입력해 주세요.');return;}
  const id=`custom-${globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
  state.custom.push({id,title:f.title.trim().slice(0,120),summary:f.summary.slice(0,2000),url:safeURL(f.url),date:f.date});persist();$('#utility-dialog').close();render();toast('개인 준비 항목을 추가했어요.');
 }
});
$('#import-file').addEventListener('change',async e=>{
 const file=e.target.files[0];if(!file)return;
 if(file.size>3*1024*1024){toast('백업 파일은 3MB 이하만 읽을 수 있어요.');return;}
 try{
  const parsed=JSON.parse(await file.text());pendingImport=sanitizeState(parsed);
  if(cloudClient?.familyId){
    utility('기존 기록을 가족 공간에 추가할까요?',`<p>체크 기록 ${Object.keys(pendingImport.checks).length}개와 개인 할 일 ${pendingImport.custom.length}개가 있는 파일입니다.</p><p><strong>클라우드에 없는 항목만 추가합니다.</strong> 배우자가 이미 작성한 체크·메모는 덮어쓰지 않고, 가족 프로필도 자동 변경하지 않습니다.</p><div class="utility-info">보내기 전에 민감한 메모가 있는지 확인해 주세요. 항목별 작성 내용은 부부 모두 볼 수 있습니다.</div>`,'<button class="secondary-button" data-action="close-utility">취소</button><button class="primary-button" data-action="confirm-cloud-merge">없는 항목만 추가</button>');
  }else{
    utility('백업으로 기록을 바꿀까요?',`<p>선택한 파일의 설정과 ${Object.keys(pendingImport.checks).length}개 체크 기록, 개인 할 일 ${pendingImport.custom.length}개를 불러옵니다.</p><p>현재 기록과 자동 병합하지 않아요. 지금 기록은 교체 전에 별도의 백업 파일로 내려받습니다.</p><div class="utility-info">백업에는 가족 정보와 메모가 포함될 수 있어요. 본인이 신뢰하는 CHECK 파일만 불러오세요.</div>`,'<button class="secondary-button" data-action="close-utility">취소</button><button class="primary-button" data-action="confirm-import">백업 후 불러오기</button>');
  }
 }catch{pendingImport=null;toast('올바른 CHECK 백업 파일이 아니에요. 기존 기록은 바꾸지 않았어요.');}
});
for(const name of ['detail-dialog','utility-dialog']){
 const dialog=$(`#${name}`);
 dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom){if(name==='detail-dialog')flushNotes();dialog.close();}}});
 dialog.addEventListener('cancel',()=>{if(name==='detail-dialog')flushNotes();});
 dialog.addEventListener('close',()=>{let closedId='';if(name==='detail-dialog'){flushNotes();closedId=activeItemId;activeItemId='';if(location.hash===`#item/${closedId}`)history.replaceState(null,'',`${location.pathname}${location.search}#benefits`);render();}if(lastFocus?.isConnected)lastFocus.focus({preventScroll:true});else if(closedId)document.querySelector(`[data-open="${CSS.escape(closedId)}"]`)?.focus({preventScroll:true});});
}
function activateCloudFamily(familyId,seedLegacy){
 flushNotes();
 const legacy=cloneState(state);
 currentStorageKey=familyStorageKey(familyId);
 storageError='';corruptBackup='';
 const existing=readState(currentStorageKey);
 let hasStored=false;
 try{hasStored=!!localStorage.getItem(currentStorageKey);}catch{}
 state=hasStored?existing:seedLegacy?legacy:freshState();
 lastSavedState=cloneState(state);
 persist({remote:true});rebuild();render();
}
function leaveCloudFamily(){
 flushNotes();currentStorageKey=STORAGE_KEY;storageError='';corruptBackup='';
 state=readState();lastSavedState=cloneState(state);rebuild();render();
}
function receiveCloudMessage(change){
 if(!cloudClient?.familyId)return;
 if(change.type==='profile'){state.profile=sanitizeProfile(change.value);}
 if(change.type==='check'){
  if(document.activeElement?.id==='item-notes'&&activeItemId===change.id)return;
  state.checks[change.id]=change.value;
 }
 if(change.type==='custom'){
  state.custom=state.custom.filter(v=>v.id!==change.id);
  if(change.value)state.custom.push(change.value);
 }
 persist({remote:true});rebuild();
 if(!$('#detail-dialog').open)render();
 else if(document.activeElement?.id!=='item-notes'&&activeItemId===change.id)renderDetail(itemById(change.id));
}
async function initCloud(){
 const config=window.CHECK_FIREBASE_CONFIG;
 cloudState.configured=validConfig(config);
 if(!cloudState.configured){updateCloudPanel();return;}
 try{
  const mod=await import('./cloud-sync.bundle.js');
  cloudClient=mod.createFamilyCloud(config,{
   getState:()=>cloneState(state),
   activateFamily:activateCloudFamily,leaveFamily:leaveCloudFamily,
   onRemote:receiveCloudMessage,
   onStatus:next=>{cloudState={...cloudState,...next};updateCloudPanel();},
   onError:message=>toast(message)
  });
 }catch(err){
  console.error('Cloud SDK initialization error',err);
  cloudState.phase='error';cloudState.detail='Firebase 연결 모듈을 시작하지 못했어요. 설정과 접속 도메인을 확인해 주세요.';
  updateCloudPanel();
 }
}
function network(){
 const el=$('#network-status');
 if(cloudState.familyId)el.textContent=navigator.onLine?(cloudState.pending?'가족 동기화 중':'가족 자동 동기화'):'오프라인 · 재연결 대기';
 else el.textContent=navigator.onLine?'내 기기에 저장':'오프라인';
 el.classList.toggle('offline',!navigator.onLine);
}
window.addEventListener('online',network);window.addEventListener('offline',network);
window.addEventListener('hashchange',route);
window.addEventListener('beforeunload',flushNotes);
window.addEventListener('pagehide',flushNotes);
window.addEventListener('storage',e=>{if(e.key!==currentStorageKey||!e.newValue||$('#detail-dialog').open)return;try{state=sanitizeState(JSON.parse(e.newValue));lastSavedState=cloneState(state);render();toast('다른 탭의 기록 변경을 반영했어요.');}catch{toast('다른 탭의 기록을 읽지 못했어요. 새로고침 전에 백업해 주세요.');}});
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e;});
window.addEventListener('appinstalled',()=>{deferredInstall=null;toast('CHECK를 설치했어요. 중요한 기록은 정기적으로 백업해 주세요.');});
async function registerSW(){
 if(!('serviceWorker' in navigator)||!window.isSecureContext||location.protocol==='file:')return;
 try{
  registration=await navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'});
  const notice=()=>{if(registration.waiting){waitingWorker=registration.waiting;$('#update-banner').hidden=false;}};notice();
  registration.addEventListener('updatefound',()=>{const worker=registration.installing;worker?.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller)notice();});});
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(reloadForUpdate)location.reload();});
 }catch(err){console.warn('PWA offline registration failed',err);toast('오프라인 저장을 준비하지 못했어요. 연결과 실행 주소를 확인해 주세요.');}
}
async function boot(){
 $('#install-top').innerHTML=icon('download');$('#settings-top').innerHTML=icon('settings');network();
 try{
  const response=await fetch('./data.json');if(!response.ok)throw Error(`HTTP ${response.status}`);data=await response.json();
  if(!Array.isArray(data.items)||!Array.isArray(data.sources))throw Error('Data schema missing');
  state=readState();lastSavedState=cloneState(state);rebuild();route();$('#footer-meta').textContent=`정보 확인일 ${data.meta.checkedAt.replaceAll('-','.')} · 실제 신청·선정은 해당 기관에서`;
  await registerSW();
  await initCloud();
 }catch(err){
  console.error(err);$('#main').innerHTML=`<div class="loading"><span class="loading-check">!</span><h1>체크리스트를 열지 못했어요</h1><p>CHECK 폴더의 START_CHECK.cmd를 실행한 다음<br>http://localhost:4317 주소로 접속해 주세요.</p><p>HTML 파일을 더블클릭하는 file:// 방식은 지원하지 않아요.<br>오프라인 첫 방문이라면 먼저 인터넷 연결 상태에서 한 번 열어 주세요.</p><button class="primary-button" id="retry-load">다시 열기</button></div>`;$('#retry-load').onclick=()=>location.reload();
 }
}
boot();
