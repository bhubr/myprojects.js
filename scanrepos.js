const Promise = require('bluebird');
const gitscan = require('scan-git-folders');
const config = require('./config.json');
var fs = Promise.promisifyAll(require("fs"));

const getgitAsync = function(dir) {
  return new Promise((resolve, reject) => {
    gitscan.gitscan(dir, resolve);
  });
}


function getRepos(directories) {
    var promises = [];
    var repositories = [];
    directories.forEach(dirname => {
      console.log('ADD DIR', dirname);
      promises.push(
        getgitAsync(dirname)
        .then(repos => {
          repositories = repositories.concat(repos);
        })
      );
    });
    return Promise.all(promises)
    .then(() => { return repositories; });
}

getRepos(config.directories)
.then(repositories => {
  fs.writeFileAsync("repositories.json", JSON.stringify(repositories), "utf-8")
  .then(() => { console.log('done'); });
})