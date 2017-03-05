'use strict';

// Messenger API integration example
// We assume you have:
// * a Wit.ai bot setup (https://wit.ai/docs/quickstart)
// * a Messenger Platform setup (https://developers.facebook.com/docs/messenger-platform/quickstart)
// You need to `npm install` the following dependencies: body-parser, express, request.
//
// 1. npm install body-parser express request
// 2. Download and install ngrok from https://ngrok.com/download
// 3. ./ngrok http 8445
// 4. WIT_TOKEN=your_access_token FB_APP_SECRET=your_app_secret FB_PAGE_TOKEN=your_page_token node examples/messenger.js
// 5. Subscribe your page to the Webhooks using verify_token and `https://<your_ngrok_io>/webhook` as callback URL.
// 6. Talk to your bot on Messenger!

const bodyParser = require('body-parser');
const crypto = require('crypto');
const express = require('express');
const fetch = require('node-fetch');
const request = require('request');

let globalContext = null;
var Q = require("q");

let Wit = null;
let log = null;
try {
  // if running from repo
  Wit = require('../').Wit;
  log = require('../').log;
} catch (e) {
  Wit = require('node-wit').Wit;
  log = require('node-wit').log;
}

// Webserver parameter
const PORT = process.env.PORT || 8445;

// Wit.ai parameters
//const WIT_TOKEN = process.env.WIT_TOKEN;
const WIT_TOKEN = 'WHS7A3K33MTMIIA27UETWVBZTFZWE3EX';

// Messenger API parameters
//const FB_PAGE_TOKEN = process.env.FB_PAGE_TOKEN;
const FB_PAGE_TOKEN = 'EAANLTQO8ZBEEBAMbmJHFATFXfCoAazflOXfF5SlMx5PGlddZC8YNUAmaxag3Uet1VY4cA8FuQ7vffbXxqji49xnFHMsJEFDmRQSZAcdaZCr1PDk98mOuVye4lHsRqElI3JZBlPeFEvAqq7w1acqflIddQeWPz6bOu8RdDBcyShgZDZD';
if (!FB_PAGE_TOKEN) { throw new Error('missing FB_PAGE_TOKEN') }
//const FB_APP_SECRET = process.env.FB_APP_SECRET;
const FB_APP_SECRET = '88b633ac24f3dc552933314802f0dab7';
if (!FB_APP_SECRET) { throw new Error('missing FB_APP_SECRET') }

let FB_VERIFY_TOKEN = null;
crypto.randomBytes(8, (err, buff) => {
  if (err) throw err;
  FB_VERIFY_TOKEN = buff.toString('hex');
  console.log(`/webhook will accept the Verify Token "${FB_VERIFY_TOKEN}"`);
});

// ----------------------------------------------------------------------------
// Messenger API specific code

// See the Send API reference
// https://developers.facebook.com/docs/messenger-platform/send-api-reference

const fbMessage = (id, text) => {
  const body = JSON.stringify({
    recipient: { id },
    message: { text },
  });
  const qs = 'access_token=' + encodeURIComponent(FB_PAGE_TOKEN);
  return fetch('https://graph.facebook.com/me/messages?' + qs, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body,
  })
  .then(rsp => rsp.json())
  .then(json => {
    if (json.error && json.error.message) {
      throw new Error(json.error.message);
    }
    return json;
  });
};

// ----------------------------------------------------------------------------
// Wit.ai bot specific code

// This will contain all user sessions.
// Each session has an entry:
// sessionId -> {fbid: facebookUserId, context: sessionState}
const sessions = {};

const findOrCreateSession = (fbid) => {
  let sessionId;
  // Let's see if we already have a session for the user fbid
  Object.keys(sessions).forEach(k => {
    if (sessions[k].fbid === fbid) {
      // Yep, got it!
      sessionId = k;
    }
  });
  if (!sessionId) {
    // No session found for user fbid, let's create a new one
    sessionId = new Date().toISOString();
    sessions[sessionId] = {fbid: fbid, context: {}};
  }
  return sessionId;
};

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

