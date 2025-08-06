/**
 * backend/controllers/checkCookie.js
 */

const is_dev = process.env.IS_DEV === "true"


function checkCookie(req, res) {
  // Send a non-httpOnly cookie for  the front end to check for
  // No maxAge or expiry means that it is a session cookie.
  res.cookie("check", "", {
    httpOnly: false, // This makes it accessible via JavaScript
    secure:   is_dev ? false : true,
    sameSite: is_dev ? "Lax" : "None"
  })

  res.json({ cookie: "sent" })
}

module.exports = {
  checkCookie
}