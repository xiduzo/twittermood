var Twitter = require('twitter-node-client').Twitter;
var jsonfile = require('jsonfile');
var express = require('express');
var moment = require('moment');

var app = express();

var error = function (err, response, body) {
  console.log(err);
};
var success = function (data) {
  console.log('Data [%s]', data);
};

function isJsonString(string) {
  try {
    JSON.parse(string);
  } catch (e) {
    return false;
  }
  return true;
}

// Process all the trending topics
function processTrendingTopics(data) {
  if(!isJsonString(data)) { return false; }
  data = JSON.parse(data);

  for(var i = 0; i < data[0].trends.length; i++) {
    getTweetsFromTrend(data[0].trends[i].name);
  }
};

// Get al the tweets from a trend
function getTweetsFromTrend(trend) {
  twitter.getSearch({'q': trend ,'count': 100}, error, processTweetsFromTrend);
};

// Process all the tweets from a trend
function processTweetsFromTrend(data) {
  if(!isJsonString(data)) { return false; }
  data = JSON.parse(data);

  for(var i = 0; i < data.statuses.length; i++) {
    getEmojisFromTweet(data.statuses[i].text);
  }

  // Recalculate the percentages
  calculatePercentages();
};

// Retract the emojis from the tweet
function getEmojisFromTweet(tweet) {
  // Dont even think about understanding this regex
  var regex = /[\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}\u{1f1e6}-\u{1f1ff}\u{1f191}-\u{1f251}\u{1f004}\u{1f0cf}\u{1f170}-\u{1f171}\u{1f17e}-\u{1f17f}\u{1f18e}\u{3030}\u{2b50}\u{2b55}\u{2934}-\u{2935}\u{2b05}-\u{2b07}\u{2b1b}-\u{2b1c}\u{3297}\u{3299}\u{303d}\u{00a9}\u{00ae}\u{2122}\u{23f3}\u{24c2}\u{23e9}-\u{23ef}\u{25b6}\u{23f8}-\u{23fa}]/gu;

  // Get all the emojis
  var matches = tweet.match(regex);

  if(matches) {
    for(var i = 0; i < matches.length; i++) {
      // Check if the emoji is in the list of emojis
      var emojiType = getEmotionType('U+'+matches[i].codePointAt(0).toString(16));

      // If so add up some numbers
      if(emojiType) {
        totalAmountOfEmojis++;
        emotions[emojiType-1].count++;
      }
      // console.log(matches[i], '  >>>  ', 'U+'+matches[i].codePointAt(0).toString(16));
    }
  }
};

function getEmotionType(unicode) {
  var type = null;

  for(var i = 0; i < utfEmojis.length; i++) {
    // Check if the unicode is in the unicodes list of the type
    if(utfEmojis[i].unicodes.toLowerCase().includes(unicode.toLowerCase())) {
      type = utfEmojis[i].type;
    }
  }

  return type;
}

function powerPercentage(percentage) {
  var n = 2;
  var x = percentage;
  var p = 10;

  percentage = Math.pow(x,(1/n)) * p;

  return percentage;

  // Old forumula
  // var base = 3.67;
  // var exp = 2;
  // percentage = base * Math.pow(Math.log(exp * percentage), 2);
  // return percentage > 1.4 ? percentage : 0.5;

}

// For when we need to recalculate the percentages of the json
function calculatePercentages() {
  for(var i = 0; i < emotions.length; i++) {
    var percentage = emotions[i].count * 100 / totalAmountOfEmojis;
    emotions[i].percentage = powerPercentage(percentage);
  }

  // Update the JSON file
  jsonfile.writeFile(moodJsonFile, emotions);
}



// Set some variables to work with
var twitter_config = {
  consumerKey: "MEjH4OyMTrCpmeJ9FUZiQDWNV",
  consumerSecret: "zyhqpxXhwaOmpD1hoazayP2YlMJuPgxMURG2ycOuIVilNbcOyU",
  accessToken: "2998703823-S6IKs4s68dca59M0vmOlOKLyQYnilKWeZSMprTG",
  accessTokenSecret: "EfOAU12ohtGWb2QYTXJaZiydV1rO6MDStHKvrw6CBrg0M",
  callBackUrl: ""
};
var twitter = new Twitter(twitter_config);
var totalAmountOfEmojis = 0;
var moodJsonFile = 'mood.json';
var motorStatesFile = 'motorStates.json';


