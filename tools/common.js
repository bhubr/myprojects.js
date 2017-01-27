/**
 * Compute base64 string for HTTP Basic Auth
 */
function getAuthHeader(cred) {
  return 'Basic ' + new Buffer(cred.username + ':' + cred.password).toString('base64');
}

module.exports = { getAuthHeader };