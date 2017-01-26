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

function getCommitsForRepo(dir) {
  return Git.Repository.open(dir)
  .then(getMostRecentCommit)
  .then(commit => seqLoopDescending(commit, [commit]))
  // .then(allCommits => {
    // console.log("\n##### Commits for repo", dir);
    // const messages = allCommits.map(commit => commit.message());
    // console.log("  " + messages.join("  "));
    // return allCommits;
  // })
  .catch(console.err);
}

function getCommitAuthors(commits) {
  return Promise.reduce(commits, function(authors, commit) {
    const author = commit.author();
    const authorString = author.name() + ' &lt;' + author.email() + '&gt;';
    // console.log( author.toString() );
    if( authors.indexOf( authorString ) !== -1 ) return authors;
    else return authors.concat(authorString);
      // return fs.readFileAsync(fileName, "utf8").then(function(contents) {
      //     return total + parseInt(contents, 10);
      // });
  }, []).then(function(authors) {
      //Total is 30
      // console.log(authors);
      return authors;
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

app.get('/project/:id', function (req, res) {
  var id = req.params.id;
  var repo = repositories[id];

  chain(getCommitsForRepo(repo.dir))
  .set('commits')
  .then(getCommitAuthors)
  .set('authors')
  .get(({ commits, authors }) => {
    // console.log(commits, authors);
    // const messages = commits.map(commit => commit.message());
    // const msgConcat = messages.join('<br>');
    // const authConcat = authors.join('<br>');
    // console.log(messages.join("\n") + "\n#######\n" + authors.join("\n"));
    // res.send(msgConcat + '<hr>' + authConcat);
    res.json({ authors });
  });
  // Git.Repository.open(repo.dir)
  // .then(getMostRecentCommit)
  // .catch(console.err)
  // .then(commit => seqLoopDescending(commit, [commit]))
  // .then(allCommits => {
  //     const messages = allCommits.map(commit => commit.message());
  //     res.send(messages.join('<br>'));
  // })
  // .catch(console.err);
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
  // var promises = [];
  // repositories.forEach(repo => {
  //   promises.push(
  //     getCommitsForRepo(repo.dir)
  //     .then(getCommitAuthors)
  //   );
  // })
  // return Promise.all(promises)
  // .catch(console.err);
})
.then(allCommitsPerRepo => {
  // console.log(allCommitsPerRepo);
  app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
  });
});
