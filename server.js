var express = require('express');
var Promise = require('bluebird');
var path = require('path');
var fs = Promise.promisifyAll(require("fs"));
var Git = require("nodegit");
var Mustache = require('mustache');

var projects = require('./routes/projects');
var app = express();
var templatesDir = __dirname + '/templates';
var config = require('./config.json');
var initPromises = [];
var templates = [];
var repositories = [];
var repos = require('./repositories.json'); //[];

var getMostRecentCommit = function(repository) {
  return repository.getBranchCommit("master");
};

var getCommitMessage = function(commit) {
  return commit.message();
};

repos.forEach((dir, index) => {
  repositories.push({ dir, index });
})

app.use(express.static('static'));

app.get('/', function (req, res) {
  res.send(Mustache.render(templates.index, { repositories }));
});

app.get('/:id', function (req, res) {
  var id = req.params.id;
  var repo = repositories[id];

  Git.Repository.open(repo.dir)
    .then(getMostRecentCommit)
    .then(getCommitMessage)
    .then(function(message) {
      console.log(message);
      res.send(id + ' ' + repo.dir + ' ' + message);
    });
  // res.send(id);
  // res.send(Mustache.render(templates.index, { repositories }));
  res
});


app.use('/projects', projects);

initPromises.push(
  fs.readdirAsync(templatesDir)
  .then(dirContents => {
    var promises = [];
    var templates = {};
    dirContents.forEach(filename => {
      console.log('ADD FILE', filename);
      promises.push(
        fs.readFileAsync(templatesDir + '/' + filename, "utf8").then(function(contents) {
          const tmplKey = path.basename( filename, '.html.mustache' );
          templates[tmplKey] = contents.toString();
        })
      );
    });
    return Promise.all(promises)
    .then(() => { return templates; });
  })
);


// initPromises.push(getRepos(config.directories));

Promise.all(initPromises)
.then(results => {
  [templates] = results;
  console.log("### templates");
  console.log(templates);
  console.log("### repositories");
  console.log(repositories);
  app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
  });
});
