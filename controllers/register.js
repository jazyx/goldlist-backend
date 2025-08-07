/**
 * backend/controllers/register.js
 *
 * - Check if user_name and password are valid
 * - Check if an existing user_name exists
 * - Check if an existing User with user_id can be updated
 *   + If so, returns collectDataFor(user)
 *   + If not, create a new User
 *     + Return initializeUserData(newUser)
 */

const { User } = require('../database')
const { initializeUserData } = require('./initializeUserData.js')
const { collectDataFor } = require('./collectDataFor')



function registerUser(req, res) {
  const last_access = new Date()
  // Read user_id from httpOnly session cookie
  const user_id = req.session?.user_id || ""
  // Read connection details from req.body
  const { user_name, email, password } = req.body


  // Check if user_name and password are both valid
  if (!user_name || !password || false) {
    let reason = ""

    if (user_name) {
      reason = `Missing password for ${user_name}`
    } else if (password) {
      reason = "Missing username"
    } else {
      reason = "Username and password missing"
    }

    // The request has been handled, so resolve it, but indicate
    // that it failed
    const error = {
      reason,
      status: 400 // Bad Request
    }
    return Promise.resolve(error)

  } else {
    const result = checkForExistingUserName()
      .then(checkForExistingUserID)
      // error will be { reason, solution, status }
      .catch(error => Promise.resolve(error))

    return result // should be a Promise
  }


  function checkForExistingUserName() {
    const lowercase = user_name.toLowerCase()
    return User
      .findOne({ lowercase })
      .then(refuseDuplicate)
      .catch(error => Promise.reject(error))

    function refuseDuplicate(user) {
      if (user) {
        const error = {
          reason: `The username "${user_name}" already exists`,
          solution: "login",
          status: 400 // Bad Request
        }
        return Promise.reject(error)

      } else {
        return Promise.resolve()
      }
    }
  }


  /** Called with no argument if no User with user_name
   *  exists */
  function checkForExistingUserID() {
    const result = User
      .findOne({ user_id })
      .then(updateOrCreate)
      .then(data => {
        console.log("data", JSON.stringify(data, null, '  '));
        return data
      })
      .catch(error => Promise.reject(error))

    return result // should be a Promise

    function updateOrCreate(user) {
      const result = (user)
        ? updateUser(user)
        : createNewUser()

      return result // should be a Promise
    }


    function updateUser(user) {
      user.user_name = user_name
      user.email = email
      user.hash = password
      user.last_access = new Date()

      return user.save()
        .then(collectDataFor)
        .catch(error => {
          console.log("collectDataFor error", JSON.stringify(error, null, '  '));
          
          Promise.reject(error)
      })
    }


    function createNewUser() {
      return new User({ user_name, email, hash: password })
        .save()
        .then(initializeUserData)
        .catch(error => {
          console.log("createNewUser error", JSON.stringify(error, null, '  '));

          Promise.resolve(error)
        })
    }
  }
}


module.exports = {
  registerUser
}