/**
 * backend/controllers/userMethods.js
 *
 * getUserData:
 *   1. Checks if a User record exists for user_name/email +
 *   password, or failing that user_name+user_id. If not...
 *   2. Creates a User record
 *   3. Updates last_access
 *   4. (Adds some dummy phrases for current User)
 *   5. Retrieves dummy phrases for current User
 *   6. Generates a JSON message with User and Phrase data
 *   7. Responds with the JSON message, or an error JSON
 *      {
 *        "user": {
 *          "_id": "6885dff18637f1dff16ff4d7",
 *          "user_name": "User_One",
 *          "lists": 3,
 *          "knots": 10000,
 *          "last_access": "2025-07-27T09:18:28.715Z"
 *        },
 *        "lists": [{
 *          "_id": "6885dff18637f1dff16fe3cb"
 *          "index": 3,
 *          "remain": 21,
 *          "length": 20
 *          "phrases": [
 *            "Great Britain",
 *            "England",
 *            "Scotland",
 *            "+ 17 more items"
 *          ]
 *        }, ...],
 *        "redos": [
 *          {
 *            "list": {
 *              "_id": "6885dff18637f1dff16ff4da",
 *              "user_id": "6885dff18637f1dff16ff4d7",
 *              "index": 0,
 *              "created": "2025-07-17T00:00:00.000Z",
 *              "reviews": 3,
 *              "remain": 10,
 *              "__v": 0
 *            },
 *            "phrases": [
 *              "one",
 *              "two",
 *              "three",
 *              "+ 17 more items"
 *            ]
 *          }, ...
 *        ]
 *      }
 */


const { User, List, Phrase } = require('../database')
const { initializeUserData } = require('./initializeUserData.js')
const { addList } = require('./addList')
const DELAY = 14
const REMAIN = 7
const ACTIVE_AGE = 6 * 60 * 60 * 1000 // 6 hours in milliseconds



function getUserData(req, res) {
  const last_access = new Date()
  const user_id = req.session?.user_id || ""
  const { user_name, email, password } = req.body

  let status = 0
  let message = {}

  if (!password && !user_id) {
    status = 403 // Forbidden
    const error = {
      message: "No user_id cookie or password",
      stack: "N/A"
    }
    treatError(error)
    return proceed()
  }

  // Allow user to log in with either username or email, or an
  // anonymouse user_id from a cookie.
  const promises = [
    findUser({ email }),
    findUser({ user_name }),
    findUser({ user_id })
  ]


  // Treat the first query which produces a valid user
  Promise.any(promises)
    .then(collectDataFor) // resolves with a User record
    .catch(treatError)


  function findUser(query) {
    const selection = [ "user_name", "lists", "knots" ]

    return new Promise(( resolve, reject ) => {
      User.findOne(query).select(selection)
        .then(checkPassword)
        .then(createUser)
        .catch(reject)

      // If there is no password in the body, then the user is not
      // logging in with a registered user_name or email address.
      // If there is an existing user with the UUID name, then use
      // that.
      function checkPassword(user) {
        if (user) {
          const pass = !password
            || bcrypt.compareSync(password, user.hash)

          if (!pass) {
            // A password was provided, but it was wrong
            return reject()
          }

          resolve(user)

          return true // Skip creating a new user
        }
      }


      // If there is no matching User, then create a new User with
      // the UUID name + a default set of lists and phrases
      function createUser(skip) {
        if (skip) { return } // already resolved in checkPassword

        const userData = {
          user_name: (password ? user_name : user_id),
          // email,
          // password,
          start_date: last_access,
        }

       initializeUserData(userData)
         .then(treatNewUser)
         .catch(error => {
          console.log("error", JSON.stringify(error, null, '  '))
          console.log("error:", error)
         })


        function treatNewUser(initial) {
          // Separation of redos into redos + lists moved to
          // register.js, as it is not needed here
          resolve(initial.user)
        }
      }
    })
  }
}


// A User record with the appropriate user_name|email+password
// or UUID has been found or created.
function collectDataFor(user) {
  updateLastAccess(user)
    .then(getActiveLists)
    .then(checkList)
    .then(getActiveListPhrases)
    .then(getReviewLists)
    .then(getReviewListPhrases)
    .then(treatSuccess)
    .catch(treatError)
    .finally(proceed)


  function updateLastAccess(user) {
    return new Promise(( resolve, reject ) => {
      user.last_access = last_access
      user.save()
        .then(resolve)
        .catch(reject)
    })
  }


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
      Promise.all(promises)
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

    Object.assign(message, {
      user,
      lists,
      redos
    })

    // console.log("message", JSON.stringify(message, null, '  '));

  }


  function treatError(error) {
    console.log("Error in getUserData:\nmessage", error.message, "\nstack:", error.stack, "\nreq.body\n", JSON.stringify(req.body, null, '  '));

    status = status || 500 // Server error
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
  getUserData,
  collectDataFor
}