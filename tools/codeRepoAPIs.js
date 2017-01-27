var rp = require('request-promise');
var _ = require('lodash');
var creds = require('./cred.json');

function getAuthHeader(cred) {
  // Compute base64 string for HTTP Basic Auth
  return 'Basic ' + new Buffer(cred.username + ':' + cred.password).toString('base64');
}

function Bitbucket(cred) {
  this.username = cred.username;
  this.id = 'bitbucket-' + (1000000 * Math.random()).toString(36);
  this.uri = 'https://api.bitbucket.org/2.0/repositories/' + cred.username;
  this.options = {
      uri: this.uri,
      headers: {
        'Authorization': getAuthHeader(cred),
        'User-Agent': 'MyProjects-js-App'
      },
      json: true // Automatically parses the JSON string in the response
  };
}

function mapRepos(repos) {
  return (_.map(repos, repo => repo.name)).join(', ');
}

Bitbucket.prototype._fire = function() {
  // console.log('\n\n## Bitbucket _fire: ', this.id, this.options.uri);
  return rp(this.options)
  .then(res => {
    // console.log('\n### RET FROM _fire: (next => %s) [%s] %s', res.next, this.username, mapRepos(res.values));
    return res;
  });
};

Bitbucket.prototype.fire = function() {
  // console.log('Bitbucket fire', this.id);
  return this._fire.call(this)
  // .then(res => {
  //   console.log(this); return res;
  // })
  .then(res => this.seqLoopDescending.call(this, res, res.values));
  // .then(mapRepos)
  // .then(console.log);
};

Bitbucket.prototype.getNextPage = function(nextPageLink) {
  // console.log('## getNextPage', this.id, nextPageLink);
  this.options.uri = nextPageLink;
  return this._fire.call(this);
}
Bitbucket.prototype.seqLoopDescending = function (res, allRepos) {
  var that = this;
  // console.log('Bitbucket seqLoopDescending', this.id, '[', mapRepos(allRepos), ']');
  return new Promise(function (resolve, reject) {
    if(res.next === undefined) resolve(allRepos.concat(res.values));
    else that.getNextPage(res.next).then(({ next, values }) => {
      // console.log('after next page', that.options.uri,mapRepos (values));
      // if(_nextPageLink === undefined) resolve(allRepos);
      if(next === undefined) resolve(allRepos.concat(values));
      else resolve(that.seqLoopDescending.call(that, { next, values }, allRepos.concat(values)));
    })
    .catch(err => {
      console.error("#### STH WRONG", err);
      reject(err);
    })
  });
}

function Github(cred) {
  this.username = cred.username;
  this.options = {
    uri: 'https://api.github.com/user/repos',
    headers: {
      'Authorization': getAuthHeader(cred),
      'User-Agent': 'MyProjects-js-App'
    },
    json: true // Automatically parses the JSON string in the response
  };

}

Github.prototype.fire = function() {
  return rp(this.options);
  // console.log('GitHub fire');
  // return this._fire()
  // .then(res => this.seqLoopDescending(res, []));
};

var strategies = {
  github: Github,
  bitbucket: Bitbucket
}

// var strategies = {
//   bitbucket: {
//     url: function(cred) {
//       return 'https://api.bitbucket.org/2.0/repositories/' + cred.username;
//     },
//     // extractValues: function(res) {
//     //   return res.values;
//     // },
//     _fire: function(cred, options) {
//     return rp(options);
//     // .then(this.extractValues)
//     // .then(res => {
//     //   // console.log('User %s@%s has %d repos', cred.username, cred.type, repos.length);
//     // })
//     // .catch(err => {
//     //   console.error(err);
//     // });
//     },
//     seqLoopDescending: function (nextPage, allRepos) {
//       return new Promise(function (resolve, reject) {
//         getTheParent(someCommit).then(function (parentCommit) {
//           if(parentCommit === undefined) resolve(allCommits);
//           else resolve(seqLoopDescending(parentCommit, allCommits.concat([parentCommit])));
//         })
//         .catch(err => {
//           // console.error("#### STH WRONG", err);
//           reject(err);
//         })
//       });
//     },
//     fire: function(cred, options) {
//       return this._fire(cred, options)
//       .then(res => this.seqLoopDescending(res.next, res.values));

//     }
//   },
//   github: {
//     url: function(cred) {
//       return 'https://api.github.com/user/repos';
//     },
//     // extractValues: function(res) {
//     //   return res;
//     // },
//     fire: function(cred, options) {
//       return rp(options)
//       // .then(this.extractValues)
//       .then(repos => {
//         console.log('User %s@%s has %d repos', cred.username, cred.type, repos.length);
//       })
//       .catch(err => {
//         console.error(err);
//       });
//     }
//   }
// }


// *
//  * Look up all commits in repo (master), from most recent to initial
 
// function getCommitsForRepo(dir) {
//   return Git.Repository.open(dir)
//   .then(getMostRecentCommit)
//   .then(commit => seqLoopDescending(commit, [commit]));
//   // .catch(console.error);
// }


// /** 
//  * Get commit parent
//  */
// function getTheParent(commit) {
//     return commit.getParents()
//     .then(commits => {
//         return commits[0];
//     });
// }

// /**
//  * Loops sequentially over an async function named getTheParent.
//  */
// function seqLoopDescending(someCommit, allCommits) {
//     return new Promise(function (resolve, reject) {
//         getTheParent(someCommit).then(function (parentCommit) {
//             if(parentCommit === undefined) resolve(allCommits);
//             else resolve(seqLoopDescending(parentCommit, allCommits.concat([parentCommit])));
//         })
//         .catch(err => {
//           // console.error("#### STH WRONG", err);
//           reject(err);
//         })
//     });
// }

// function requestAPI(cred) {

//   // Get relevant strategy
//   var strategy = strategies[cred.type];
//   if(strategy === undefined) throw new Error("Undefined strategy for " + cred.type);

//   // Compute base64 string for HTTP Basic Auth
//   var authHeader = 'Basic ' + new Buffer(cred.username + ':' + cred.password).toString('base64');

//   // Set options
//   var options = {
//       uri: strategy.url(cred),
//       headers: {
//         'Authorization': authHeader,
//         'User-Agent': 'MyProjects-js-App'
//       },
//       json: true // Automatically parses the JSON string in the response
//   };

//   return strategy.fire.call(strategy, cred, options);

// }

creds.forEach( cred => {
  var strategy = new strategies[cred.type](cred);
  strategy.fire()
  .then(repos => {
    console.log("\n### Repos for user %s@%s\n", cred.username, cred.type);
    console.log(mapRepos(repos));
  });
} );