var common = require('./common');
var rp = require('request-promise');
var _ = require('lodash');

function Github(cred) {
  this.username = cred.username;
  this.baseUri = 'https://api.github.com';
  this.options = {
    uri: 'https://api.github.com',
    headers: {
      'Authorization': common.getAuthHeader(cred),
      'User-Agent': 'MyProjects-js-App'
    },
    json: true
  };
}

Github.prototype.setPath = function(relativePath) {
  this.options.uri = this.baseUri + relativePath;
};

Github.prototype.fire = function(relativePath) {
  return rp(this.options);
};

Github.prototype.getRepositories = function() {
  this.setPath('/user/repos');
  return this.fire();
};

Github.prototype.getCommitsFor = function(repoName) {
  this.setPath('/repos/' + this.username + '/' + repoName + '/commits');
  return this.fire()
  .then(commits => { return _.map(commits, commit => {
    return { sha: commit.sha, message: commit.commit.message };
  }); });
};


module.exports = Github;