/**
 * backend/controllers/checkCookie.js
 */

const is_http = process.env.HTTP === "true"

function cookieCheck(req, res) {
  // Send a non-httpOnly cookie for  the front end to check for
  // No maxAge or expiry means that it is a session cookie.
  const cookie = {
    httpOnly: false, // This makes it accessible via JavaScript
    secure:   !is_http,
    sameSite: is_http ? "Lax" : "Strict"
  }
  res.cookie("check", "", cookie)
  console.log("cookie", JSON.stringify(cookie, null, '  '));
  console.log("res.cookie", JSON.stringify(res.cookie, null, '  '));

  res.json({ cookie: "sent" })
}

module.exports = {
  cookieCheck
}