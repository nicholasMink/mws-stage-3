var STATIC_CACHE_TITLE = "restaurant-cache-";
var VERSION = "v2.761";
var STATIC_CACHE = STATIC_CACHE_TITLE + VERSION;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then( (cache) =>{
      return cache.addAll([
        '/',
        'index.html',
        'restaurant.html',
        'js/bundle.js',
        'js/restaurant.js',
        // 'js/maps/bundle.js.map',
        // 'js/maps/restaurant.js.map',
        'css/styles.css',
        'img/icon.png',
        'img/error-image.jpg',
        'manifest.json'
      ]);
    })
  );
});


// self.addEventListener('activate', function(event) {
//   event.waitUntil(
//     caches.keys().then(function(cacheNames) {
//       return Promise.all(
//         cacheNames.filter(function(cacheName) {
//           return cacheName.startsWith('restaurant-') &&
//             !allCaches.includes(cacheName);
//         }).map(function(cacheName) {
//           return caches.delete(cacheName);
//         })
//       );
//     })
//   );
// });

/**
* @description Deletes old cache from old version
* @param {string} cache
* @param {string} STATIC_CACHE_TITLE
* @param {string} STATIC_CACHE
* @returns {string} During service worker activation, deletes all cache that is no longer found in new service worker version
*/
self.addEventListener('activate', (event) =>{
  event.waitUntil(
    caches.keys().then( (cacheNames) =>{
      return Promise.all(
        cacheNames.filter( (cache) =>{
          return cache.startsWith(STATIC_CACHE_TITLE) && cache != STATIC_CACHE;
        }).map( (cache) =>{
          return caches.delete(cache);
        })
      );
    })
  );
});

// self.addEventListener('fetch', function(event) {
//   var requestUrl = new URL(event.request.url);

//   if (requestUrl.pathname.startsWith('/restaurants/')) {
//     return;
//   }
//   if (requestUrl.pathname.startsWith('/img/')) {
//     event.respondWith(servePhoto(event.request));
//     return;
//   }

//   event.respondWith(
//     caches.open(STATIC_CACHE).then(function(cache) {
//       return cache.match(event.request).then(function (response) {
//         return response || fetch(event.request).then(function(response) {
//           // cache.put(event.request, response.clone());
//           return response;
//         });
//       });
//     })
//   );
// });
/**
* @description fetches from cache or server if content is not cached
* @param {string} response
* @returns {string} returns cache if it is found, else caches the event.request from the server if it is not found
*/
// self.addEventListener('fetch', (event) =>{
//   if(event.request.method === 'GET'){ //Stops interceptions of POST requests
//     event.respondWith(
//       caches.open(STATIC_CACHE).then( (cache) =>{
//         return fetch(event.request).then( (response) =>{
//           cache.put(event.request, response.clone());
//           return response;
//         })
//       })
//     );
//   }
// });

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        if (response) {
          return response;     // if valid response is found in cache return it
        } else {
          return fetch(event.request)     //fetch from internet
            .then(function(res) {
              return caches.open(STATIC_CACHE)
                .then(function(cache) {
                  cache.put(event.request.url, res.clone());    //save the response for future
                  return res;   // return the fetched data
                })
            })
            .catch(function(err) {       // fallback mechanism
              return caches.open(STATIC_CACHE)
              .then(function(cache) {
                console.log('*********************\nFetch request failed for service worker\n*********************\nERROR:', err);
                return cache.match('offline-queue');
                });
            });
        }
      })
  );
});

// function servePhoto(request) {
//   // var storageUrl = request.url.replace(/-\d+px\.jpg$/, '');
//   return caches.open(DB_CACHE).then(function(cache) {
//     return cache.match(request).then(function(response) {
//       if (response) return response;

//       return fetch(request).then(function(networkResponse) {
//         cache.put(request, networkResponse.clone());
//         return networkResponse;
//       });
//     });
//   });
// }