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

    return treatError({ reason })
  }


  return checkForExistingUserName()
    .then(checkForExistingUserID)
    // error will be { reason, solution, status }
    .catch(treatError)


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
          status: 406 // Not Acceptable
        }

        return Promise.reject(error)

      } else {
        return Promise.resolve()
      }
    }
  }


  /* Called with no argument if no User with user_name exists */
  function checkForExistingUserID() {
    return User
      .findOne({ user_id })
      .then(updateOrCreate)
      .catch(error => Promise.reject(error))


    function updateOrCreate(user) {
      return (user)
        ? updateUser(user)
        : createNewUser()
    }


    function updateUser(user) {
      user.user_name = user_name
      user.email = email
      user.hash = password
      user.last_access = new Date()

      return user.save()
        .then(collectDataFor)
        .catch(treatError)
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


  function treatError(error) {
    // The request has been handled, so resolve it, but indicate
    // that it failed
    if (typeof error !== "object" || !error.reason) {
      error = {
        reason: error
      }
    }

    if (!error.status) {
      error.status = 400 // Bad Request
    }

    return Promise.resolve(error)
  }
}


module.exports = {
  registerUser
}