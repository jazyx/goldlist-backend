/**
 * backend/controllers/submitList.js
 * 
 * Reads list _id from req.body
 * Sets submitted to true for given list
 * Responsd with { _id, submitted }
 */


const { mongoose, List } = require('../database')


function submitList(req, res, next) {
  const _id = new mongoose.Types.ObjectId(req.body._id)


  let status = 0
  let message = {}


  const $set = {
    submitted: true
  }
  List.findByIdAndUpdate(
    _id,
    { $set },
    { new: true }
  )
    .then(treatSuccess)
    .catch(treatError)
    .finally(proceed)


  // Handle response
  function treatSuccess({ _id, submitted }) {
    Object.assign(message, { _id, submitted } )
  }


  function treatError(error) {
    console.log("Error in submitList:\n", req.body, error);
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
  submitList
}