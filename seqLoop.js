// Source: http://jsfiddle.net/dukeytoo/02ohnth4/

const Git = require("nodegit");
const repo = "/Library/WebServer/Documents/localhost/zerobin/.git";

Git.Repository.open(repo)
.then(repository => {
  return repository.getBranchCommit("master");
})
.then(seqLoopDescending);


/** 
 * Fake random async work.  Returns (input + i + " ")
 **/
function doTheWork(commit) {
    console.log(commit.message());
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
function seqLoopDescending(someCommit) {
    return new Promise(function (resolve, reject) {
        doTheWork(someCommit).then(function (parentCommit) {
            resolve(seqLoopDescending(parentCommit));
        })
    });
}
