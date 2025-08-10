/**
 * backend/controllers/setPreferences.js
 * 
 * 1. Creates a new list with the given user_id
 * 2. Sets the value of User.lists to the index of the new list
 * 3. Responds with details of the new List record
 */


const { mongoose, User } = require('../database')


function savePreferences(req, res) {
  const { _id: user_id , preferences = {} } = req.body
  const _id = new mongoose.Types.ObjectId(user_id)

  return User.findByIdAndUpdate(
    _id,
    { $set: preferences },
    { new: true }
  )
    .then(confirmPreferences)


  function confirmPreferences(user) {
    if (!user) {
      return treatError()
    }

    const keys = Object.keys(preferences)
    keys.push ( "_id" )
    const data = keys.reduce(( data, key ) => {
      data[key] = user[key]
      return data
    }, {})

    return Promise.resolve(data)
  }


  function treatError() {
    const error = {
      reason: `Preferences for user ${_id} not updated`,
      preferences,
      status: 422 // Unprocessable Content
    }

    return Promise.resolve(error)
  }
}


module.exports = {
  savePreferences
}