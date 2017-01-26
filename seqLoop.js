// Source: http://jsfiddle.net/dukeytoo/02ohnth4/

const Git = require("nodegit");
const repo = __dirname + "/.git"; // "/Library/WebServer/Documents/localhost/zerobin/.git";

Git.Repository.open(repo)
.then(repository => {
  return repository.getBranchCommit("master");
})
.then(commit => seqLoopDescending(commit, [commit]))
.then(allCommits => {
    // console.log('all commits', allCommits);
    allCommits.forEach(commit => console.log(commit.message()));
})
.catch(console.err);


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
