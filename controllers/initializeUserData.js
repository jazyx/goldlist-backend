/**
 * backend/controllers/initializeUserData.js
 *
 * When a user connects to the database for the first time, make:
 * + A User record
 * + 12 List records, some of which already have words retained
 *
 *  { "animals":   0,
 *    "building":  1,
 *    "transport": 2,
 *    "ordinals":  3,
 *    "kitchen":   4,
 *    "household": 5,
 *    "verbs":     6,
 *    "food":      7,
 *    "countries": 8,
 *    "colours":   9,
 *    "days":      10,
 *    "cardinals": 11
 *  }
 * 
 * initializeUserData will always create default lists with 10
 * to simplify the demo.
 */


const { List, Phrase } = require('../database')
const dummyData = require('../data/starterData.json')
const { DELAY, DAYS } = require('../constants')
const { formatUserData } = require('./formatUserData')
const backDates = {  // oldest to newest, so index is correct
  "cardinals": 11,
  "days":      10,
  "colours":   9,
  "countries": 8,
  "food":      7,
  "verbs":     6,
  "household": 5,
  "kitchen":   4,
  "ordinals":  3,
  "transport": 2,
  "buildings": 1,
  "animals":   0
}


function initializeUserData(user) {
  const now = new Date().getTime()
  const { _id: user_id } = user

  const entries = Object.entries(backDates)

  // Create a list for each of the objects in backDates...
  const promises = entries.map(([ key, backdate ], index) => {
    const { phrases, data } = getPhrasesData(
      user_id, key, now, backdate, index
    )
    const { reviews, created } = data
    const ago = (DELAY * ( reviews - 1 )) * DAYS
    const retained = new Date(now - ago)

    console.log("key:", key, ", index:", index)

    // ... along with all the phrases for the list
    return new List(data)
      .save()
      .then(list => makePhrases({
        list,
        created,
        retained,
        phrases,
        name: key
      }))
      .then(list => Promise.resolve(list))
      .catch(error => Promise.reject(error))
  })

  const result = Promise.all(promises)
    .then(redos => formatUserData({ user, redos }))
    .catch(treatError)

  return result // should be a Promise
}


function makePhrases({
  list,
  created,
  retained,
  phrases,
  name
}) {
  const { _id: list_id } = list
  const { _id, user_id, index, reviews, remain, total } = list
  const info = {
    _id,
    user_id,
    index,
    created,
    reviews,
    remain,
    total,
    name
  }

  const promises = phrases.map(( phrase, key ) => {
    // { "text": "go", "hint": "идти", "retained": true }
    phrase.lists = [ list_id ]
    phrase.key = key
    phrase.created = created

    if (phrase.retained) {
      // Replace true with the actual date
      phrase.retained = retained
    }
    // limit is left undefined

    return new Phrase(phrase)
      .save()
      .then(result => Promise.resolve(result))
      .catch(error => Promise.reject(error))
  })

  return Promise.all(promises)
    .then(phrases => Promise.resolve({ ...info, phrases }))
    .catch(error => Promise.reject(error))
}


function getPhrasesData(user_id, key, now, backdate, index) {
  const phrases = dummyData[key]

  const remain = phrases.reduce(( sum, phrase ) => {
    sum += !phrase.retained
    return sum
  }, 0)

  const reviews = (remain > 9)
    ? 1
    : (remain > 6)
      ? 2
      : (remain > 4)
        ? 3
        : (remain > 2)
          ? 4
          : 5

  const created = new Date(now - backdate * DAYS)

  const data = {
    user_id,
    index,
    remain,
    reviews,
    created,
    name: key
  }

  return { phrases, data }
}


function treatError(error) {
  console.log("INITIALIZE_USER_DATA error", JSON.stringify(error, null, '  '))

  const errorData = {
    reason: error,
    status: 405 // Method Not Allowed
  }

  return Promise.resolve(errorData)
}


module.exports = {
  initializeUserData
}