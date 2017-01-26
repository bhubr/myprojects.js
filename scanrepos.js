const Promise = require('bluebird');
const getgit = require('./node_modules/getgit/build/Release/addon');
const config = require('./config.json');
var fs = Promise.promisifyAll(require("fs"));

const getgitAsync = function(dir) {
  return new Promise((resolve, reject) => {
    getgit.array(dir, resolve);
  });
}


function getRepos(directories) {
  // return new Promise((resolve, reject) => {
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

  // });
}

getRepos(config.directories)
.then(repositories => {
  fs.writeFileAsync("repositories.json", JSON.stringify(repositories), "utf-8")
  .then(() => { console.log('done'); });
})