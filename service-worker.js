const CACHE_NAME="with-welfare-v27-8-1";
const ASSETS=["/","/index.html","/app.js?v=27_8_1_operational","/style.css?v=27_8_1","/manifest.webmanifest?v=27_8_1","/icon-192.png","/icon-512.png"];
self.addEventListener("install",event=>{self.skipWaiting();event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(ASSETS)).catch(()=>{}));});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener("fetch",event=>{const url=new URL(event.request.url);if(url.pathname.startsWith("/api/")){event.respondWith(fetch(event.request));return;}event.respondWith(fetch(event.request).then(res=>{const copy=res.clone();caches.open(CACHE_NAME).then(c=>c.put(event.request,copy)).catch(()=>{});return res;}).catch(()=>caches.match(event.request).then(r=>r||caches.match("/index.html"))));});
