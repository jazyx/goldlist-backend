/**
 * backend/controllers/index.js
 */


const { getUserData } = require('./userMethods')
const { savePhrase } = require('./savePhrase')
const { addList } = require('./addList')


module.exports = {
  getUserData,
  savePhrase,
  addList
}