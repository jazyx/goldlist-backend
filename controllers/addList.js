/**
 * backend/controllers/addList.js
 *
 * 1. Creates a new list with the given user_id
 * 2. Sets the value of User.lists to the index of the new list
 * 3. Responds with details of the new List record
 */


const { mongoose, User, List } = require('../database')


function addNewList(req, res) {
  const { _id, index } = req.body
  const user_id = (typeof _id === "string")
    ? new mongoose.Types.ObjectId(_id)
    : _id // call came from savePreferences

  const selection = { phraseCount: 1 }


  return User.findById( user_id, selection )
    .then(createNewList)


  // Create a new list for this user
  function createNewList(user) {
    const { phraseCount: total } = user
    const query = { user_id, index, total, remain: total }
    console.log("createNewList query", JSON.stringify(query, null, '  '));

    return new List(query)
      .save()
      .then(treatNewList)
      .then(updateUser)
      .catch(treatError)
  }


  // Handle response
  function treatNewList(list) {
    const { _id, index, created, remain, total } = list
    const phrases = []
    const length = 0
    const data = {
      _id,
      index,
      created,
      total,
      remain,
      length,
      phrases
    }
    return Promise.resolve(data)
  }


  function updateUser(data) {
    const query = { _id: user_id }
    const update = { lists: data.index } // from new List record
    const refresh = { new: true }

    return new Promise(( resolve, reject ) => {
      User.findOneAndUpdate(query, update, refresh)
        .then(() => resolve(data)) // ignore updated user
        .catch(reject)
    })
  }



  function treatError(info) {
    const error = {
      reason: `New list for user ${user_id} not updated`,
      fail: true,
      info,
      preferences,
      status: 422 // Unprocessable Content
    }

    return Promise.resolve(error)
  }
}


module.exports = {
  addNewList
}