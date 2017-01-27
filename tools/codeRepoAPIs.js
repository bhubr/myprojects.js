var _ = require('lodash');
var Promise = require('bluebird');
// var creds = require('./cred.json');
var Bitbucket = require('./strategy-bitbucket');
var Github = require('./strategy-github');


var strategies = {
  github: Github,
  bitbucket: Bitbucket
}

function getRepositories(cred) {
  var strategy = new strategies[cred.type](cred);
  return strategy.fire();
}

module.exports = function(creds) {
  if( creds === undefined ) throw new Error("You must supply credentials to getRepositories()");
  var promises = [];
  creds.forEach(cred => {
    promises.push(getRepositories(cred));
  })
  return Promise.all(promises)
  .then(results => {
    var orderedResults = [];
    creds.forEach((cred, index) => {
      orderedResults.push({
        account: cred.username + '@' + cred.type,
        repositories: results[index]
      });
    });
    return orderedResults;
  });
};

// creds.forEach( cred => {
//   var strategy = new strategies[cred.type](cred);
//   strategy.fire()
//   .then(repos => {
//     console.log("\n### Repos for user %s@%s\n", cred.username, cred.type);
//     console.log(mapRepos(repos));
//   });
// } );