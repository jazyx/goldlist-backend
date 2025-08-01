/**
 * backend/controllers/submitReview.js
 */


const { mongoose, Phrase, List } = require('../database')


function submitReview (req, res, next) {
  const { list_id, reviewed } = req.body
  // console.log("list_id:", list_id)
  // console.log("reviewed:", reviewed)

  // {"list_id":"6887a2639bfb4c75b41073fd","reviewed":[{"_id":"6887a2709bfb4c75b4107403","retain":true},{"_id":"6887a2729bfb4c75b4107407","retain":true},{"_id":"6887a2739bfb4c75b410740b","retain":true},{"_id":"6887a2749bfb4c75b410740f","retain":true},{"_id":"6887a2769bfb4c75b4107413","retain":true},{"_id":"6887a2779bfb4c75b4107417","retain":true,"limit":true},{"_id":"6887a2789bfb4c75b410741b","limit":true}]}

  let status = 0
  let message = {}

  const promises = reviewed.map(({ _id, retain, limit }) => {
    return new Promise(( resolve, reject ) => {
      _id = new mongoose.Types.ObjectId(_id)
      const query = { _id }
      const $set = { limit: !!limit }
      if (retain) {
        $set.retained = new Date()
      }

      Phrase.findOneAndUpdate(query, { $set }, { new: true })
        .then(treatUpdate)
        .catch(reject)

      function treatUpdate(phrase) {
        const { _id, text, retained, limit } = phrase
        const data = { _id, text, retained, limit }
        return resolve(data)
      }
    })
  })


  Promise.all(promises)
    .then(updateReviewsAndRemain)
    .then(treatSuccess)
    .catch(treatError)
    .finally(proceed)


  function updateReviewsAndRemain(reviewed) {
    return new Promise(( resolve, reject ) => {
      const _id = new mongoose.Types.ObjectId(list_id)
      const update = {
        $inc: { reviews: 1 },
        $inc: { remain: -reviewed.length}
      }

      List.findByIdAndUpdate(
        _id,
        update,
        { new: true }
      )
        .then(result => {
          console.log("list", JSON.stringify(result, null, '  '));
          const { _id, index, reviews, remain } = result
          const list = { _id, index, reviews, remain }

          resolve({ list, reviewed })
        })
        .catch(reject)
    })
  }

  // Handle response
  function treatSuccess(result) {
    console.log("submitReview result", JSON.stringify(result, null, '  '));

    Object.assign(message, result )
  }


  function treatError(error) {
    console.log("Error in savePhrase:\n", req.body, error);
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
  submitReview
}