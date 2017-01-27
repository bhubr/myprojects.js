/*------------------------*
 | Modules / dependencies
 *------------------------*
 |
 */
var express = require('express');
var Promise = require('bluebird');
var path = require('path');
var fs = Promise.promisifyAll(require("fs"));
var Git = require("nodegit");
var Mustache = require('mustache');
var chain = require("store-chain");
var chokidar = require('chokidar');


/*------------------------*
 | Global vars
 *------------------------*
 |
 */
var app = express();
var projects = require('./routes/projects');
var repos = require('./repositories.json');
var config = require('./config.json');
var templates = {};
var repositories = [];


/*------------------------*
 | Functions
 *------------------------*
 |
 */

/**
 * Get most recent commit from master branch
 */
var getMostRecentCommit = function(repository) {
  return repository.getBranchCommit("master");
};

/**
 * Look up all commits in repo (master), from most recent to initial
 */
function getCommitsForRepo(dir) {
  return Git.Repository.open(dir)
  .then(getMostRecentCommit)
  .then(commit => seqLoopDescending(commit, [commit]))
  .catch(console.err);
}

/**
 * Reduce authors for a set of commits
 */
function getCommitAuthors(commits) {
  return Promise.reduce(commits, function(authors, commit) {
    const author = commit.author();
    const authorString = author.name() + ' &lt;' + author.email() + '&gt;';
    if( authors.indexOf( authorString ) !== -1 ) return authors;
    else return authors.concat(authorString);
  }, []).then(function(authors) {
      return authors;
  });
}

/** 
 * Get commit parent
 */
function getTheParent(commit) {
    return commit.getParents()
    .then(commits => {
        return commits[0];
    });
}

/**
 * Loops sequentially over an async function named getTheParent.
 */
function seqLoopDescending(someCommit, allCommits) {
    return new Promise(function (resolve, reject) {
        getTheParent(someCommit).then(function (parentCommit) {
            if(parentCommit === undefined) resolve(allCommits);
            else resolve(seqLoopDescending(parentCommit, allCommits.concat([parentCommit])));
        })
    });
}

// var getCommitMessage = function(commit) {
//   return commit.message();
// };

/*------------------------*
 | Express setup&routing
 *------------------------*
 |
 */
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
    res.json({ authors });
  });
});

// TODO: ACTUALLY USE IT
app.use('/projects', projects);

/*------------------------*
 | Misc setup
 *------------------------*
 |
 */

repos.forEach((dir, index) => {
  repositories.push({ dir, index });
})

/**
 * Set watcher on templates folder (hot template reloading)
 */
chokidar.watch('./templates', {ignored: /[\/\\]\./}).on('all', (event, _path) => {
  console.log(event, _path);
  if( event === 'add' || event === 'change' ) {
    fs.readFileAsync(__dirname + '/' + _path, "utf8").then(function(contents) {
      const tmplKey = path.basename( _path, '.html.mustache' );
      templates[tmplKey] = contents.toString();
    });
  }
});

/**
 * Start the app
 */
app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
