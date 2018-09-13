import idb from 'idb';
// Database endpoints
const DATA_PORT = 1337; // Change this to your server port
const RESTAURANTS_URL = `http://localhost:${DATA_PORT}/restaurants/`;
const REVIEWS_URL = `http://localhost:${DATA_PORT}/reviews/`;
var dbPromise;

let fetchRestaurantsCounts = 0;
class DBHelper {

  static openDB() {
    if (!navigator.serviceWorker) {
      return Promise.resolve();
    }
    return idb.open('restuarants', 3, upgradeDb => {
      console.log('>>>>>>> Database accessed');
      if (!upgradeDb.objectStoreNames.contains('restaurants')) {
        upgradeDb.createObjectStore('restaurants', {
          keyPath: 'id'
        });
        console.log('>>>>>>> Created restaurants object store');
      }
      if (!upgradeDb.objectStoreNames.contains('reviews')) {
        upgradeDb.createObjectStore('reviews', {
          keyPath: 'id',
          autoIncrement: true
        });
        
        console.log('>>>>>>> Created reviews object store');
      }
      if (!upgradeDb.objectStoreNames.contains('offline-queue')) {
        upgradeDb.createObjectStore('offline-queue', {
          keyPath: 'id',
          autoIncrement: true
        })
      }
      if (!upgradeDb.objectStoreNames.contains('offline-queue-favorite')) {
        upgradeDb.createObjectStore('offline-queue-favorite', {
          keyPath: 'id',
          autoIncrement: true
        })
      }
    });
  }

  static getCachedRestaurants() {
    dbPromise = DBHelper.openDB();
    return dbPromise.then(db => {
      if (!db) return;
      const tx = db.transaction('restaurants');
      const store = tx.objectStore('restaurants');
      return store.getAll();
    })
  }

  static getCachedReviewsById(id) {
    dbPromise = DBHelper.openDB();
    return dbPromise.then(db => {
      if (!db) return;
      const tx = db.transaction('reviews');
      const store = tx.objectStore('reviews');
      let results = store.getAll().then(resp => {
        return resp.filter(review => review.restaurant_id == id)
      }).then(reviewData => {return reviewData  })
      console.log('get cached reviews by id',results)
      return store.getAll();
    })
  }

  static fetchReviews(id, cb) {
    console.log('>>>>>>> DBHelper - fetchReviews(cb)');
    DBHelper.getCachedReviewsById(id).then(data => {
      if (data.length > 0 && data[0].restaurant_id == id) {
        console.log('Reviews returned from cache:',data)
        return cb(null, data)
      }
      fetch(`${REVIEWS_URL}?restaurant_id=${id}`, {credentials: 'same-origin'}).then(response => {
        return response.json()
      }).then(data => {
        dbPromise.then(db => {
          if (!db) return;
          console.log('reviews fetched:', data);
          const index = db.transaction('reviews', 'readwrite').objectStore('reviews');
          data.forEach(review => index.put(review));
        });
        return cb(null, data);
      }).catch(error => cb(error, null));
    });
  }

  // fetch all restaurants with proper error handling.
  static fetchReviewsById(restaurant_id, cb) {
    DBHelper.fetchReviews(restaurant_id, (error, reviews) => {
      if (error) {
        cb(error, null);
      } else {
        const review = reviews.filter(r => r.restaurant_id == restaurant_id);
        if (review) {
          cb(null, review);
        } else {
          cb('Review does not exist', null);
        }
      }
    });
  }

  // Fetch all restaurants
  static fetchRestaurants(cb) {
    fetchRestaurantsCounts++;
    console.log('fetchRestaurants() called', fetchRestaurantsCounts, 'times!!!');
    DBHelper.getCachedRestaurants().then(data => {
      if (data.length > 0) {
        return cb(null, data);
      }
      fetch(RESTAURANTS_URL, {credentials:'same-origin'}).then(response => {
        return response.json()
      }).then(data => {
        dbPromise.then(db => {
          if (!db) return;
          console.log('data fetched:', data);
          const index = db.transaction('restaurants', 'readwrite').objectStore('restaurants');
          data.forEach(restaurant => index.put(restaurant));
        });
        return cb(null, data);
      }).catch(error => cb(error, null));
    });
  }

