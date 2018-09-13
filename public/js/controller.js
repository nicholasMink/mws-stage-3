import idb from 'idb';
import DBHelper from './dbhelper';

const DATA_PORT = 1337;

window.addEventListener('load', function() {
  if (!navigator.serviceWorker) return;
  if (navigator.serviceWorker.controller) {
    console.log('Service worker controller in Navigator');
    // UPDATE OFFLINE DATA - Favorites and Reviews
    if(window.navigator.onLine) {
      let favoritesToAdd = DBHelper.getQueueFavorites();
      favoritesToAdd.then(favorites => {
        if (favorites.length > 0) {
          console.log('Updating', favorites.length, 'queued favorites =', favorites);
          favorites.forEach(favorite => {
            DBHelper.updateFavoriteDb(favorite);
          });
        } else {
          console.log('No favorites to add')
        }
      })
      let reviewsToAdd = DBHelper.getQueue();
      reviewsToAdd.then(reviews => {
        if (reviews.length > 0) {
          console.log('Updating', reviews.length, 'review(s)')
          reviews.forEach(review => {
            let newReview = {
              "comments": review.comments,
              "createdAt": review.id,
              "name": review.name,
              "rating": review.rating,
              "restaurant_id": review.restaurant_id,
            }
            fetch(`http://localhost:${DATA_PORT}/reviews/`, {
              method: "POST", // *GET, POST, PUT, DELETE, etc.
                mode: "cors", // no-cors, cors, *same-origin
                cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
                credentials: "same-origin", // include, same-origin, *omit
                headers: {
                  "Content-Type": "application/json; charset=utf-8",
                  // "Content-Type": "application/x-www-form-urlencoded",
                },
                redirect: "follow", // manual, *follow, error
                referrer: "no-referrer", // no-referrer, *client
                body: JSON.stringify(newReview), // body data type must match "Content-Type" header
            })
            .then(response => {
              console.log(response);
              return response.json();
            }).then(data => {
              console.log(data);
              let dbPromise = DBHelper.openDB();
              dbPromise.then(db => {
              if(!db) { return }
              let tx = db.transaction('offline-queue', 'readwrite');
              const store = tx.objectStore('offline-queue');
              store.delete(review.id);
              return data;
            }).then(data =>{
              console.log('ok to do something now with this data=', data)
                // return tx.complete;
              })
            })
          })
        }
        else {
          console.log('No reviews to add!');
        }
      })
    }
  }
  else {
    navigator.serviceWorker.register('/service-worker.js', { scope: './' })
    .then((res) => console.log('Service worker registered with scope:', res.scope))
    .catch((err) => console.log('error' , err));
  }

  // navigator.serviceWorker.register('./service-worker.js').then(function(registration) {
  //   if (!navigator.serviceWorker.controller) {
  //     // Registration was successful
  //     console.log('ServiceWorker registration successful with scope: ', registration.scope);
  //     return;
  //   } else {
  //   }
  // }, function(err) {
  //   console.log('ServiceWorker registration failed: ', err);
  // });
});