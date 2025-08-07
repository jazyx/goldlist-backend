/**
 * backend/controllers/checkCookie.js
 */

const is_dev = process.env.IS_DEV === "true"


function checkCookie(req, res) {
  // Send a non-httpOnly cookie for  the front end to check for
  // No maxAge or expiry means that it is a session cookie.
  const cookie = {
    httpOnly: false, // This makes it accessible via JavaScript
    secure:   !is_dev,
    sameSite: is_dev ? "Lax" : "Strict"
  }
  res.cookie("check", "", cookie)
  console.log("cookie", JSON.stringify(cookie, null, '  '));
  console.log("res.cookie", JSON.stringify(res.cookie, null, '  '));

  res.json({ cookie: "sent" })
}

module.exports = {
  checkCookie
}