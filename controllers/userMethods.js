/**
 * backend/controllers/createUser.js
 * 
 * createUser resolves the wrapper promise with a new user 
 */

const { User } = require('../database')


function createUser(userData, resolve, reject) {
  new User(userData)
    .save()
    .then(treatCreateSuccess)
    .catch(treatCreateError)


  function treatCreateSuccess(user) {
    resolve(user)
  }


  function treatCreateError(error) {
    reject(error)
  }
}


module.exports = {
  createUser
}