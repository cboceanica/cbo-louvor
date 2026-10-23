const CACHE_NAME = 'ministerios-cbo-v6';
const APP_SHELL = ['./','./index.html','./louvor.html','./sonoplastia.html','./midia.html','./comunicacao.html','./ministry-calendar-v3.js','./styles.css','./app.js','./firebase-config.js','./logo-igreja.png','./icon-192.png','./icon-512.png','./manifest.webmanifest'];
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))); self.skipWaiting(); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))); self.clients.claim(); });
self.addEventListener('fetch', event => {
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin)return;
 if(url.pathname.endsWith('/firestore')||url.pathname.includes('/google.firestore'))return;
 if(request.mode==='navigate'){event.respondWith(fetch(request).then(response=>{if(response.ok)caches.open(CACHE_NAME).then(cache=>cache.put(request,response.clone()));return response;}).catch(()=>caches.match(request).then(cached=>cached||caches.match('./index.html'))));return;}
 event.respondWith(caches.match(request).then(cached=>cached||fetch(request).then(response=>{if(response.ok)caches.open(CACHE_NAME).then(cache=>cache.put(request,response.clone()));return response;})));
});
