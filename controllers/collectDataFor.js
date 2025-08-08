/**
 * backend/controllers/collectDataFor.js
 */


const { List, Phrase } = require('../database')
const { ACTIVE_AGE, DELAY, REMAIN } = require('../constants')
const { addList } = require('./addList')


// A User record with the appropriate user_name|email+password
// or UUID has been found or created.
function collectDataFor(user) {
  return getActiveLists(user)
    .then(checkList)
    .then(getActiveListPhrases)
    .then(getReviewLists)
    .then(getReviewListPhrases)
    .then(treatSuccess)
    .catch(treatError)


  // function updateLastAccess(user) {
  //   return new Promise(( resolve, reject ) => {
  //     user.last_access = new Date()
  //     user.save()
  //       .then(resolve)
  //       .catch(reject)
  //   })
  // }


  function getActiveLists(user) {
    const { _id: user_id, lists: index } = user
    const selection = ["index", "created", "remain" ]
    const recently = new Date(Date.now() - ACTIVE_AGE);
    const query = {
      user_id,
      $or: [
        { index },
        { $and: [
          { created: { $gte: recently } },
          { submitted: { $ne: true } }
        ]}
      ]
    }

    return new Promise(( resolve, reject ) => {
      List.find(query).select(selection)
        .then(lists => resolve({ user, lists }))
        .catch(reject)
    })
  }


  function checkList({ user, lists }) {
    return new Promise(( resolve, reject) => {
      if (lists.length) {
        return resolve({ user, lists })
      }

      // No active list was found. Create an empty one.
      // THIS SHOULD NOT HAPPEN because an empty list is created
      // for every new user by initializeUserData(). If it does,
      // the Promise will resolve with `user` and a new list or
      // { fail: "some error message" }
      const { _id, index } = user
      const req = { body: { _id, index }}
      const json = lists => resolve({ user, lists })
      const res = { status: () => {} , json }

      addList(req, res)
    })
  }


  /**
   * The array of phrases may contain some that have no text.
   * The frontend will not count these.
   */
  function getActiveListPhrases({ user, lists }) {
    if (lists.fail) {
      // addList failed te create a new empty list for this user
      return Promise.reject(lists.fail)
    }

    const promises = lists.map( list => {
      const { _id, index, created, remain } = list
      const selection = [ "text", "hint" ]

      return new Promise(( resolve, reject ) => {
        const query = { lists: { $elemMatch: { $eq: _id } } }
        const sort = { key: 1 }

        Phrase.find(query).select(selection).sort(sort)
          .then(treatPhrases)
          .catch(reject)

        function treatPhrases(phrases) {
          const list = {
            _id,
            index,
            created,
            remain,
            phrases
          }
          resolve(list)
        }
      })
    })

    return Promise.all(promises)
      .then(lists => Promise.resolve({ user, lists }))
      .catch(error => Promise.reject(error))
  }


  function getReviewLists({ user, lists }) {
    const { _id: user_id } = user

    // Create $expr to find list which...
    // 1. Are older than (today - List.reviews * DELAY days)
    const now = new Date()
    const $expr = {
      $lt: [
        "$created",
        {
          $dateSubtract: {
            startDate: now,
            unit: "day",
            amount: { $multiply: ["$reviews", DELAY] },
          }
        }
      ]
    }
    // 2. Contain more than REMAIN unretained phrases
    const remain = { $gt: REMAIN }
    // 3. Is not an old but still active list
    const index = { $ne: user.lists }

    const $match = {
      user_id,
      index,
      remain,
      $expr
    }
    const $project = {
      "index":   1,
      "created": 1,
      "reviews": 1,
      "remain":  1
    }

    return new Promise(( resolve, reject ) => {
      List.aggregate([
        { $match },
        { $project }
      ])
        .then(redos => {
          resolve({ user, lists, redos })
        })
        .catch(reject)
    })
  }


  function getReviewListPhrases({ user, lists, redos }) {
    const selection = ["text", "hint", "retained", "limit" ]

    const promises = redos.map( list => {
      return new Promise(( resolve, reject ) => {
        const query = { lists: { $elemMatch: { $eq: list._id } } }
        const sort = { key: 1 }

        Phrase.find(query).select(selection).sort(sort)
          .then(phrases => resolve({ ...list, phrases }))
          .catch(reject)
      })
    })

    return new Promise(( resolve, reject ) => {
      return Promise.all(promises)
        .then(redos => resolve({ user, lists, redos }))
        .catch(reject)
    })
  }


  function treatSuccess({ user, lists, redos }) {
    // Keep only necessary user fields
    const {
      _id,
      user_name,
      start_date,
      last_access,
      lists: total,
      knots
    } = user
    user = {
      _id,
      user_name,
      start_date,
      last_access,
      lists: total,
      knots
    }

    return {
      user,
      lists,
      redos
    }
  }


  function treatError(error) {
    console.log("Error in getGuestData:\nmessage", error);

    error = {
      reason: error,
      status: 400
    }

    return Promise.resolve(error)
  }
}


module.exports = {
  collectDataFor
}