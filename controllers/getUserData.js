/**
 * backend/controllers/getUserData.js
 */


const bcrypt = require('bcryptjs')
const { User, List, Phrase } = require('../database')
const { initializeUserData } = require('./initializeUserData.js')
const { collectDataFor } = require('./collectDataFor.js')




function getData(req, res) {
  const last_access = new Date()
  const user_id = req.session?.user_id || ""
  const { user_name, email, password } = req.body

  // There must be either a password (with email or user_name)
  // or a user_id
  if (!password && !user_id) {
    const error = {
      reason: "No user_id or password",
      status: 403 // Forbidden
    }

    return Promise.resolve(error)
  }

  // Allow user to log in with either username or email
  const promises = [
    findLoggedInUser({ email }),
    findLoggedInUser({ user_name })
  ]


  // Treat the first query which produces a valid user
  return Promise.any(promises)
    .then(checkForUser) // registered user
    .catch(noRegisteredUserFound)
    .finally(result => {
      console.log(result)
    })


  function findLoggedInUser(query) {
    const selection = [ "user_name", "lists", "knots", "hash" ]

    return new Promise(( resolve, reject ) => {
      User.findOne(query).select(selection)
        .then(checkPassword)
        .catch(reject)

      // If there is no password in the body, then the user is not
      // logging in with a registered user_name or email address.
      // If there is an existing user with the UUID name, then use
      // that.
      function checkPassword(user) {
        console.log("findLoggedInUser:", user, bcrypt)
        if (user) {
          if (password & user.hash) {
          bcrypt.compare(password, user.hash)
            .then(result => {
              console.log(`${password} matches ${user.hash}`, result)
              ;(result)
                ? resolve(user)
                : reject("Invalid username or password")
            })
          } else {
            console.log(`Can't compare "${password}" and "${user.hash}"`)
            resolve()
          }
        } else {
          const message = `No user matching ${user_name} or ${email}`
          console.log("bcrypt fail:", message)
          reject(message)
        }
      }
    })
  }


  function noRegisteredUserFound(state) {
    // console.log("state:", state)
    if (user_name || email) {
      const error = {
        reason: "Invalid username or password",
        status: 403 // Forbidden
      }

      return Promise.resolve(error)
    }
    
    return treatUserID()
  }


  /**
   * If user exists, then it was identifed by user_name or email
   * and the password was correct
   */
  function checkForUser(user) {
    if (Array.isArray(user)) {
      user = user[0]
    }
    return (user)
      ? collectDataFor(user) // a registered user was found
      : treatUserID() // neither user_name nor email matched
  }


  function treatUserID() {
    return User.findOne({ user_id })
      .then(collectOrCreate)
      .catch(createUser)


    function collectOrCreate(user) {
      return (user)
        ? collectDataFor(user) // a guest user was found
        : createUser() // this user_id is new
    }

    function createUser(skip) {
      return new User({ user_id })
        .save()
        .then(initializeUserData)
        .catch(treatError)
    }
  }


  function treatError(reason) {
    const error = {
      reason,
      status: 400 // Bad Request
    }

    console.log("getUserData createUser error", JSON.stringify(error, null, '  '));

    return Promise.resolve(error)
  }
}


module.exports = {
  getData
}