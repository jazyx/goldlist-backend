/**
 * backend/controllers/submitReview.js
 * 
 * Reads in a list of reviewed phrases and the list_id of the list
 * that they all belong to.
 * 
 * 1. Sets the value of `limit` on each phrase
 * 2. Sets the value of `retained` to a Date object, if required
 * 3. Reduces the `remain` value of the list by the number of
 *    phrases that are now retained
 * 
 * If the number of phrases remaining in the list is < 8, check
 * whether these phrases should be combined with unretained phrase
 * in other lists with < 8 remaining.
 */


const { mongoose, Phrase, List } = require('../database')
const { combineLists } = require('./combineLists')


function submitReview (req, res, next) {
  const { list_id, reviewed } = req.body
  // console.log("list_id:", list_id)
  // console.log("reviewed:", reviewed)

  // {"list_id":"6887a2639bfb4c75b41073fd","reviewed":[{"_id":"6887a2709bfb4c75b4107403","retained":true},{"_id":"6887a2729bfb4c75b4107407","retained":true},{"_id":"6887a2739bfb4c75b410740b","retained":true},{"_id":"6887a2749bfb4c75b410740f","retained":true},{"_id":"6887a2769bfb4c75b4107413","retained":true},{"_id":"6887a2779bfb4c75b4107417","retained":true,"limit":true},{"_id":"6887a2789bfb4c75b410741b","limit":true}]}

  let status = 0
  let message = {}

  const promises = reviewed.map(({ _id, retained, limit }) => {
    return new Promise(( resolve, reject ) => {
      _id = new mongoose.Types.ObjectId(_id)
      const query = { _id }
      const $set = { limit: !!limit }
      if (retained) {
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
    .then(combineListsIfNeeded)
    .then(treatSuccess)
    .catch(treatError)
    .finally(proceed)


  function updateReviewsAndRemain(reviewed) {
    return new Promise(( resolve, reject ) => {
      const _id = new mongoose.Types.ObjectId(list_id)
      const update = {
        $inc: { reviews: 1, remain: -reviewed.length }
      }

      List.findByIdAndUpdate( _id, update, { new: true } )
        .then(result => {
          const { _id, user_id, index, reviews, remain } = result
          const list = { _id, user_id, index, reviews, remain }

          resolve({ list, reviewed })
        })
        .catch(reject)
    })
  }


  function combineListsIfNeeded(result) {
    const { list } = result
    const { remain, user_id } = list

    if (remain < 8) {
      combineLists(user_id)
        .then(list => console.log(
          "New combined list",
          JSON.stringify(list, null, '  '))
        )
        .catch(message => console.log(message))
    }
    // Always resolve, even if no lists were combined
    return Promise.resolve(result)
  }

  // Handle response
  function treatSuccess(result) {
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