// Our bot actions
const actions = {
  send({sessionId}, {text}) {
    // Our bot has something to say!
    // Let's retrieve the Facebook user whose session belongs to
    const recipientId = sessions[sessionId].fbid;
    if (recipientId) {
      // Yay, we found our recipient!
      // Let's forward our bot response to her.
      // We return a promise to let our bot know when we're done sending
      return fbMessage(recipientId, text)
      .then(() => null)
      .catch((err) => {
        console.error(
          'Oops! An error occurred while forwarding the response to',
          recipientId,
          ':',
          err.stack || err
        );
      });
    } else {
      console.error('Oops! Couldn\'t find user for session:', sessionId);
      // Giving the wheel back to our bot
      return Promise.resolve()
    }
  },
  // You should implement your custom actions here
  // See https://wit.ai/docs/quickstart
  getCuisine({context, entities}) {
    var cuisine = firstEntityValue(entities, 'cuisine');
    var location = firstEntityValue(entities, 'location');

    if (location && cuisine){
      //flow
    }
    else if (location && !cuisine){
      //flow
    }
    else if (!location && cuisine){
      //flow
    }
    else if (!location && !cuisine){
      //flow
    }
    //
    // if (!location){
    //   context.missingLocation = true;
    //   delete context.translatedLocation;
    //
    //   globalContext = context;
    //   return context;
    // }
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
  },


  getFeedback({context, entities}) {
    //var location = firstEntityValue(entities, 'location');
    // console.log(context);
    // console.log(entities);
    // var counter = 100;
    // if (context.timeStamp){
    // //  return waitAndDo(60, context);
    // }
    // console.log(globalContext);
    // if (!globalContext.done){
    //   return waitAndDo(2)
    //   .then(context => {
    //     console.log('hello world');
    //     console.log(globalContext);
    //     return context
    //   });
    // }

     return promiseWhile(function(){
      return Date.now() < globalContext.timeStamp + 60000 },
      function(){
        console.log("waiting for timestamp +15000 > now");
        return Q.delay(1000);
      }).then(function () {
        console.log("done");
        context.done = "Thanks for giving it a try!";
        context.timeElapsed = Date.now() - globalContext.timeStamp;
        return context;
      })
      //context.done = true;
      //context.timeElapsed ="whatever";
      //return context;

      //context.done = true;
      //context.timeElapsed = "10 minutes!";
      //see if there's anything usable
      // if (!location){
      //   context.missingLocation = true;
      //   delete context.translatedLocation;
      //   return context;
      // }
      // if (location) {
      //   return getAddress(location)
      //   .then(addressObj => {
      //     context.translatedLocation = 'Chinese: ' + addressObj['ChiStreet']['StreetName']; // should call API here?
      //     delete context.missingLocation;
      //     return context;
      //   });
      // }
    }
  }

  // `condition` is a function that returns a boolean
  // `body` is a function that returns a promise
  // returns a promise for the completion of the loop
  function promiseWhile(condition, body) {
    var done = Q.defer();

    function loop() {
      // When the result of calling `condition` is no longer true, we are
      // done.
      if (!condition()) return done.resolve();
      // Use `when`, in case `body` does not return a promise.
      // When it completes loop again otherwise, if it fails, reject the
      // done promise
      Q.when(body(), loop, done.reject);
    }

    // Start running the loop in the next tick so that this function is
    // completely async. It would be unexpected if `body` was called
    // synchronously the first time.
    Q.nextTick(loop);

    // The promise
    return done.promise;
  }

//Helper function
const getAddress = (location) => {
  return fetch('https://www.als.ogcio.gov.hk/lookup?q=' + location, {
    method: 'GET',
    headers: {'Accept': 'application/json'}
  })
  .then(rsp => {
    return rsp.json();
  })
  .then(json => {
    if (json.error && json.error.message) {
      throw new Error(json.error.message);
    }
    var chiAddress = json["SuggestedAddress"][0];
    chiAddress = chiAddress["Address"]["PremisesAddress"]["ChiPremisesAddress"];
    return chiAddress;
  });
}

