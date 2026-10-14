// CHECK v2 presentation layer. No network, storage, or eligibility side effects.
import {STATUS,EVIDENCE,REGIONS,monthLabel,dateLabel,fullDateLabel,addMonths,addDays,monthsInRange,isOpen,rankItems,safeURL} from './engine.js';

const progressNames={todo:'준비 전',doing:'준비 중',applied:'신청했어요',done:'챙겼어요',na:'해당 없음'};
export function evidenceText(item){
  if(item.kind==='custom')return '내가 추가한 항목';
  if(item.status==='ended')return '확인된 회차 종료';
  if(item.status==='unverified')return '상세 미확인';
  if(item.status==='future-check')return item.id.startsWith('future-')?'계획 · 미확정':'새 공고 확인';
  if(item.kind==='event')return '주최사 안내 확인';
  if(item.status==='conditional')return '조건부 · 개별 확인';
  return '공식 기준 확인';
}
export function badgeV2(item,{esc,icon}){
  const state=item.status,cl=state==='current'?'green':state==='conditional'?'blue':'amber';
  return `<span class="pill info-state ${cl}" title="정보 상태 · 내 신청상태와 별개">${icon(state==='current'?'shield':'info')}${esc(evidenceText(item))}</span>`;
}
export function rowV2(item,{esc,icon,badge,date=true,summary=false}){
  const done=item.check.status==='done',na=item.check.status==='na';
  const schedule=item.schedule.date?(item.schedule.precise?dateLabel(item.schedule.date):monthLabel(item.schedule.date.slice(0,7))):'날짜 미정';
  return `<div class="task-row v2-task${done?' done':''}" data-item="${esc(item.id)}">
    <button class="task-check${done?' done':''}${na?' na':''}" data-action="toggle" data-id="${esc(item.id)}" aria-label="${esc(item.title)} ${done?'완료 취소':'완료로 표시'}" aria-pressed="${done}">${done?icon('check'):na?icon('minus'):''}</button>
    <button class="task-body" data-open="${esc(item.id)}"><span class="task-title">${esc(item.title)}</span><span class="task-meta">${badge(item)}${date?`<span class="task-date">${esc(schedule)}</span>`:''}</span>${summary?`<span class="task-sub">${esc(item.applicationDeadline||item.summary)}</span>`:''}</button>
    <button class="row-state ${esc(item.check.status)}" data-open="${esc(item.id)}" aria-label="${esc(item.title)} 내 진행상태 ${esc(progressNames[item.check.status])}">${esc(progressNames[item.check.status])}${icon('arrow')}</button>
  </div>`;
}
function empty(ctx,title,body){return `<div class="empty"><div class="empty-icon">${ctx.icon('check')}</div><h3>${ctx.esc(title)}</h3><p>${ctx.esc(body)}</p></div>`;}
function phaseLabel(month,p){
  const start=p.birthDate||p.dueDate||p.dueMonth+'-15';
  const diff=(Number(month.slice(0,4))-Number(start.slice(0,4)))*12+Number(month.slice(5))-Number(start.slice(5,7));
  return diff<0?'임신 중 준비':diff===0?'출산 무렵':`생후 약 ${diff}개월`;
}
export function homeV2(ctx){
  const {items,state,data,month,today,esc,icon,row}=ctx,p=state.profile;
  const pool=items.filter(i=>i.forMyTimeline&&i.kind!=='event'&&i.status!=='ended');
  const current=pool.filter(i=>i.schedule.date?.slice(0,7)===month);
  const priority=['national-pregnancy-health-voucher','national-maternal-child-handbook','national-folic-acid','work-early','health-pregnant-flu-2026','local-find-all'];
  const sort=(a,b)=>(priority.indexOf(a.id)<0?99:priority.indexOf(a.id))-(priority.indexOf(b.id)<0?99:priority.indexOf(b.id))||rankItems(a,b);
  const pending=current.filter(isOpen).sort(sort),done=current.filter(i=>i.check.status==='done').length,total=current.filter(i=>i.check.status!=='na').length;
  const conditional=pending.filter(i=>i.profileFit.conditional),core=pending.filter(i=>!i.profileFit.conditional);
  const next=pool.filter(i=>isOpen(i)&&i.schedule.date?.slice(0,7)>month).sort((a,b)=>a.schedule.date.localeCompare(b.schedule.date)).slice(0,3);
  const before=pool.filter(i=>isOpen(i)&&i.kind!=='routine'&&i.schedule.date?.slice(0,7)<month).sort(rankItems);
  const sourceDate=data.meta.checkedAt.replaceAll('-','.');
  return `<div class="page-heading v2-heading"><div><div class="eyebrow">우리 가족의 시작</div><h1>지금 챙길 일</h1><p class="subtitle">${p.birthDate?`출생 ${esc(p.birthDate.replaceAll('-','.'))}`:`${esc(monthLabel(p.dueMonth))} 출산 예정`}<span class="meta-dot">·</span>${esc(p.region==='unknown'?'거주지 미설정':REGIONS[p.region])}</p></div><button class="icon-button" data-action="add-custom" aria-label="내 할 일 추가">${icon('plus')}</button></div>
  <div class="v2-family-strip"><span class="v2-tiny-check">${icon('check')}</span><div><strong>이번 달, ${done}개 챙겼어요</strong><span>${esc(phaseLabel(month,p))} · ${pending.length}개 준비 남음</span></div><div class="v2-progress-circle">${total?Math.round(done/total*100):0}<small>%</small></div></div>
  ${!p.dueDate||p.region==='unknown'?`<button class="v2-setup" data-view="settings">${icon('calendar')}<span>예정일·거주지로 내 일정 맞추기</span>${icon('arrow')}</button>`:''}
  ${ctx.storageError?`<div class="info-card amber"><div>${icon('info')}</div><div><h3>저장 상태를 확인해 주세요</h3><p>${esc(ctx.storageError)}</p><button class="text-button" data-action="export">지금 백업하기</button></div></div>`:''}
  <div class="home-grid"><div class="main-column">
    <section class="panel v2-now"><div class="section-top"><h2>${esc(monthLabel(month))}<span class="subtle-count">${core.length}</span></h2><button class="text-button" data-view="timeline">월별 일정 →</button></div><p class="section-caption">왼쪽은 정보 상태, 오른쪽은 내 진행상태예요.</p>${core.length?core.slice(0,6).map(i=>row(i,{summary:false})).join(''):empty(ctx,'이번 달 기본 준비를 챙겼어요','조건부 항목과 내 개인 일정도 확인해 주세요.')}${core.length>6?`<button class="v2-more" data-view="timeline">${core.length-6}개 준비 더 보기 ${icon('arrow')}</button>`:''}</section>
    ${conditional.length?`<details class="panel conditional-panel"><summary>내 조건에 따라 추가로 확인해요 <span>${conditional.length}</span></summary><p class="section-caption">소득·건강·가족유형 등 추가 요건이 있어요. 모든 가정의 필수 신청은 아닙니다.</p>${conditional.map(i=>row(i,{summary:true})).join('')}</details>`:''}
    ${before.length?`<details class="panel conditional-panel"><summary>이전 준비도 다시 확인해요 <span>${before.length}</span></summary><p class="section-caption">준비일이 지났다고 신청 기한이 끝난 것은 아니에요.</p>${before.slice(0,8).map(i=>row(i,{summary:true})).join('')}</details>`:''}
    <button class="v2-policy-strip" data-open="review-birth-cutoff"><span class="policy-symbol">${icon('info')}</span><span><strong>2027년 상반기 출생, 적용 여부 재확인</strong><small>소급 적용 검토 보도와 최종 확정은 달라요.</small></span>${icon('arrow')}</button>
  </div><aside class="side-column"><section class="panel panel-pad"><h3 class="side-heading">${icon('clock')}다음에 준비할 일</h3>${next.map(i=>`<div class="next-item"><small>${esc(monthLabel(i.schedule.date.slice(0,7)))}</small><button data-open="${esc(i.id)}">${esc(i.title)}</button></div>`).join('')||'<p class="tiny-label">다음 준비가 없어요.</p>'}</section><section class="source-note"><h3>${icon('shield')}확인한 근거와 함께</h3><p>자료 확인 ${sourceDate}<br>공개 출처 ${data.sources.length}개<br>최종 자격·접수·입금은 해당 기관에서 확인해요.</p><button class="text-button" data-view="sources">출처·정정·링크 검사 보기 →</button></section></aside></div>
  ${today>addDays(data.meta.checkedAt,90)?'<div class="info-card amber"><div><h3>자료 확인 후 90일이 지났어요</h3><p>정책은 자동 갱신되지 않아요. 신청연도의 공식 원문을 다시 확인하세요.</p></div></div>':''}`;
}
export function timelineV2(ctx){
 const {items,state,ui,esc,icon,row}=ctx;
 const allowed=items.filter(i=>i.forMyTimeline&&(ui.timelineEvents||i.kind!=='event'));
 const selected=allowed.filter(i=>i.schedule.date?.slice(0,7)===ui.month&&(!ui.hideComplete||isOpen(i)));
 const groups=[['먼저 준비해요',selected.filter(i=>!['routine'].includes(i.kind)&&i.kind!=='event'&&i.status!=='ended')],['신청·지급을 점검해요',selected.filter(i=>i.kind==='routine')],['선택 행사·모집을 확인해요',selected.filter(i=>i.kind==='event'||i.status==='ended')]];
 return `<div class="page-heading v2-heading"><div><div class="eyebrow">39개월, 놓치지 않게</div><h1>우리 가족의 일정</h1><p class="subtitle">준비 권장일과 공식 신청 마감을 나눠 확인해요.</p></div></div><div class="year-switch">${['2026','2027','2028','2029'].map(y=>`<button data-year="${y}" class="${ui.year===y?'active':''}" aria-pressed="${ui.year===y}">${y}</button>`).join('')}<button class="today-button" data-action="this-month">이번 달</button></div>
 <div class="month-grid v2-months">${monthsInRange().filter(m=>m.startsWith(ui.year)).map(m=>{const open=allowed.filter(i=>i.schedule.date?.slice(0,7)===m&&isOpen(i)).length;return `<button class="month-tile${ui.month===m?' active':''}" data-month="${m}" aria-pressed="${ui.month===m}"><strong>${Number(m.slice(5))}월</strong><small>${open}개 준비</small></button>`;}).join('')}</div>
 <div class="v2-month-context"><span>${esc(phaseLabel(ui.month,state.profile))}</span><h2>${esc(monthLabel(ui.month))}</h2><p>${state.profile.birthDate?'산후 일정은 실제 출생일 기준이에요.':state.profile.dueDate?'출산 전은 예정일 기준, 산후는 아직 임시 일정이에요.':'예정월만 입력돼 있어 정확한 준비일은 임시예요.'}</p></div>
 <div class="result-count"><label class="mini-check"><input type="checkbox" id="hide-complete"${ui.hideComplete?' checked':''}>완료 숨기기</label><label class="mini-check"><input type="checkbox" id="timeline-events"${ui.timelineEvents?' checked':''}>선택 행사 포함</label></div>
 <div class="v2-timeline">${groups.filter(g=>g[1].length).map(([title,list])=>`<section class="v2-timeline-group"><h3>${esc(title)}<span>${list.length}</span></h3><div class="panel">${list.sort((a,b)=>(a.schedule.date||'').localeCompare(b.schedule.date||'')||rankItems(a,b)).map(i=>row(i,{date:true,summary:true})).join('')}</div></section>`).join('')||empty(ctx,'지정된 준비가 없어요','실제 받은 공고나 개인 일정을 직접 추가할 수 있어요.')}</div>
 <div class="button-row"><button class="secondary-button" data-action="calendar">${icon('calendar')}캘린더로 보내기</button><button class="text-button" data-action="add-custom">내 할 일 추가 →</button></div>`;
}
export function cardV2(item,ctx){
 const {esc,icon,badge,categoryIcon}=ctx;
 return `<article class="benefit-card"><div class="card-top"><span class="category-icon">${icon(categoryIcon(item.category))}</span>${badge(item)}</div><button class="card-open" data-open="${esc(item.id)}"><h3>${esc(item.title)}</h3><p class="card-summary">${esc(item.summary)}</p></button><p class="card-amount">${esc(item.personalAmount||item.amountText)}</p><div class="v2-card-period"><small>신청·확인 시점</small><span>${esc(item.applicationStart||item.applicationWindow)}</span></div>${item.regimeNotice?'<p class="card-policy">2027년 적용은 최종 공고 확인 · 현행·개편급여 중복 합산 금지</p>':''}${!item.mine||item.profileFit.fit==='not-indicated'?'<p class="card-policy">현재 가족 설정과 대상조건이 달라요. 상세에서 확인하세요.</p>':''}<div class="card-bottom"><span>${esc(item.category)} · ${esc(item.region==='all'?'전국':REGIONS[item.region]||item.region)}</span><button class="card-status" data-open="${esc(item.id)}">내 상태 · ${esc(STATUS[item.check.status])} ${icon('arrow')}</button></div></article>`;
}
export function detailV2(item,ctx){
 const {esc,icon,badge,externalLink}=ctx,c=item.check;
 const advice=[...(item.profileFit?.notes||[])];if(item.regimeNotice)advice.unshift(item.regimeNotice);
 const facts=[['신청 가능 시점',item.applicationStart],['신청 마감·소급',item.applicationDeadline],['지급 방식·시기',item.paymentPeriod],['사용·지원기간',item.servicePeriod]];
 const primary=item.links.find(l=>safeURL(l.url)&&l.linkVerification?.result!=='blocked'&&l.type==='apply')||item.links.find(l=>safeURL(l.url)&&l.linkVerification?.result!=='blocked'&&l.type!=='contact');
 const metaDate=item.checkedAt||item.sources?.[0]?.checkedAt||'2026-10-14';
 return `<div class="dialog-top"><span class="pill-row"><span class="pill">${esc(item.category)}</span>${badge(item)}</span><button class="icon-button" data-action="close-detail" aria-label="상세 닫기">${icon('close')}</button></div><div class="dialog-content">
 <h2 class="detail-title" id="detail-title">${esc(item.title)}</h2><p class="detail-summary">${esc(item.summary)}</p><p class="v2-source-line">정보 확인 ${esc(metaDate)} · 개인별 선정·입금 확인 아님</p>
 <div class="detail-amount">${esc(item.personalAmount||item.amountText||'지원내용 확인')}</div>
 <div class="v2-detail-facts">${facts.map(([k,v])=>`<div><span>${esc(k)}</span><strong>${esc(v||'아래 공식 안내에서 확인')}</strong></div>`).join('')}</div>
 ${item.deadline?`<div class="v2-deadline">${icon('clock')}<div><strong>${esc(fullDateLabel(item.deadline.date))}</strong><p>${esc(item.deadline.label)} · ${esc(item.deadline.basis)}</p><small>전체 신청 종료일이 아니라 현행 소급지원 기준의 계산 안내예요.</small></div></div>`:''}
 <div class="detail-schedule">${icon('calendar')}<div><strong>${esc(item.schedule.date?(item.schedule.precise?fullDateLabel(item.schedule.date):monthLabel(item.schedule.date.slice(0,7))):'날짜 미설정')}</strong> · ${esc(item.schedule.label)}<br>이 날짜는 준비 권장일이며 법정 마감일이 아니에요.</div></div>
 <section class="v2-status-section"><h3>내 진행상태</h3><div class="status-picker" role="group" aria-label="내 진행상태">${Object.entries(STATUS).map(([v,label])=>`<button data-item-status="${v}" class="${c.status===v?'active':''}" aria-pressed="${c.status===v}">${esc(label)}</button>`).join('')}</div></section>
 ${advice.length?`<div class="warning-box"><ul>${advice.map(a=>`<li>${esc(a)}</li>`).join('')}</ul></div>`:''}
 ${item.eligibility.length?`<section class="detail-section"><h3>대상조건</h3><ul>${item.eligibility.map(a=>`<li>${esc(a)}</li>`).join('')}</ul></section>`:''}
 <section class="detail-section"><h3>신청기간과 예외</h3><div class="period-box">${esc(item.applicationWindow)}</div></section>
 ${item.documents.length?`<section class="detail-section"><h3>준비서류 <span class="subtle-count" id="doc-progress">${c.docs.filter(n=>n<item.documents.length).length}/${item.documents.length}</span></h3>${item.documents.map((s,n)=>`<label class="document-check"><input type="checkbox" data-doc="${n}"${c.docs.includes(n)?' checked':''}><span>${esc(s)}</span></label>`).join('')}<p class="notes-label">서류는 업로드하지 않아요. 준비 여부만 기기에 저장해요.</p></section>`:''}
 ${item.steps.length?`<section class="detail-section"><h3>신청 순서</h3><ol class="steps-list">${item.steps.map((s,n)=>`<li><span class="step-num">${n+1}</span><span>${esc(s)}</span></li>`).join('')}</ol></section>`:''}
 ${item.cautions.length?`<section class="detail-section"><h3>중복·소급·사용기한 주의</h3><div class="warning-box"><ul>${item.cautions.map(s=>`<li>${esc(s)}</li>`).join('')}</ul></div></section>`:''}
 <section class="detail-section"><h3>공식 안내와 실제 신청 경로</h3><div class="link-list">${item.links.map(externalLink).join('')||'<p>방문·회사 신청 등 별도 창구를 이용해 주세요.</p>'}</div><p class="notes-label">포털 링크는 사업명을 다시 검색해야 해요. 외부 링크를 열어도 자동 신청되지는 않아요.</p></section>
 ${item.sources.length?`<details class="detail-section v2-evidence"><summary>확인한 출처와 신뢰도 <span>${item.sources.length}</span></summary>${item.sources.map(s=>`<div class="detail-source"><span class="pill ${s.evidenceLevel==='media'?'amber':''}">${s.evidenceLevel==='media'?'언론 보도 · 공식 확정 아님':s.evidenceLevel==='organizer'?'주최기관':'공식기관'}</span><br>${safeURL(s.url)?`<a href="${esc(safeURL(s.url))}" target="_blank" rel="noopener noreferrer">${esc(s.title)} ↗</a>`:esc(s.title)}<p>${esc(s.publisher)} · ${esc(s.checkedAt||metaDate)}<br>${esc(s.access||s.verifiedClaim||'출처 확인')}<br>${s.linkVerification?.result==='blocked'?'브라우저 접근 제한 · 현재 본문 검증 미완료':s.linkVerification?'실제 브라우저 본문 확인':''}</p></div>`).join('')}</details>`:''}
 <section class="detail-section"><h3>우리 가족 메모</h3><label><span class="screen-reader">${esc(item.title)} 메모</span><textarea class="notes" id="item-notes" maxlength="4000" placeholder="담당부서, 보완할 서류, 확인한 조건을 적어두세요. 주민번호·계좌번호는 적지 마세요.">${esc(c.notes)}</textarea></label><p class="notes-label" id="note-save-status">기기 안에 저장 · 최대 4,000자</p></section>
 <section class="detail-section"><label class="field"><span>내 준비일 직접 지정 · 선택</span><input type="date" id="item-date" value="${esc(c.date)}" min="2026-01-01" max="2030-12-31"><small>지우면 자동 일정으로 돌아가요. 직접 정한 날짜도 법정 마감은 아니에요.</small></label></section>
 <div class="dialog-footer"><button class="secondary-button" data-action="reviewed">${icon('shield')}${c.reviewed?`${esc(c.reviewed)} 직접 확인`:'오늘 원문 확인 완료'}</button><button class="text-button" data-action="share-item">항목 링크 복사</button>${item.kind==='custom'?'<button class="text-button" data-action="delete-custom">개인 항목 삭제</button>':''}</div></div>
 <div class="v2-detail-actions">${primary?`<a href="${esc(safeURL(primary.url))}" target="_blank" rel="noopener noreferrer" class="primary-button">${icon('external')}${primary.type==='apply'?'공식 신청 안내':'공식 안내 열기'}</a>`:''}<button class="secondary-button" data-action="mark-applied">신청했어요</button></div>`;
}
