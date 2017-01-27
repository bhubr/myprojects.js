var common = require('./common');
var rp = require('request-promise');

function Github(cred) {
  this.username = cred.username;
  this.options = {
    uri: 'https://api.github.com/user/repos',
    headers: {
      'Authorization': common.getAuthHeader(cred),
      'User-Agent': 'MyProjects-js-App'
    },
    json: true
  };

}

Github.prototype.fire = function() {
  return rp(this.options);
};

module.exports = Github;