// Setting up our bot
const wit = new Wit({
  accessToken: WIT_TOKEN,
  actions,
  logger: new log.Logger(log.INFO)
});

// Starting our webserver and putting it all together
const app = express();
app.use(({method, url}, rsp, next) => {
  rsp.on('finish', () => {
    console.log(`${rsp.statusCode} ${method} ${url}`);
  });
  next();
});
app.use(bodyParser.json({ verify: verifyRequestSignature }));

// Webhook setup
app.get('/webhook', function(req, res) {
  if (req.query['hub.mode'] === 'subscribe' &&
  req.query['hub.verify_token'] === FB_VERIFY_TOKEN) {
    console.log("Validating webhook");
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error("Failed validation. Make sure the validation tokens match.");
    res.sendStatus(403);
  }
});

// app.get('/webhook', (req, res) => {
//   if (req.query['hub.mode'] === 'subscribe' &&
//     req.query['hub.verify_token'] === FB_VERIFY_TOKEN) {
//     res.send(req.query['hub.challenge']);
//   } else {
//     res.sendStatus(400);
//   }
// });

// Message handler
app.post('/webhook', (req, res) => {
  // Parse the Messenger payload
  // See the Webhook reference
  // https://developers.facebook.com/docs/messenger-platform/webhook-reference
  const data = req.body;

  if (data.object === 'page') {
    data.entry.forEach(entry => {
      entry.messaging.forEach(event => {
        if (event.message && !event.message.is_echo) {
          // Yay! We got a new message!
          // We retrieve the Facebook user ID of the sender
          const sender = event.sender.id;

          // We retrieve the user's current session, or create one if it doesn't exist
          // This is needed for our bot to figure out the conversation history
          const sessionId = findOrCreateSession(sender);

          // We retrieve the message content
          const {text, attachments} = event.message;
          if (attachments) {
            // We received an attachment
            // Let's reply with an automatic message
            fbMessage(sender, 'Sorry I can only process text messages for now.')
            .catch(console.error);
          } else if (text) {
            // We received a text message

            // Let's forward the message to the Wit.ai Bot Engine
            // This will run all actions until our bot has nothing left to do
            wit.runActions(
              sessionId, // the user's current session
              text, // the user's message
              sessions[sessionId].context // the user's current session state
            ).then((context) => {
              // Our bot did everything it has to do.
              // Now it's waiting for further messages to proceed.
              console.log('Waiting for next user messages');

              // Based on the session state, you might want to reset the session.
              // This depends heavily on the business logic of your bot.
              // Example:
              // if (context['done']) {
              //   delete sessions[sessionId];
              // }

              // Updating the user's current session state
              sessions[sessionId].context = context;
            })
            .catch((err) => {
              console.error('Oops! Got an error from Wit: ', err.stack || err);
            })
          }
        } else {
          console.log('received event', JSON.stringify(event));
        }
      });
    });
  }
  res.sendStatus(200);
});

/*
* Verify that the callback came from Facebook. Using the App Secret from
* the App Dashboard, we can verify the signature that is sent with each
* callback in the x-hub-signature field, located in the header.
*
* https://developers.facebook.com/docs/graph-api/webhooks#setup
*
*/
function verifyRequestSignature(req, res, buf) {
  var signature = req.headers["x-hub-signature"];

  if (!signature) {
    // For testing, let's log an error. In production, you should throw an
    // error.
    console.error("Couldn't validate the signature.");
  } else {
    var elements = signature.split('=');
    var method = elements[0];
    var signatureHash = elements[1];

    var expectedHash = crypto.createHmac('sha1', FB_APP_SECRET)
    .update(buf)
    .digest('hex');

    if (signatureHash != expectedHash) {
      throw new Error("Couldn't validate the request signature.");
    }
  }
}

app.listen(PORT);
console.log('Listening on :' + PORT + '...');
