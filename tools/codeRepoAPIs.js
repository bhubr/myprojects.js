var _ = require('lodash');
var Promise = require('bluebird');
// var creds = require('./cred.json');
var Bitbucket = require('./strategy-bitbucket');
var Github = require('./strategy-github');


var strategies = {
  github: Github,
  bitbucket: Bitbucket
}

function getRepositoriesForAccount(cred) {
  var strategy = new strategies[cred.type](cred);
  return strategy.fire();
}

function getRepositories(creds) {
  if( creds === undefined ) throw new Error("You must supply credentials to getRepositories()");
  var promises = [];
  creds.forEach(cred => {
    promises.push(getRepositoriesForAccount(cred));
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

function getCommitsForRepo(creds, repoSlug) {

}

module.exports = {
  getRepositories, getCommitsForRepo
};