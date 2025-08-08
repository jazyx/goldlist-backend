/**
 * backend/controllers/login.js
 *
 * - Check if user_name and password are valid
 * - Check if an existing user_name exists
 * - If so, returns collectDataFor(user)
 * - If not, return a resolved Promise with an error
 */

const { User } = require('../database')
const { collectDataFor } = require('./collectDataFor')



function logUserIn(req, res) {
  // const last_access = new Date()
  // Read connection details from req.body
  const { user_name, email, password } = req.body


  // Allow user to log in with either username or email
  const promises = [
    findLoggedInUser({ email }),
    findLoggedInUser({ user_name })
  ]


  // Treat the first query which produces a valid user
  return Promise.any(promises)
    .then(treatUserIfFound)
    .catch(treatError) // no valid users found 


  function findLoggedInUser(query) {
    const selection = [ "user_name", "lists", "knots", "hash" ]

    return new Promise(( resolve, reject ) => {
      User.findOne(query).select(selection)
        .then(checkPassword)
        .catch(reject)

      function checkPassword(user) {
        console.log("findLoggedInUser:", user, bcrypt)
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