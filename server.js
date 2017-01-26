var express = require('express');
var Promise = require('bluebird');
var path = require('path');
var fs = Promise.promisifyAll(require("fs"));
var Mustache = require('mustache');

var projects = require('./routes/projects');
var app = express();
var templatesDir = __dirname + '/templates';
var templates = {};

app.use(express.static('static'));

app.get('/', function (req, res) {
  res.send(Mustache.render(templates.index, {projects: [{name: 'pouet'}]}));
});

app.use('/projects', projects);



fs.readdirAsync(templatesDir)
.then(dirContents => {
  var promises = [];
  dirContents.forEach(filename => {
    
    promises.push(
      fs.readFileAsync(templatesDir + '/' + filename, "utf8").then(function(contents) {
        const tmplKey = path.basename( filename, '.html.mustache' );
        templates[tmplKey] = contents.toString();
      }).catch(function(e) {
        console.error(e.stack);
      })
    );

  });
  Promise.all(promises)
  .then(() => {
    console.log(templates);

    app.listen(3000, function () {
      console.log('Example app listening on port 3000!');
    });
  });
});
