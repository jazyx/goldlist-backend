/**
 * backend/middleware/userCookie.js
 * 
 * Ensures that a unique http_only user_id cookie value is stored
 * in the browser
 */


const { v4: uuid } = require('uuid');


const userCookie = (req, res, next) => {
  let user_id = req.session?.user_id

  if (!user_id) {
    user_id = uuid()
    console.log("CREATE user_id:", user_id)
    req.session.user_id = user_id
  } else {
    console.log("EXISTING user_id:", user_id)
  }

  next()
}


module.exports = userCookie