var emotions = [
  { "type": 1, "name": "joy", "count": 0, "percentage": 0, "pull": 0.29, "push": 0.26},
  { "type": 2, "name": "celebration/achievement", "count": 0, "percentage": 0, "pull": 0.15, "push": 0.12},
  { "type": 3, "name": "hungry", "count": 0, "percentage": 0, "pull": 0.43, "push": 0.4},
  { "type": 4, "name": "motivation/approval", "count": 0, "percentage": 0, "pull": 0.4, "push": 0.35},
  { "type": 5, "name": "fear/shocked", "count": 0, "percentage": 0, "pull": 0.21, "push": 0.26},
  { "type": 6, "name": "anger/disagree", "count": 0, "percentage": 0, "pull": 0.35, "push": 0.3},
  { "type": 7, "name": "sadness/sick", "count": 0, "percentage": 0, "pull": 0.3, "push": 0.31},
  { "type": 8, "name": "curious/doubt", "count": 0, "percentage": 0, "pull": 0.13, "push": 0.1},
  { "type": 9, "name": "embarassed/disgust", "count": 0, "percentage": 0, "pull": 0.26, "push": 0.19},
  { "type": 10, "name": "horny", "count": 0, "percentage": 0, "pull": 0.15, "push": 0.19},
  { "type": 11, "name": "fancy", "count": 0, "percentage": 0, "pull": 0.2, "push": 0.2},
  { "type": 12, "name": "love/relationship", "count": 0, "percentage": 0, "pull": 0.2, "push": 0.12},
];
var utfEmojis = [
  {
    "type": 1,
    "unicodes": "U+1F600 U+1F601 U+1F602 U+1F923 U+1F603 U+1F603 U+1F606 U+1F609 U+263A U+1F917 U+1F929 U+1F60C U+1F61B U+1F61C U+1F61D U+1F643 U+1F911 U+1F92A U+1F920 U+1F921 U+1F92D U+1F913 U+1F63A U+1F638 U+1F639 U+1F646 U+1F486 U+1F938 U+270C U+1F918 U+1F919 U+1F91F U+2600 U+1F31E U+2B50 U+1F308 U+1F506 U+1F505",  },
  {
    "type": 2,
    "unicodes": "U+1F917 U+1F929 U+1F921 U+1F935 U+1F470 U+1F930 U+1F931 U+1F385 U+1F936 U+1F483 U+1F57A U+1F393 U+1F37E U+1F37A U+1F942 U+1F383 U+1F384 U+1F386 U+1F387 U+2728 U+1F388 U+1F389 U+1F38A U+1F381 U+1F396 U+1F3C6 U+1F3C5 U+1F947 U+1F948 U+1F949 U+2705 U+2611 U+2714"
  },
  {
    "type": 3,
    "unicodes": "U+1F60B U+1F924 U+1F347 U+1F348 U+1F349 U+1F34A U+1F34B U+1F34C U+1F34D U+1F34E U+1F34F U+1F350 U+1F351 U+1F352 U+1F353 U+1F95D U+1F345 U+1F965 U+1F951 U+1F346 U+1F954 U+1F955 U+1F33D U+1F336 U+1F952 U+1F966 U+1F344 U+1F95C U+1F330 U+1F35E U+1F950 U+1F956 U+1F968 U+1F95E U+1F9C0 U+1F356 U+1F357 U+1F969 U+1F953 U+1F354 U+1F35F U+1F355 U+1F32D U+1F96A U+1F32E U+1F32F U+1F959 U+1F95A U+1F373 U+1F958 U+1F372 U+1F963 U+1F957 U+1F37F U+1F96B U+1F371 U+1F358 U+1F359 U+1F35A U+1F35B U+1F35C U+1F35D U+1F360 U+1F362 U+1F363 U+1F364 U+1F365 U+1F361 U+1F95F U+1F960 U+1F961 U+1F366 U+1F367 U+1F368 U+1F369 U+1F36A U+1F382 U+1F370 U+1F967 U+1F36B U+1F36C U+1F36D U+1F36E U+1F36F U+1F95B U+2615 U+1F375 U+1F376 U+1F377 U+1F378 U+1F379 U+1F37A U+1F942 U+1F943 U+1F964 U+1F37D U+1F374 U+1F944 U+1F52A"
  },
  {
    "type": 4,
    "unicodes": "U+1F4AA U+1F44C U+1F44D U+270A U+1F44A U+1F44F U+1F64C U+1F51D U+1F192 U+1F199"
  },
  {
    "type": 5,
    "unicodes": "U+1F62E U+1F62F U+1F632 U+1F61F U+1F626 U+1F627 U+1F628 U+1F630 U+1F631 U+1F633 U+1F635 U+1F640 U+1F198"
  },
  {
    "type": 6,
    "unicodes": "U+1F610 U+1F611 U+1F624 U+1F92F U+1F621 U+1F620 U+1F92C U+1F47F U+1F480 U+2620 U+1F63E U+1F64E U+1F645 U+1F595 U+1F4A2 U+1F4A3 U+1F52A U+1F52B U+1F929 U+1F62A U+1F62B U+1F612 U+1F613 U+1F615 U+1F629 U+1F92F U+1F925 U+1F926 U+1F44E"
  },
  {
    "type": 7,
    "unicodes": "U+1F623 U+1F625 U+1F62A U+1F62B U+1F614 U+1F615 U+2639 U+1F641 U+1F616 U+1F61E U+1F622 U+1F62D U+1F629 U+1F630 U+1F637 U+1F912 U+1F915 U+1F922 U+1F92E U+1F927 U+1F63F U+1F64D U+1F494"
  },
  {
    "type": 8,
    "unicodes": "U+1F914 U+1F644 U+1F9D0 U+1F937 U+1F91E U+1F440 U+2753 U+2754 U+2049"
  },
  {
    "type": 9,
    "unicodes": "U+1F601 U+1F605 U+1F60A U+263A U+1F636 U+1F644 U+1F910 U+1F615 U+1F632 U+1F62C U+1F633 U+1F922 U+1F92E"
  },
  {
    "type": 10,
    "unicodes": "U+1F609 U+1F60A U+1F618 U+1F61A U+263A U+1F917 U+1F60F U+1F61B U+1F61C U+1F607 U+1F608 U+1F63C U+1F63D U+1F648 U+1F649 U+1F64A U+1F463 U+1F445 U+1F444 U+1F48B U+1F4A6 U+1F34C U+1F351 U+1F346 U+1F3E9 U+1F51E"
  },
  {
    "type": 11,
    "unicodes": "U+1F60E U+1F911 U+1F468 U+1F478 U+1F934 U+1F935 U+1F481 U+1F487 U+1F483 U+1F57A U+1F46F U+1F933 U+1F485 U+1F4AB U+1F576 U+1F454 U+1F457 U+1F459 U+1F45C U+1F6CD U+1F460 U+1F461 U+1F462 U+1F451 U+1F3A9 U+1F9E2 U+1F484 U+1F48E U+1F984 U+1F338 U+1F33A U+2B50 U+1F31F U+26A1 U+2728 U+1F380 U+1F4B0 U+1F4B4 U+1F4B5 U+1F4B6 U+1F4B7 U+1F4B8 U+1F4B3 U+1F4B2"
  },
  {
    "type": 12,
    "unicodes": "U+1F60A U+1F60D U+1F618 U+1F617 U+1F619 U+1F61A U+263A U+1F63B U+1F46B U+1F46C U+1F46D U+1F48F U+1F469 U+1F491 U+1F46A U+1F468 U+1F498 U+2764 U+1F493 U+1F495 U+1F496 U+1F497 U+1F499 U+1F49A U+1F49B U+1F9E1 U+1F49C U+1F5A4 U+1F49D U+1F49E U+1F49F U+2763 U+1F48C U+1F492"
  },
];

