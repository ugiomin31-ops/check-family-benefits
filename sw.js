// Versioned app-shell cache. External forms and personal notes are not cached here.
const BASE=new URL('./',self.location.href);
const PREFIX='check-family:'+BASE.pathname+':';
const VERSION=PREFIX+'853618ee8b73d7de';
const FILES=['./','./index.html','./styles.css','./v2.css','./cloud.css','./app.js','./ui-v2.js','./engine.js','./cloud-logic.js','./cloud-sync.bundle.js','./firebase-config.js','./data.json','./manifest.webmanifest','./icons/icon.svg','./icons/icon-192.png','./icons/icon-512.png','./icons/maskable-512.png','./icons/apple-touch-icon.png'];
const ASSETS=new Set(FILES.map(p=>new URL(p,BASE).href));
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(VERSION).then(cache=>cache.addAll(FILES.map(p=>new Request(new URL(p,BASE),{cache:'reload'})))));
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith(PREFIX)&&key!==VERSION)await caches.delete(key);await self.clients.claim();})());
});
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('fetch',event=>{
 const req=event.request,url=new URL(req.url);
 if(req.method!=='GET'||url.origin!==BASE.origin||!url.pathname.startsWith(BASE.pathname))return;
 if(req.mode==='navigate'){
  // Hash-based app routes only. Do not turn ZIP downloads or unknown paths into HTML.
  if(url.pathname!==BASE.pathname&&url.pathname!==new URL('./index.html',BASE).pathname)return;
  event.respondWith((async()=>{const cache=await caches.open(VERSION);return await cache.match(new URL('./index.html',BASE).href)||fetch(req);})());return;
 }
 url.search='';url.hash='';
 if(url.href===new URL('./firebase-config.js',BASE).href){
  event.respondWith((async()=>{
   const cache=await caches.open(VERSION);
   try{const fresh=await fetch(req);if(fresh.ok)await cache.put(url.href,fresh.clone());return fresh;}
   catch{return await cache.match(url.href)||Response.error();}
  })());return;
 }
 if(!ASSETS.has(url.href))return;
 event.respondWith((async()=>{const cache=await caches.open(VERSION);return await cache.match(url.href)||fetch(req);})());
});
