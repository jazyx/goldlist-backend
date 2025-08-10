/**
 * backend/controllers/login.js
 *
 * - Check if user_name and password are valid
 * - Check if an existing user_name exists
 * - If so, returns collectDataFor(user)
 * - If not, return a resolved Promise with an error
 */


const bcrypt = require('bcryptjs');
const { User } = require('../database')
const { collectDataFor } = require('./collectDataFor')



function logUserIn(req, res) {
  // Read connection details from req.body
  const { user_name, email, password } = req.body
  // Use case-insensitive search for contact, and force to strings
  const lowermail = (email || "").toLowerCase()
  const lowercase = (user_name || "").toLowerCase()


  // Allow user to log in with either username or email
  const promises = [
    findLoggedInUser({
      $and: [
        { email: { $ne: "" } },
        { email: lowermail },
    ]}), // don't match Users with no email
    findLoggedInUser({ lowercase })
  ]


  // Treat the first query which produces a valid user
  return Promise.any(promises)
    .then(treatUserIfFound)
    .catch(treatError) // no valid users found 


  function findLoggedInUser(query) {
    const selection = [
      "user_name",
      "email",
      "startDate",
      "lists",
      "limitState",
      "hash"
    ]

    return new Promise(( resolve, reject ) => {
      User.findOne(query).select(selection)
        .then(checkPassword)
        .catch(reject)

      function checkPassword(user) {
        if (user) {
          bcrypt.compare(password, user.hash)
            .then(result => {
              console.log(`${password} matches ${user.hash}`, result)
              ;(result)
                ? resolve(user)
                : reject()
            })

        } else {
          reject()
        }
      }
    })
  }


  function treatUserIfFound(user) {
    return (user)
      ? collectDataFor(user) // should be a Promise
        // .then(updateLastAccess)
      : treatError()
  }


  function treatError() {
    const error = {
      reason: "Invalid username or password",
      status: 403 // Forbidden
    }

    return Promise.resolve(error)
  }
}


module.exports = {
  logUserIn
}