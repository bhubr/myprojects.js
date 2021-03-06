var common = require('./common');
var rp = require('request-promise');
var _ = require('lodash');
var creds = require('./cred.json');


/**
 * Strategy for BitBucket
 */
function Bitbucket(cred) {
  this.username = cred.username;
  this.id = 'bitbucket-' + (1000000 * Math.random()).toString(36);
  this.baseUri = 'https://api.bitbucket.org/2.0';
  // this.uri = 'https://api.bitbucket.org/2.0/repositories/' + cred.username;
  this.options = {
      // uri: this.uri,
      headers: {
        'Authorization': common.getAuthHeader(cred),
        'User-Agent': 'MyProjects-js-App'
      },
      json: true
  };
}

Bitbucket.prototype.setPath = function(relativePath) {
  this.options.uri = this.baseUri + relativePath;
};

Bitbucket.prototype.fire = function() {
  return rp(this.options);
};

Bitbucket.prototype.getRepositories = function() {
  this.setPath('/repositories/' + this.username);
  return this.fire.call(this)
  .then(res => this.seqLoopDescending.call(this, res, res.values));
};


Bitbucket.prototype.getCommitsFor = function(repoName) {
  this.setPath('/repositories/' + this.username + '/' + repoName + '/commits');
  return this.fire()
  .then(commits => { 
    // console.log(commits);
    return _.map(commits.values, commit => {
    // console.log(commit);
    // return commit;
    return { sha: commit.hash, message: commit.message };
  }); });
};


Bitbucket.prototype.getNextPage = function(nextPageLink) {
  this.options.uri = nextPageLink;
  return this.fire.call(this);
}
Bitbucket.prototype.seqLoopDescending = function (res, allRepos) {
  var that = this;
  return new Promise(function (resolve, reject) {
    if(res.next === undefined) resolve(allRepos.concat(res.values));
    else that.getNextPage(res.next).then(({ next, values }) => {
      if(next === undefined) resolve(allRepos.concat(values));
      else resolve(that.seqLoopDescending.call(that, { next, values }, allRepos.concat(values)));
    })
    .catch(err => {
      console.error("#### STH WRONG", err);
      reject(err);
    })
  });
}

module.exports = Bitbucket;