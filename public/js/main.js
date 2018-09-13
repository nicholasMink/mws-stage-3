import DBHelper from './dbhelper';
/**
 * IIFEs
 * - window.initMap ---> updateRestaurants
 * ----------------------------------------
 * FUNCTIONS
 *  - registerServiceWorker
 *  - setEventListeners ~~~~~~~~~~~~ IFFE
 *  - fetchNeighborhoods ----------- IFFE
 *  - fillNeighborhoodsHTML
 *  - fetchCuisines ---------------- IFFE
 *  - fillCuisinesHTML
 *  - updateRestaurants ------------ IFFE
 *  ~ ~~~~~> resetRestaurants, fillRestaurantsHTML 
 *  - resetRestaurants
 *  - fillRestaurantsHTML
 *  - createRestaurantHTML
 *  - addMarkersToMap
 * ----------------------------------------
 * TODO:
 *  - installPromptEvent()
 */

var map, markers = [];
let restaurants, neighborhoods, cuisines;

// if ('serviceWorker' in navigator) {
// window.addEventListener('load', function() {
//   registerServiceWorker();
//   navigator.serviceWorker.register('./service-worker.js').then(function(registration) {
//     if (!navigator.serviceWorker.controller) {
//       // Registration was successful
//       console.log('ServiceWorker registration successful with scope: ', registration.scope);
//       return;
//     } else {
//       console.log('Service worker controller in Navigator')
//     }
//   }, function(err) {
//     // registration failed :(
//     console.log('ServiceWorker registration failed: ', err);
//   });
// });


// function registerServiceWorker() {
//   if (!navigator.serviceWorker) return;
//     navigator.serviceWorker.register('/service-worker.js', {
//       scope: './'
//     })
//     // .then(() => {
//     //       console.log('Service worker has been successfully registered.');
//     // })
//     .catch((err) => {
//           console.log('error' , err);
//     });
// };

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  setEventListeners();
  fetchNeighborhoods();
  fetchCuisines();
});

var setEventListeners = () => {
  var neighborHoodSelect = document.getElementById('neighborhoods-select');
  neighborHoodSelect.addEventListener('change' , function(){
    updateRestaurants();
  });

  var cuisineSelect = document.getElementById('cuisines-select');
  cuisineSelect.addEventListener('change' , function(){
    updateRestaurants();
  });
}

/**
 * Fetch all neighborhoods and set their HTML.
 */
const fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoodData) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      neighborhoods = neighborhoodData;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
const fillNeighborhoodsHTML = (neighborhoodData = neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoodData.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
const fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisineData) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      cuisines = cuisineData;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
const fillCuisinesHTML = (cuisineData = cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisineData.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Initialize Google map, called from HTML.
 */
export default window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  updateRestaurants();
}

/**
 * Update page and map for current restaurants.
 */
const updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;
  // fetchRestaurantByCuisineAndNeighborhood;
  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
const resetRestaurants = (restaurantData) => {
  // Remove all restaurants
  restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  markers.forEach(m => m.setMap(null));
  markers = [];
  restaurants = restaurantData;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
const fillRestaurantsHTML = (restaurantData = restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurantData.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
const createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  // image.srcset = DBHelper.imageSrcsetForRestaurant(restaurant);
  image.alt = `${restaurant.cuisine_type} Restaurant - ${restaurant.name}`;
  li.append(image);

  const name = document.createElement('h1');
  name.innerHTML = restaurant.name;
  li.append(name);

  const favBtn = document.createElement('button');
  favBtn.setAttribute('aria-label', 'Favorite restaurant status not set');
  let isFavorite = restaurant.is_favorite && (restaurant.is_favorite !== 'false');
  isFavorite ? favBtn.innerText = `❤️ Liked` : favBtn.innerText = '🖤 Like it?';
  favBtn.id = `favorite-${restaurant.id}`;
  favBtn.className = `restaurant__favorite`;
  favBtn.addEventListener('click', (ev) => {
    favBtn.innerText = DBHelper.toggleFavorite(restaurant);
  });
  
  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);
  
  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);
  
  li.append(favBtn);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.setAttribute('aria-label', `Link to ${restaurant.name} details`);
  more.href = DBHelper.urlForRestaurant(restaurant);
  li.append(more)

  return li
}

/**
 * Add markers for current restaurants to the map.
 */
const addMarkersToMap = (restaurantData = restaurants) => {
  restaurantData.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    markers.push(marker);
  });
}

/**
 * TODO: Install prompt event
 */
// let installPromptEvent;
// window.addEventListener('beforeinstallprompt', (event) => {
//   event.preventDefault();
//   installPromptEvent = event; // Stash the event so it can be triggered later.
//   document.querySelector('#install-button').disabled = false; // Update the install UI to notify the user app can be installed
// });
