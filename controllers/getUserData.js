/**
 * backend/controllers/getUserData.js
 * 
 * Checks if a User record exists for user_name/email +
 * password, or failing that user_name+user_id. If not,
 * creates a User record
 */

const { User, Phrase } = require('../database')
const { createUser } = require('./userMethods')


module.exports = function getUserData(req, res, next) {
  const user_id = req.session?.user_id
  const { user_name, email, password } = req.body

  const guest = `${user_name.replace(`_${user_id}`,"")}_${user_id}`
  let status = 0
  let message = next instanceof Function ? {} : next
  // console.log("user_id:", user_id)
  // console.log("user_name:", user_name)
  // console.log("guest:", guest)

  // Allow user to log in with either username or email
  const promises = [
    // findUser({ email }),
    // findUser({ user_name }),
    // findUser({ email: user_id }),
    // findUser({ user_name: user_id })
    findUser({ user_name: guest })
  ]


  Promise.any(promises)
    .then(treatSuccess)
    .catch(treatError)
    .finally(proceed)


  function findUser(query) {
    return new Promise((resolve, reject ) => {
      User.findOne(query)
        .then(checkPassword)
        .catch(reject)

      function checkPassword(user) {
        if (user) {
          // const pass = bcrypt.compareSync(password, user.hash)
          // if (pass) { // true or false
            user.last_date = new Date()
            user.save()
              .then(resolve(user))
          // } else {
          //   reject()
          // }

        } else {
          // The expected User record does not exist yet.
          // Create it
          const start_date = new Date()
          const userData = {
            user_name: (password ? user_name : guest),
            email,
            password,
            start_date,
            last_date: start_date
          }

          return createUser(userData, resolve, reject)
        }
      }
    })
  }




  function treatSuccess(user) {
    const {
      _id,
      user_name,
      email,
      start_date,
      last_date
    } = user
    // _id is the unique value stored in MongoDB

    Object.assign(message, {
      success: "signed_in",
      _id,
      user_id,
      user_name,
      email,
      start_date,
      last_date
    })
  }


  function treatError(error) {
    console.log("Error in getUserData:\n", req.body, error);
    status = 401 // Unauthorized
    message.fail = "unauthorized"
  }


  function proceed() {
    if (status) {
      res.status(status)
    }

    res.json(message)
  }
}