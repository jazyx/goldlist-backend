/**
 * backend/controllers/initializeUserData.js
 *
 * When a user connects to the database for the first time, make:
 * + A User record
 * + 6 List records
 *   5.   Active list    (20/21 animals)
 *   4.   Review 21->14  (numbers, in digits)
 *   3.   Review 14->10  (colours)
 *   2.   Review 10->7   (times)
 *   0,1. 2x Review 7, to become a repeat list (verbs, food)
 * + 125 Phrase records
 *
 *  { "animals": 0,
 *    "numbers": 14,
 *    "colours": 28,
 *    "times":   42,
 *    "food":    43,
 *    "verbs":   44
 *  }
 */


const { List, Phrase } = require('../database')
const dummyData = require('./dummyData.json')
const { DELAY, DAYS } = require('../constants')
const { formatUserData } = require('./formatUserData')
const backDates = { // oldest to newest, so index is correct
  "verbs":   44,
  "food":    43,
  "times":   42,
  "colours": 28,
  "numbers": 14,
  "animals":  0
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

    // ... along with all the phrases for the list
    return new List(data)
      .save()
      .then(list => makePhrases({
        list,
        created,
        retained,
        phrases
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
}) {
  const { _id: list_id } = list
  const { _id, user_id, index, reviews, remain } = list
  const info = { _id, user_id, index, created, reviews, remain }

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

  const reviews = (remain > 20)
    ? 1
    : (remain > 14)
      ? 2
      : (remain > 9)
        ? 3
        : (remain > 6)
          ? 4
          : 5

  const created = new Date(now - backdate * DAYS)

  const data = {
    user_id,
    index,
    remain,
    reviews,
    created
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