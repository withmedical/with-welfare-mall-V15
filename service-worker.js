const CACHE_NAME="with-welfare-v28-0-9-3-production";
const ASSETS=["/","/index.html","/app.js?v=28_0_9_production","/style.css?v=28_0_9","/manifest.webmanifest?v=28_0_9","/icon-192.png","/icon-512.png"];
self.addEventListener("install",event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(ASSETS)));self.skipWaiting();});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))));self.clients.claim();});
self.addEventListener("fetch",event=>{if(event.request.method!=="GET")return;event.respondWith(fetch(event.request).catch(()=>caches.match(event.request).then(r=>r||caches.match("/index.html"))));});