  // Fetch a restaurant by its id with proper error handling.
  static fetchRestaurantById(id, cb) {
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        cb(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) {
          cb(null, restaurant);
        } else {
          cb('Restaurant does not exist', null);
        }
      }
    });
  }

  // Fetch restaurants by a cuisine type with proper error handling with proper error handling
  static fetchRestaurantByCuisine(cuisine, cb) {
    // console.log('>>>>>>> DBHelper - fetchRestaurantByCuisine(cuisine, cb), cuisine =', cuisine);
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        cb(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        cb(null, results);
      }
    });
  }

  // Fetch restaurants by a neighborhood with proper error handling.
  static fetchRestaurantByNeighborhood(cb) {
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        cb(error, null);
      } else {
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        cb(null, results);
      }
    });
  }

  // Fetch restaurants by a cuisine and a neighborhood with proper error handling.
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') {
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') {
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  //Fetch all neighborhoods with proper error handling.
  static fetchNeighborhoods(cb) {
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        cb(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        cb(null, uniqueNeighborhoods);
      }
    });
  }

  //Fetch all cuisines with proper error handling.
  static fetchCuisines(cb) {
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        cb(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        cb(null, uniqueCuisines);
      }
    });
  }

  //Restaurant page URL.
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  //Restaurant image URL.
  static imageUrlForRestaurant(restaurant) {
    return (`./img/${restaurant.photograph}.jpg`);
  }

  //Restaurant image srcset
  static imageSrcsetForRestaurant(restaurant) {
    return (`./img/${restaurant.photograph}_400.jpg 500w, ./img/${restaurant.photograph}.jpg 800w`);
  }

  //Restaurant image alt.
  static imageAltForRestaurant(restaurant) {
    return (`${restaurant.cuisine_type} - ${restaurant.name}`);
  }

  static updateReviews(review) {
    dbPromise = DBHelper.openDB();
    return dbPromise.then(db => {
      const tx = db.transaction('reviews', 'readwrite');
      const store = tx.objectStore('reviews');
      store.put(review)
      return tx.complete;
    })
  }

  static getQueueFavorites() {
    dbPromise = DBHelper.openDB();
    return dbPromise.then(db => {
      if (!db) return;
      const tx = db.transaction('offline-queue-favorite');
      const store = tx.objectStore('offline-queue-favorite');
      return store.getAll();
    })
  }

  static getQueue() {
    dbPromise = DBHelper.openDB();
    return dbPromise.then(db => {
      if (!db) return;
      const tx = db.transaction('offline-queue');
      const store = tx.objectStore('offline-queue');
      return store.getAll();
    })
  }

  // TODO: delete queue by cursoring
  static deleteQueue() {
    dbPromise = DBHelper.openDB();
    return dbPromise.then(db => {
      if (!db) return;
      const tx = db.transaction('offline-queue');
      const store = tx.objectStore('offline-queue');
      // Open cursor to delete queue
    })
  }

  static queueReviewOffline (review = {}) {
    let queueReview = Object.assign({id: Date.now()}, review);
    console.log('User offline, queueing...', queueReview);
    dbPromise = DBHelper.openDB();
    console.log('review being queued:', queueReview);
    dbPromise.then(db => {
      const tx = db.transaction('offline-queue', 'readwrite');
      const store = tx.objectStore('offline-queue');
      store.put(queueReview)
      return tx.complete;
    }).then(function(){
      let createdDate = new Date(Date.now());
      let modifiedReview = Object.assign({createdAt: createdDate, updatedAt: createdDate}, review);
      // console.log('.then calling updateReviews(review), review =', modifiedReview)
      DBHelper.updateReviews(modifiedReview);
    })
  }

  static postReview(reviews = {}) {
    if (window.navigator.onLine) {
      fetch(REVIEWS_URL, {
        method: "POST",
          mode: "cors",
          cache: "no-cache",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
          },
          redirect: "follow",
          referrer: "no-referrer",
          body: JSON.stringify(reviews),
      })
      .then(response => {
        console.log(response);
        return response.json();
      })
      .then(data => {
        console.log(data);
        DBHelper.updateReviews(data);
        return data;
      })
    } else {
      console.log('User offline', reviews);
      DBHelper.queueReviewOffline(reviews);
    } 
  }

  // Return favorite restaurant content
  static favoriteRestaurant(restaurant) {
    var favoriteSymbol = '';
    let isFavorite = restaurant.is_favorite && (restaurant.is_favorite !== 'false');
    isFavorite ? favoriteSymbol = `❤️ Liked` : favoriteSymbol = '🖤 Like it?';
    return (favoriteSymbol);
  }

  // Update favorite restaurant content in object store
  static toggleFavorite(restaurant) {
    let isFavorite = restaurant.is_favorite && (restaurant.is_favorite !== 'false');
    isFavorite ? restaurant.is_favorite = false : restaurant.is_favorite = true;
    
    dbPromise.then(function(db) {
      var tx  = db.transaction('restaurants', 'readwrite');
      var keyValStore = tx.objectStore('restaurants');
      keyValStore.put(restaurant);
      return tx.complete;
    });
    if (!window.navigator.onLine) { // -------------------------------------------->>>>>>>> UPDATE HERE BUT PLACE IN REGISTER-SW.JS
      let queueFavorite = Object.assign({updatedAt: Date.now()}, restaurant);
      dbPromise.then(function(db) {
        var tx  = db.transaction('offline-queue-favorite', 'readwrite');
        var keyValStore = tx.objectStore('offline-queue-favorite');
        keyValStore.put(queueFavorite);
        return tx.complete;
      });
    } else {
      DBHelper.updateFavoriteDb(restaurant);
    }
    return DBHelper.favoriteRestaurant(restaurant);
  }

  // Update favorite restaurant content in database
  static updateFavoriteDb(restaurant) {
    let favoriteQuery = `${RESTAURANTS_URL}${restaurant.id}/?is_favorite=${restaurant.is_favorite}`;
    console.log(`favoriteQuery = ${favoriteQuery}`);
    fetch(favoriteQuery, {
      method: 'PUT'
    }).then(response => {
    return response.json();
    })
    .then(response => {
        let dbPromise = DBHelper.openDB();
        dbPromise.then(db => {
          if(!db) { return }
          let tx = db.transaction('offline-queue-favorite', 'readwrite');
          const store = tx.objectStore('offline-queue-favorite');
          store.delete(restaurant.id);
          return response;
        })
    })
    .catch(error => console.error('Error:', error))
  }

  // Return properties for a restaurant's map marker
  static mapMarkerForRestaurant(restaurant = self.restaurant, map) {
    // console.log('>>>>>>> DBHelper - mapMarkerForRestaurant(restaurant = self.restaurant, map)');
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }
}

module.exports = DBHelper;
