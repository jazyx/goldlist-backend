/**
 * server/database/models/index.js
 */

const { User } = require('./user.js')
const { Phrase } = require('./phrase.js')


module.exports = {
  User,
  Phrase
}
