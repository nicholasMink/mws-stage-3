import DBHelper from './dbhelper';
/** 
 * TODOs: QUEUE REVIEW IN SUBMIT EVENT LISTENER 
 * --------------------------------------------
 * FUNCTIONS
 *  - fetchRestaurantFromURL
 *  - fetchReviews
 *  - fillRestaurantHTML
 *  - fillRestaurantHours
 *  - fillReviewsHTML
 *  - createReviewHTML
 *  - fillBreadcrumb
 *  - getParamterByName
 * -------------------------------------------
 * EVENTS & IIFEs
 *  - initMap
 *  - submitBtn
 * -------------------------------------------
 */
/**
 * Initialize Google map, called from HTML.
 */

window.initMap = () => {
  console.log('>>>>>>> Function window.initMap');
  fetchRestaurantFromURL((error, restaurant = self.restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    }
  });
}

/**
 * Get current restaurant from page URL.
 */
export const fetchRestaurantFromURL = (callback) => {
  // console.log('>>>>>>> Function fetchRestaurantFromURL');
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'Restaurant id isn\'t present in the URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillBreadcrumb();
      fillRestaurantHTML();
      callback(null, restaurant);
    });
  }
}

export const fetchReviews = (callback) => {
  // console.log('>>>>>>> Function fetchReviews---For---Id');
  const id = getParameterByName('id');
  if (id) {
    DBHelper.fetchReviewsById(id, (error, review) => {
      self.review = review;
      console.log('fetchReviews:', review)
      if (!review) {
        console.error('error in fetchReviews:', error);
        return;
      }
      fillReviewsHTML(review);
      callback(null, review);
    });
  }
}

export const fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;
  const restDetails = document.querySelector('#restaurant-favorite');
  const favBtn = document.createElement('button');
  let isFavorite = restaurant.is_favorite && (restaurant.is_favorite !== 'false');
  isFavorite ? favBtn.innerText = `❤️ Liked` : favBtn.innerText = '🖤 Like it?';
  favBtn.id = `favorite-${restaurant.id}`;
  favBtn.className = 'restaurant__favorite';
  favBtn.addEventListener('click', (ev) => {
    favBtn.innerText = DBHelper.toggleFavorite(restaurant);
  });
  restDetails.appendChild(favBtn);
  const address = document.getElementById('restaurant-address');
  address.setAttribute('tabindex', '0');
  address.innerHTML = restaurant.address;
  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.srcset = DBHelper.imageSrcsetForRestaurant(restaurant);
  image.alt = DBHelper.imageAltForRestaurant(restaurant);
  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.setAttribute('tabindex', '0');
  cuisine.innerHTML = restaurant.cuisine_type;
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  fetchReviews((error) => {
    if (error) {
      console.log('error initMap reviews', error)
    }
  });
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
export const fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');
    row.className = 'flex__column__wrap justify__between';
    row.setAttribute('tabindex', '0');
    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);
    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);
    hours.appendChild(row);
    const separator = document.createElement('hr');
    hours.appendChild(separator);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
export const fillReviewsHTML = (review = self.review) => {
  self.review = review;
  const container = document.getElementById('reviews-container');
  if (review) {
    const title = document.createElement('h2');
    title.innerHTML = 'Reviews';
    title.className = 'section__heading';
    container.appendChild(title);
    const id = getParameterByName('id');
    const ul = document.getElementById('reviews-list');
    let reviews = review.filter(review => review.restaurant_id == id).map(review => review);
    reviews.forEach(rev => {
      ul.appendChild(createReviewHTML(rev));
    });
    container.appendChild(ul);
  } else {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
}

/**
 * Create review HTML and add it to the webpage.
 */
export const createReviewHTML = (review = self.review) => {
  const li = document.createElement('li');
  const div = document.createElement('div');
  const reviewHeader = document.createElement('p');
  const date = document.createElement('small');
  const dateFormat = new Date(review.updatedAt);
  date.innerHTML = `${dateFormat.getMonth()}/${dateFormat.getDate()}/${dateFormat.getFullYear()}`;
  reviewHeader.innerHTML = `${review.name} | Rating: ${review.rating}`;
  div.appendChild(reviewHeader);
  div.appendChild(date);
  div.className = 'flex justify__between align__baseline';
  li.setAttribute('tabindex', '0');
  li.appendChild(div);
  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);
  const separator = document.createElement('hr');
  li.appendChild(separator);
  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
export const fillBreadcrumb = (restaurant = self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  const a = document.createElement('a');
  a.href = '#';
  a.setAttribute('aria-current', "page");
  a.innerHTML = restaurant.name;
  li.appendChild(a);
  breadcrumb.appendChild(li);
}

document.addEventListener('submit', (ev) => {
  ev.preventDefault();
  const name = document.querySelector('#name');
  const rating = document.querySelector('#rating');
  const comments = document.querySelector('#comments');
  const reviewForm = document.querySelector('form');
  reviewForm.innerHTML = `<p>Thanks for the review ${name.value}!</p>`
  if(name.value === "" || rating.value === "" || comments.value === "") {
    console.log('form not filled out!')
  } else {
    let reviews = self.review;
    let id = reviews[0].restaurant_id;
    const data = {
      "restaurant_id": id,
      "name": name.value,
      "rating": rating.value,
      "comments": comments.value
    }
    DBHelper.postReview(data);
  }
});

/**
 * Get a parameter by name from page URL.
 */
export const getParameterByName = (name, url) => {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`);
  const results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
