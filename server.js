var express = require('express');
var Promise = require('bluebird');
var path = require('path');
var fs = Promise.promisifyAll(require("fs"));
var Git = require("nodegit");
var Mustache = require('mustache');
var chain = require("store-chain");

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

// var getParentCommits = function(commit) {
//   return commit.getParents();
// }

var getParentCommits = function(commit) {
  var promises = [];
  return commit.getParents()
  .then(commits => {
    commits.forEach(_commit => {
      promises.push(getParentCommits(_commit));
    });
    return Promise.all(promises)
    .then(console.log);
  });
}


/** 
 * Fake random async work.  Returns (input + i + " ")
 **/
function doTheWork(commit) {
    // console.log(commit.message());
    return commit.getParents()
    .then(commits => {
        return commits[0];
    });
}

/**
 * Loops sequentially over an async function named doTheWork.  This is useful
 * when each iteration depends on some result from the previous one.  It is the slowest async loop,
 * so only use it when absolutely necessary.
 * 
 * This is the simplest variant, but it outputs the indexes in descending order.  Use it if your work 
 * function does not care about the index, or only needs to know when its on the last item.
 **/
function seqLoopDescending(someCommit, allCommits) {
    // console.log(allCommits);
    return new Promise(function (resolve, reject) {
        doTheWork(someCommit).then(function (parentCommit) {
            // console.log('parent', parentCommit);
            if(parentCommit === undefined) resolve(allCommits);
            else resolve(seqLoopDescending(parentCommit, allCommits.concat([parentCommit])));
        })
    });
}


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

  // chain(Git.Repository.open(repo.dir))
  // .then(getMostRecentCommit)
  // .set('mostRecent')
  // // .then(getCommitMessage)
  // .then(getParentCommits)
  // .set('parents')
  // .get(({ mostRecent, parents }) => {
  //   output = mostRecent.message();
  //   console.log( mostRecent.message() );
  //   parents.forEach(commit => {
  //     console.log( commit.message() );
  //     output += '<br>' + commit.message();
  //   })

  //   res.send(output);
  // });

  Git.Repository.open(repo.dir)
  .then(repository => {
    return repository.getBranchCommit("master");
  })
  .then(commit => seqLoopDescending(commit, [commit]))
  .then(allCommits => {
      // console.log('all commits', allCommits);
      const messages = allCommits.map(commit => commit.message());
      // allCommits.forEach(commit => console.log(commit.message()));
      res.send(messages.join('<br>'));
  })
  .catch(console.err);
    // .then(function(message) {
    //   console.log(message);
    //   res.send(id + ' ' + repo.dir + ' ' + message);
    // });
  // res.send(id);
  // res.send(Mustache.render(templates.index, { repositories }));
  // res
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
