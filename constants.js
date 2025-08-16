/**
 * backend/controllers/constants.js
 */


const SALT   = 10 // for bcrypt
const DELAY  = 3 // default number of days between each review
const DAYS   = 24 * 60 * 60 * 1000 // milliseconds in 24 hours
const ACTIVE_AGE = 6 * 60 * 60 * 1000 // 6 hours in milliseconds


module.exports = {
  SALT,
  DELAY,
  DAYS,
  ACTIVE_AGE
}