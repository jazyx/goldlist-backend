/**
 * backend/controllers/addList.js
 */


const { mongoose, User, List } = require('../database')


function addList(req, res) {
  const { _id, index } = req.body
  const user_id = new mongoose.Types.ObjectId(_id)


  let status = 0
  let message = {}


  // Create a new list for this user
  new List({ user_id, index })
    .save()
    .then(treatNewList)
    .then(updateUser)
    .then(treatSuccess)
    .catch(treatError)
    .finally(proceed)


  // Handle response
  function treatNewList(list) {
    const { _id, index, created, remain } = list
    const phrases = []
    const length = 0
    const data = { _id, index, created, length, remain, phrases }
    return Promise.resolve(data)
  }


  function updateUser(data) {
    const query = { _id: user_id }
    const update = { lists: data.index } // from new List record
    const refresh = { new: true }

    return new Promise(( resolve, reject ) => {
      User.findOneAndUpdate(query, update, refresh)
        .then(user => {
          resolve(data)
        })
      .catch(reject)
    })
  }


  // Handle response
  function treatSuccess(data) {
    Object.assign(message, data )
  }


  function treatError(error) {
    console.log("Error in addList:\n", req.body, error);
    status = 500 // Server error
    message.fail = error
  }


  function proceed() {
    if (status) {
      res.status(status)
    }

    res.json(message)
  }
}


module.exports = {
  addList
}