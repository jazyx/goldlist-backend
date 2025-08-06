/**
 * backend/controllers/index.js
 */


const { checkCookie } = require('./checkCookie')
const { getUserData } = require('./userMethods')
const { savePhrase } = require('./savePhrase')
const { addList } = require('./addList')
const { submitList } = require('./submitList')
const { submitReview } = require('./submitReview')


module.exports = {
  checkCookie,
  getUserData,
  savePhrase,
  addList,
  submitList,
  submitReview
}