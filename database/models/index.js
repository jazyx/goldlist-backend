/**
 * server/database/models/index.js
 */

const { User } = require('./user.js')
const { List } = require('./list.js')
const { Phrase } = require('./phrase.js')


module.exports = {
  User,
  List,
  Phrase
}
