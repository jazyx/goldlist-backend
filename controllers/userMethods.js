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
 *          "_id": "6885d12a13e8225e32723403",
 *          "user_name": "User_One",
 *          "start_date": "2025-07-17T00:00:00.000Z",
 *          "last_access": "2025-07-27T07:18:31.231Z"
 *        },
 *        "list": {
 *          "index": 3,
 *          "phrases": [ <20 {entries}> ]
 *        },
 *        "redos": [
 *          {
 *            "_id": "6885d12a13e8225e32723408",
 *            "user_id": "6885d12a13e8225e32723403",
 *            "index": 2,
 *            "created": "2025-07-23T00:00:00.000Z",
 *            "reviews": 1,
 *            "remain": 21,
 *            "__v": 0
 *          }
 *        ]
 *      }
 *
 * addPhrase:
 *   Does nothing yet
 */

const { User, List, Phrase } = require('../database')
const DELAY = 4


function getUserData(req, res) {
  const last_access = new Date()
  const user_id = req.session?.user_id
  const { user_name, email, password } = req.body

  const guest = `${user_name.replace(`_${user_id}`,"")}_${user_id}`
  let status = 0
  let message = {}
  let user

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
    return new Promise(( resolve, reject ) => {
      User.findOne(query)
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
      // .then(addDummyPhrases)
      .then(getActiveList)
      .then(getReviewLists)
      // .then(getPageOfPhrases)
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


  function addDummyPhrases(user) {
    // For testing, add some dummy phrases for page 0
    return new Promise(( resolve, reject ) => {
      const { _id: user_id, page } = user

      const phrases = [
        { text: "дом",     comment: "house" },
        { text: "вошь",    comment: "louse" },
        { text: "мышь",    comment: "mouse" },
        { text: "куст",    comment: "bush"  },
        { text: "фонтан",  comment: "gush"  },
        { text: "тишина",  comment: "hush"  },
        { text: "пышный",  comment: "lush"  },
        { text: "каша",    comment: "mush"  },
        { text: "толкать", comment: "push"  },
        { text: "спешка",  comment: "rush"  }
      ]

      const promises = phrases.map( phrase => {
        return new Promise(( resolve, reject ) => {
          new Phrase({ ...phrase, user_id, page })
            .save()
            .then(resolve)
            .catch(reject)
        })
      })

      Promise.all(promises)
        .then(resolve(user))
        .catch(reject)
    })
  }


  function getActiveList(user) {
    const { _id: user_id, lists: index } = user

    return new Promise(( resolve, reject ) => {
      const filter = {
        $and: [
          { user_id },
          { lists: { $elemMatch: { $eq: index } } }
        ]
      }

      Phrase.find(filter)
        .then(treatPhrases)

      function treatPhrases(phrases) {
        const list = {
          index,
          phrases
        }
        resolve({ user, list })
      }
    })
  }


  /**
   * Finds lists which:
   * 1. Have more than 7 remains
   * 2. Are older than today - List.reviews * delay
   * @returns
   */
  function getReviewLists({ user, list }) {
    const { _id: user_id } = user
    return new Promise(( resolve, reject ) => {
      const now = new Date()


      List.aggregate([
        {
          $match: {
            user_id,
            remain: { $gt: 7 },
            $expr: {
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
          }
        }
      ])
        .then(redos => {
          console.log("lists", JSON.stringify(redos, null, '  '));
          resolve({ user, list, redos })
        })

    })
  }


  function getPageOfPhrases(user) {
    return new Promise(( resolve, reject ) => {
      const filter = {
        $and: [
          { user_id: user._id },
          { lists: { $elemMatch: { $eq: user.lists } } }
        ]
      }

      Phrase.find(filter)
        .then(phrases => resolve({ user, phrases }))
        .catch(reject)
    })
  }


  function prepareMessage({ user, list, redos }) {
    const {
      _id,
      user_name,
      email,
      start_date,
      last_access
    } = user

    Object.assign(message, {
      user: {
        _id,
        user_name,
        email,
        start_date,
        last_access
      },
      list,
      redos
    })
  }


  function treatError(error) {
    console.log("Error in getUserData:\n", req.body, error);
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


function addPhrase(user, phrase) {

}

module.exports = {
  getUserData,
  addPhrase
}