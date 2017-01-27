var rp = require('request-promise');
var creds = require('./cred.json');

var strategies = {
  bitbucket: {
    url: function(cred) {
      return 'https://api.bitbucket.org/2.0/repositories/' + cred.username;
    },
    extractValues: function(res) {
      return res.values;
    }
  },
  github: {
    url: function(cred) {
      return 'https://api.github.com/user/repos';
    },
    extractValues: function(res) {
      return res;
    }
  }
}

function requestAPI(cred) {

  // Get relevant strategy
  var strategy = strategies[cred.type];
  if(strategy === undefined) throw new Error("Undefined strategy for " + cred.type);

  // Compute base64 string for HTTP Basic Auth
  var authHeader = 'Basic ' + new Buffer(cred.username + ':' + cred.password).toString('base64');

  // Set options
  var options = {
      uri: strategy.url(cred),
      headers: {
        'Authorization': authHeader,
        'User-Agent': 'MyProjects-js-App'
      },
      json: true // Automatically parses the JSON string in the response
  };

  // Fire request
  rp(options)
  .then(strategy.extractValues)
  .then(repos => {
    console.log('User %s@%s has %d repos', cred.username, cred.type, repos.length);
  })
  .catch(err => {
    console.error(err);
  });
}

creds.forEach( requestAPI );