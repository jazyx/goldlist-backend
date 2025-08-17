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


function completeReview (req, res, next) {
  const { list_id, reviewed } = req.body
  // console.log("list_id:", list_id)
  // console.log("reviewed:", reviewed)

  // {"list_id":"6887a2639bfb4c75b41073fd","reviewed":[{"_id":"6887a2709bfb4c75b4107403","retained":true},{"_id":"6887a2729bfb4c75b4107407","retained":true},{"_id":"6887a2739bfb4c75b410740b","retained":true},{"_id":"6887a2749bfb4c75b410740f","retained":true},{"_id":"6887a2769bfb4c75b4107413","retained":true},{"_id":"6887a2779bfb4c75b4107417","retained":true,"limit":true},{"_id":"6887a2789bfb4c75b410741b","limit":true}]}

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


  return Promise.all(promises)
    .then(updateReviewsAndRemain)
    .then(combineListsIfNeeded)
    .catch(treatError)


  function updateReviewsAndRemain(reviewed) {
    return new Promise(( resolve, reject ) => {
      const _id = new mongoose.Types.ObjectId(list_id)
      const update = {
        $inc: { reviews: 1, remain: -reviewed.length }
      }

      List.findByIdAndUpdate( _id, update, { new: true } )
        .then(resolve)
        .catch(reject)
    })
  }


  function combineListsIfNeeded(list) {
    const { remain, user_id, total } = list
    const min = Math.floor(total / 3) // 21—>7; 15—>5; 10—>3

    // No recombination needed if remain is 0

    if (Number(remain) && remain <= min) {
      combineLists(user_id, min)
        .then(logNewList)
        .catch(message => console.log(message))
    }

    // Always resolve, even if no lists are simultaneously being
    // combined. The frontend will simply remove the list with the
    // given _id from repos
    return Promise.resolve({ _id: list._id })
  }


  function logNewList(list) {
    console.log("New combined list",
          JSON.stringify(list, null, '  '))
    // return list
  }


  function treatError(error) {
    console.log("completeReview error", JSON.stringify(error, null, '  '));
    
    error = {
      reason: `Review not submitted: ${list_id}`,
      status: 422 // Unprocessable Content
    }

    return Promise.resolve(error)
  }
}


module.exports = {
  completeReview
}