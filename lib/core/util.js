/**
 * @param {import('./Schema').RedashUser} user
 */
function removeCredentialFromUser(user) {
  let {credentials, ...rest} = user;
  return rest;
}

module.exports = {
  removeCredentialFromUser
};