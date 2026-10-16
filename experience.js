// Presentation decisions only. Preparation dates never become legal deadlines.
import {addDays,isOpen,rankItems,matchesSearch} from './engine.js';

export const PREFERENCES_KEY='check.preferences.v1';
export function normalizePreferences(raw={}){
  return {
    favorites:Array.isArray(raw?.favorites)?[...new Set(raw.favorites.filter(id=>
      typeof id==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(id)&&!['__proto__','constructor','prototype'].includes(id)
    ))].slice(0,2500):[],
    setupCompleted:raw?.setupCompleted===true
  };
}

export function homeGroups(items,today,month=today.slice(0,7)){
  const pool=items.filter(i=>i.forMyTimeline&&i.kind!=='event'&&i.status!=='ended');
  const open=pool.filter(isOpen);
  const deadlineEnd=addDays(today,14),weekEnd=addDays(today,6);
  const retro=open.filter(i=>i.deadline?.date>=today&&i.deadline.date<=deadlineEnd).sort((a,b)=>a.deadline.date.localeCompare(b.deadline.date)||rankItems(a,b));
  const used=new Set(retro.map(i=>i.id));
  const week=open.filter(i=>!used.has(i.id)&&i.schedule.precise&&i.schedule.date>=today&&i.schedule.date<=weekEnd).sort(rankItems);
  week.forEach(i=>used.add(i.id));
  const earlier=open.filter(i=>!used.has(i.id)&&i.kind!=='routine'&&i.schedule.date&&
    (i.schedule.precise?i.schedule.date<today:i.schedule.date.slice(0,7)<month)).sort(rankItems);
  earlier.forEach(i=>used.add(i.id));
  const monthly=open.filter(i=>!used.has(i.id)&&i.schedule.date?.slice(0,7)===month).sort(rankItems);
  const next=open.filter(i=>i.schedule.date?.slice(0,7)>month).sort((a,b)=>a.schedule.date.localeCompare(b.schedule.date)||rankItems(a,b)).slice(0,3);
  const current=pool.filter(i=>i.schedule.date?.slice(0,7)===month);
  return {retro,week,earlier,monthly,next,
    done:current.filter(i=>i.check.status==='done').length,
    total:current.filter(i=>i.check.status!=='na').length,
    remaining:current.filter(isOpen).length};
}

export function selectLibrary(items,ui,favorites=[]){
  const selected=items.filter(i=>
    (ui.category==='전체'||i.category===ui.category)&&matchesSearch(i,ui.query)&&
    (!ui.mineOnly||i.forMyTimeline)&&(!ui.favoritesOnly||favorites.includes(i.id))&&
    (ui.information==='all'||i.status===ui.information)&&
    (ui.status==='all'||(ui.status==='open'?isOpen(i):i.check.status===ui.status))
  );
  return selected.sort(ui.sort==='title'?(a,b)=>a.title.localeCompare(b.title,'ko'):
    ui.sort==='date'?(a,b)=>(a.schedule.date||'9999').localeCompare(b.schedule.date||'9999')||rankItems(a,b):rankItems);
}

export function connectionStatus({online,storageError='',cloud={}}){
  if(storageError)return {label:'기기 저장 실패',tone:'error',detail:storageError};
  if(cloud.error||cloud.phase==='error')return {label:'공유 연결 확인 필요',tone:'error',detail:cloud.detail||'가족 공유 연결을 다시 확인해 주세요. 기기 기록은 별도로 보존됩니다.'};
  if(!online)return {label:cloud.familyId?'오프라인 · 전송 대기':'오프라인 · 기기 사용',tone:'offline',detail:'기기에 저장된 기록을 사용해요. 인터넷이 필요한 신청·로그인은 연결 후 이용해 주세요.'};
  if(cloud.familyId){
    if(cloud.pending||cloud.hasPendingWrites)return {label:cloud.pending?`가족 공유 · ${cloud.pending}건 전송 중`:'가족 공유 · 서버 반영 대기',tone:'pending',detail:'기기에는 저장했어요. 서버 반영이 끝날 때까지 인터넷 연결을 유지해 주세요.'};
    if(cloud.fromCache!==false)return {label:'가족 기록 연결 중',tone:'pending',detail:'기기 사본을 불러왔어요. 서버의 최신 기록을 확인하고 있어요.'};
    return {label:'가족 기록 동기화됨',tone:'saved',detail:'서버에서 가족 기록을 확인했어요. 같은 항목을 동시에 수정하면 마지막 반영값이 남을 수 있어요.'};
  }
  return {label:'내 기기에 저장',tone:'saved',detail:'로그인하지 않아도 사용할 수 있어요. 기기 변경 전 설정에서 JSON 백업을 내려받으세요.'};
}
