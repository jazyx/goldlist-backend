/**
 * backend/middleware/jwToken.js
 */



const { join } = require('path')
const INDEX = join(process.cwd(), 'public/index.html')

const jwt = require("jsonwebtoken")
const JWT_SECRET = process.env.JWT_SECRET || "secret needed"
const is_dev = process.env.IS_DEV === "true"


const DEFAULTS = {
  algorithm: 'HS256',
  allowInsecureKeySizes: true
}


const getToken = ( payload, options = {} ) => {
  if (typeof options !== "object") {
    // Ignore options if it's not an object
    options = {}
  }

  // Overwrite DEFAULTS with explicit options with the same key
  options = { ...DEFAULTS, ...options }

  const token = jwt.sign(
    payload,
    JWT_SECRET,
    options
  )

  return token
}


const checkPass = (req, res, next) => {
  const pass = req.session?.pass
  const referer = req.headers.referer
  const path = req.path

  const apiRegex = /\/checkCookie|guest|register|login|savePhrase|addList|submitList|submitReview|setPreference/
  const isAPI = apiRegex.test(path)

  let status = 0
  let message = ""

  if (!isAPI || !pass) {
    // Ignore API request: serve home page + cookie instead
    return res.redirect("/")

  } else if (is_dev && referer) {
    // Allow API calls from the dev frontend on a different port
    console.log(`🤚 DEV PASS ${req.path} REQUEST FOR ${referer}`)
    proceed()

  } else {
    // Check pass in production mode before allowing API calls, 
    // and also in dev mode if Express is hosting the frontend.
    jwt.verify(pass, JWT_SECRET, treatPass)
  }

  function treatPass(error, payload) {
    const regex = new RegExp(payload)

    const sendHome =
       referer // ⚠️ client may maliciously set no-referer
    && ( error // the JWT token was invalid
      || !regex.test(referer) // referer undefined or invalid
    )

    if (sendHome) {
      // Ignore API request: respond with index.html file 
      return res.sendFile(INDEX)
    }

    proceed() // with API request
  }

  function proceed() {
    if (status) {
      return res.status(status).send({ message })
    }

    next()
  }
}


module.exports = {
  getToken,
  checkPass
}