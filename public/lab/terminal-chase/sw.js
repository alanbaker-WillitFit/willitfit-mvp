const CACHE="willitlab-terminal-chase-rc1-player-sprites-1";
const ASSETS=[
  "./",
  "./index.html",
  "./styles.css",
  "./refinement.css",
  "./character-integration.css",
  "./character-assets.js",
  "./character-integration.js",
  "./game.js",
  "./manifest.webmanifest",
  "./sprites/player-down.png",
  "./sprites/player-up.png",
  "./sprites/player-left.png",
  "./sprites/player-right.png",
  "../bag-bounce/asset-refs.js"
];
self.addEventListener("install",event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));self.skipWaiting();});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith("willitlab-terminal-chase-")&&key!==CACHE).map(key=>caches.delete(key)))));self.clients.claim();});
self.addEventListener("fetch",event=>{if(event.request.method!=="GET")return;event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return response;}).catch(()=>event.request.mode==="navigate"?caches.match("./index.html"):Response.error())));});
