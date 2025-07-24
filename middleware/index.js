/**
 * backend/middleware/index.js
 */

const serveCookie = require('./serveCookie.js')
const userCookie = require('./userCookie.js')
const { getToken, checkPass} = require('./jwToken.js')


module.exports = {
  serveCookie,
  userCookie,
  getToken,
  checkPass
}