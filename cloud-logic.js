// Pure helpers for authenticated family sync; no network or Firebase SDK.
export const FAMILY_KEY_PREFIX='check.family.v1.cloud.';
export const CONFIG_FIELDS=['apiKey','authDomain','projectId','appId'];
export function validConfig(v){return !!v&&CONFIG_FIELDS.every(k=>typeof v[k]==='string'&&v[k].trim().length>5);}
export function familyStorageKey(id){if(typeof id!=='string'||!/^[\w-]{10,100}$/.test(id))throw Error('Invalid family ID');return FAMILY_KEY_PREFIX+id;}
export function inviteTokenFrom(value){
  if(typeof value!=='string'||value.length>3000)return '';
  value=value.trim();
  if(/^[A-Za-z0-9_-]{43}$/.test(value))return value;
  try{const u=new URL(value);return ['http:','https:'].includes(u.protocol)?u.hash.match(/^#join\/([A-Za-z0-9_-]{43})$/)?.[1]||'':'';}catch{return '';}
}
export function randomInviteToken(cryptoApi){
  const bytes=new Uint8Array(32);cryptoApi.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
}
export function cleanCheck(v={}){
  return {status:['todo','doing','applied','done','na'].includes(v.status)?v.status:'todo',
    notes:typeof v.notes==='string'?v.notes.slice(0,4000):'',
    docs:Array.isArray(v.docs)?[...new Set(v.docs.filter(n=>Number.isInteger(n)&&n>=0&&n<100))]:[],
    reviewed:typeof v.reviewed==='string'?v.reviewed.slice(0,10):'',
    date:typeof v.date==='string'?v.date.slice(0,10):''};
}
export function cleanCustom(v={}){
  return {id:String(v.id||'').slice(0,100),title:String(v.title||'').slice(0,120),
    summary:String(v.summary||'').slice(0,2000),url:String(v.url||'').slice(0,2500),
    date:String(v.date||'').slice(0,10)};
}
const same=(a,b)=>JSON.stringify(a??null)===JSON.stringify(b??null);
export function familyDiff(previous={},next={}){
 const changed={profile:null,checks:[],custom:[]};
 if(!same(previous.profile,next.profile))changed.profile=next.profile||{};
 const oldChecks=previous.checks||{},newChecks=next.checks||{};
 for(const id of new Set([...Object.keys(oldChecks),...Object.keys(newChecks)])){
   if(newChecks[id]&&!same(oldChecks[id],newChecks[id]))changed.checks.push({id,value:cleanCheck(newChecks[id])});
 }
 const oldCustom=new Map((previous.custom||[]).map(x=>[x.id,x]));
 const newCustom=new Map((next.custom||[]).map(x=>[x.id,x]));
 for(const id of new Set([...oldCustom.keys(),...newCustom.keys()])){
   if(!same(oldCustom.get(id),newCustom.get(id)))changed.custom.push({id,value:newCustom.get(id)?cleanCustom(newCustom.get(id)):null});
 }
 return changed;
}
export function legacyMissing(legacy={},remote={}){
 const result={profile:null,checks:[],custom:[]};
 for(const [id,v] of Object.entries(legacy.checks||{})){
   if(!Object.prototype.hasOwnProperty.call(remote.checks||{},id))result.checks.push({id,value:cleanCheck(v)});
 }
 const existing=new Set((remote.custom||[]).map(x=>x.id));
 for(const x of legacy.custom||[])if(!existing.has(x.id))result.custom.push({id:x.id,value:cleanCustom(x)});
 return result;
}
