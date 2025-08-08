/**
 * backend/controllers/guest.js
 */


const { User } = require('../database/index.js')
const { initializeUserData } = require('./initializeUserData.js')
const { collectDataFor } = require('./collectDataFor.js')



function getDataByUserId(req, res) {
  // const last_access = new Date()
  const user_id = req.session?.user_id || ""


  return User.findOne({ user_id })
    .then(collectOrCreate)
    .catch(treatError)


  function collectOrCreate(user) {
    return (user)
      ? collectDataFor(user) // a guest user was found
      : createUser() // this user_id is new
  }


  function createUser() {
    return new User({ user_id })
      .save()
      .then(initializeUserData)
      .catch(treatError)
  }


  function treatError(reason) {
    const error = {
      reason,
      status: 400 // Bad Request
    }

    console.log("guest createUser error", JSON.stringify(error, null, '  '));

    return Promise.resolve(error)
  }
}


module.exports = {
  getDataByUserId
}