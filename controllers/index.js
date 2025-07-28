/**
 * backend/controllers/index.js
 */


const { getUserData } = require('./userMethods')
const { savePhrase } = require('./savePhrase')


module.exports = {
  getUserData,
  savePhrase
}