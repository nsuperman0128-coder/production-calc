const CACHE='molding-calc-suite-v2';
const CORE=['./','./index.html','./manifest.webmanifest','./icon-180.png','./icon-192.png','./icon-512.png'];

self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;

  const req=event.request;
  const isNavigation=req.mode==='navigate' || req.destination==='document';

  if(isNavigation){
    // Pages: always try the latest version first.
    event.respondWith(
      fetch(req,{cache:'no-store'})
        .then(response=>{
          const copy=response.clone();
          caches.open(CACHE).then(cache=>cache.put('./index.html',copy));
          return response;
        })
        .catch(()=>caches.match('./index.html'))
    );
    return;
  }

  // Static files: show cached immediately, but refresh cache in the background.
  event.respondWith(
    caches.match(req).then(cached=>{
      const network=fetch(req,{cache:'no-cache'})
        .then(response=>{
          if(response && response.ok){
            const copy=response.clone();
            caches.open(CACHE).then(cache=>cache.put(req,copy));
          }
          return response;
        })
        .catch(()=>cached);

      return cached || network;
    })
  );
});
