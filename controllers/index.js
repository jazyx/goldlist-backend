/**
 * backend/controllers/index.js
 */


const { getUserData } = require('./userMethods')
const { savePhrase } = require('./savePhrase')
const { addList } = require('./addList')
const { submitReview } = require('./submitReview')


module.exports = {
  getUserData,
  savePhrase,
  addList,
  submitReview
}