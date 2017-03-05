
'use strict';

let Wit = null;
let interactive = null;
try {
  // if running from repo
  Wit = require('../').Wit;
  interactive = require('../').interactive;
} catch (e) {
  Wit = require('node-wit').Wit;
  interactive = require('node-wit').interactive;
}

var googleMapsClient = require('@google/maps').createClient({
  key: 'AIzaSyCG5lK_o2tUYh8eXBsapzQXlQHaDhyzGB8'
});

const GoogleAPIKEY = 'AIzaSyCG5lK_o2tUYh8eXBsapzQXlQHaDhyzGB8';
const accessToken = 'WHS7A3K33MTMIIA27UETWVBZTFZWE3EX';

// const accessToken = (() => {
//   if (process.argv.length !== 3) {
//     console.log('usage: node examples/quickstart.js <wit-access-token>');
//     process.exit(1);
//   }
//   return process.argv[2];
// })();

// Quickstart example
// See https://wit.ai/ar7hur/quickstart
function geocodeLocation(location){
  googleMapsClient.geocode({
    address: '1600 Amphitheatre Parkway, Mountain View, CA'
  }, function(err, response) {
    if (!err) {
      console.log(response.json.results);
      return response;
    }
  });
}

const getRestaurantList = (location, cuisine) => {
  //
  //https://maps.googleapis.com/maps/api/place/textsearch/json?key=AIzaSyCG5lK_o2tUYh8eXBsapzQXlQHaDhyzGB8&query=indian&location=22.283065, 114.129838&radius=500
  //key=AIzaSyCG5lK_o2tUYh8eXBsapzQXlQHaDhyzGB8&
  //query=indian&
  //location=22.283065, 114.129838&
  //radius=500
  var baseUrl = "hhttps://maps.googleapis.com/maps/api/place/radarsearch/json?";
  baseUrl += 'query='+cuisine;
  baseUrl += '&key='+GoogleAPIKEY;
  baseUrl += '&radius=1000&';
  baseUrl += '&location=22.283065,114.129838';
  console.log(baseUrl);
  return fetch(baseUrl , {
    method: 'GET',
    headers: {'Accept': 'application/json'}
    // params: {
    //   query: cuisine,
    //   //language: 'en',
    //   location: [22.283065, 114.129838],
    //   radius: 500
    //   //minprice: 1,
    //   //maxprice: 4,
    //   //opennow: true,
    //   //type: 'restaurant'
  //}
  })
  .then(rsp => {
    return rsp.json();
  })
  .then(json => {
    if (json.error && json.error.message) {
      throw new Error(json.error.message);
    }

    return json;
  });

}

const firstEntityValue = (entities, entity) => {
  const val = entities && entities[entity] &&
  Array.isArray(entities[entity]) &&
  entities[entity].length > 0 &&
  entities[entity][0].value
  ;
  if (!val) {
    return null;
  }
  return typeof val === 'object' ? val.value : val;
};

const actions = {
  send(request, response) {
    const {sessionId, context, entities} = request;
    const {text, quickreplies} = response;
    console.log('sending...', JSON.stringify(response));
  },

  getCuisine({context, entities}) {
    var cuisine = firstEntityValue(entities, 'cuisine');
    var location = firstEntityValue(entities, 'location');
    console.log("location is: ", location);
    console.log("cuisine is ", cuisine);
    if (location && cuisine){
      context.locationKnown = true;
      context.cuisineRecognized = true;
      // console.log(geocodeLocation(location + ", Hong Kong"));

      return getRestaurantList(location, cuisine)
      .then(result => {
        console.log(result)
        return context;
      })
    }
    else if (location && !cuisine){
      context.locationKnown = true;
      delete context.cuisineRecognized;
      return context;
    }
    else if (!location && cuisine){
      // context.locationKnown = false;
      delete context.locationKnown;
      context.cuisineRecognized = true;
      return context;
    }
    else if (!location && !cuisine){
      delete context.locationKnown;
      delete context.cuisineRecognized;
      return context;
    }

    // if (location) {
    //   return getAddress(location)
    //   .then(addressObj => {
    //     context.translatedLocation = 'Chinese: ' + addressObj['ChiStreet']['StreetName']; // should call API here?
    //     context.timeStamp = Date.now();
    //     delete context.missingLocation;
    //
    //     globalContext = context;
    //     return context;
    //   });
    // }
  }
}

const client = new Wit({accessToken, actions});
interactive(client);
