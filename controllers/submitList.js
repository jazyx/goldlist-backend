/**
 * backend/controllers/submitList.js
 * 
 * Reads list _id from req.body
 * Sets submitted to true for given list
 * Responsd with { _id, submitted }
 */


const { mongoose, List } = require('../database')


function submitCompletedList(req, res, next) {
  const _id = new mongoose.Types.ObjectId(req.body._id)

  const $set = {
    submitted: true
  }
  return List.findByIdAndUpdate(
    _id,
    { $set },
    { new: true }
  )
    .then(treatSuccess)
    .catch(treatError)
  


  function treatSuccess({ _id, submitted }) {
    return Promise.resolve( { _id, submitted } )
  }


  function treatError(error) {
    console.log("submitCompletedList error", JSON.stringify(error, null, '  '));
    
    error = {
      reason: `List not submitted: ${_id}`,
      status: 422 // Unprocessable Content
    }

    return Promise.resolve(error)
  }
}


module.exports = {
  submitCompletedList
}