// When we initiat this script, reset the json
// jsonfile.writeFile(moodJsonFile, emotions);

function callTwitterAPI() {
  var timeout = 1000 * 60 * 15; // In MS
  // get id from http://www.woeidlookup.com/
  // The netherlands: 23424909
  // Amsterdam: 727232
  // IJsselstein: 15004424
  // Paris: 615702
  // getTweetsFromTrend('#paris');
  twitter.getCustomApiCall('/trends/place.json',{ id: '727232'}, error, processTrendingTopics);

  console.log('Next mood check: ' + moment().add(timeout/1000, 'seconds').format("HH:mm:ss"));

  setTimeout(function () {
    callTwitterAPI();
  }, timeout);
}

function normalizeStates() {
  var states = []
  for(var i = 0; i < emotions.length; i++) {
    states.push({
      type: i + 1,
      percentage: 0
    });
  }

  return states;
}

// App logic
app.listen((process.env.PORT || 8000), function() {
  console.log("App now running");
  callTwitterAPI();
});

app.get('/', function(req, res) {
  res.send("hello world");
});

app.get('/mood', function(req, res) {
  jsonfile.readFile(moodJsonFile, function(err, obj) {
    res.send(obj);
  });
});

app.get('/mood/:moodId', function(req, res) {
  jsonfile.readFile(moodJsonFile, function(err, obj) {
    // This will blow up in your face when the moodId doenst exist or is illegal
    // But hey, its a school project and we control every scenario \o.0/
    var moodType = parseInt(req.params.moodId);
    var moodObject = obj[moodType-1];

    // Also update the current motorState just to be sure
    jsonfile.readFile(motorStatesFile, function(err, obj) {
      // Use the ln bc we use this in the arduino as well
      obj[moodType-1].percentage = moodObject.percentage;

      // Update the motorStates so when the power goes down we still
      // be able to fetch the states of the motors
      jsonfile.writeFile(motorStatesFile, obj);
    });

    res.send(JSON.stringify(moodObject));
  });
});

app.get('/moodreload', function(req, res) {
  callTwitterAPI();
});

app.get('/states', function(req, res) {
  jsonfile.readFile(motorStatesFile, function(err, obj) {
    res.send(obj);
  });
});

app.get('/states/:stateId', function(req, res) {
  jsonfile.readFile(motorStatesFile, function(err, obj) {
    var motorType = parseInt(req.params.stateId);
    var motorObject = obj[motorType-1];

    res.send(JSON.stringify(motorObject));
  });
});

app.get('/statesreset', function(req, res) {
  var states = normalizeStates();
  jsonfile.writeFile(motorStatesFile, states);
  res.send(states);
});
