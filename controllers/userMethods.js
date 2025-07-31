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
const { addList } = require('./addList')
const DELAY = 3
const REMAIN = 7



function getUserData(req, res) {
  const last_access = new Date()
  const user_id = req.session?.user_id || ""
  const { user_name, email, password } = req.body

  // Ensure `guest` does not accumulate extra user_ids
  const guest = `${user_name.replace(`_${user_id}`,"")}_${user_id}`

  let status = 0
  let message = {}

  // Allow user to log in with either username or email
  const promises = [
    // findUser({ email }),
    // findUser({ user_name }),
    // findUser({ email: user_id }),
    // findUser({ user_name: user_id })
    findUser({ user_name: guest })
  ]


  // Treat the first query which produces a valid user
  Promise.any(promises)
    .then(treatSuccess) // resolves with a User record
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
      // If there is an existing user with the GUEST+UUID name,
      // then use that.
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
      // the GUEST+UUID name.
      function createUser(skip) {
        if (skip) { return } // already resolved in checkPassword

        const userData = {
          user_name: (password ? user_name : guest),
          // email,
          // password,
          start_date: last_access,
          page: 0
        }

        new User(userData)
          .save()
          .then(resolve) // the new User is the resolve argument
          .catch(reject)
      }
    })
  }


  // A User record with the appropriate user_name|email+password
  // or GUEST+UUID has been found or created.
  function treatSuccess(user) {
    updateLastAccess(user)
      .then(getActiveList)
      .then(checkList)
      .then(getActiveListPhrases)
      .then(getReviewLists)
      .then(getReviewListPhrases)
      .then(prepareMessage)
      .catch(treatError)
      .finally(proceed)
  }


  function updateLastAccess(user) {
    return new Promise(( resolve, reject ) => {
      user.last_access = last_access
      user.save()
        .then(resolve)
        .catch(reject)
    })
  }


  function getActiveList(user) {
    const { _id: user_id, lists: index } = user
    const selection = ["index", "created", "remain" ]

    return new Promise(( resolve, reject ) => {
      const query = { user_id, index }

      List.findOne(query).select(selection)
        .then(list => resolve({ user, list }))
        .catch(reject)

    })
  }


  function checkList({ user, list }) {
    return new Promise(( resolve, reject) => {
      if (list) {
        return resolve({ user, list })
      }

      // No active list was found. Create an empty one
      const { _id, index } = user
      const req = { body: { _id, index }}
      const json = list => resolve({ user, list })
      const res = { status: 0, json }

      addList(req, res)
    })
  }


  /**
   * The array of phrases may contain some that have no text.
   * The frontend will not count these.
   */
  function getActiveListPhrases({ user, list }) {
    const { _id, index, created, remain } = list
    const selection = [ "text", "hint", "retained" ]

    return new Promise(( resolve, reject ) => {
      const query = { lists: { $elemMatch: { $eq: _id } } }

      Phrase.find(query).select(selection)
        .then(treatPhrases)
        .catch(reject)

      function treatPhrases(phrases) {
        const lists = [{
          _id,
          index,
          created,
          remain,
          phrases
        }]
        resolve({ user, lists })
      }
    })
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
    const selection = ["text", "hint", "retained" ]

    const promises = redos.map( list => {
      return new Promise(( resolve, reject ) => {
        const query = { lists: { $elemMatch: { $eq: list._id } } }

        Phrase.find(query).select(selection)
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


  function prepareMessage({ user, lists, redos }) {
    Object.assign(message, {
      user,
      lists,
      redos
    })
  }


  function treatError(error) {
    console.log("Error in getUserData:\n", JSON.stringify(error, null, '  '), "\nreq.body\n", JSON.stringify(req.body, null, '  '));

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
  getUserData
}