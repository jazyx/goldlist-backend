/**
 * backend/server.js
 */

require('dotenv').config()
			
const PROD_REGEX = /^(production|prod|staging|release|deploy)$/i
const is_dev = !PROD_REGEX.test(process.env.NODE_ENV)
process.env.IS_DEV = is_dev

const express = require('express')
const cookieSession = require('cookie-session')
const { serveCookie } = require('./middleware')
const router = require('./router')

const PORT = process.env.PORT || 3000
const COOKIE_SECRET = process.env.COOKIE_SECRET || "string needed"

const cookieOptions = {
  name: "pass",
  keys: [ COOKIE_SECRET ],
  httpOnly: true,
  sameSite: true
}

const server = express()
if (is_dev) {
  // Accept all requests... but only in dev mode
  console.log("🤚USING CORS FOR DEVELOPMENT")
  server.use(require('cors')())
}
server.use(cookieSession(cookieOptions))

server.use(serveCookie)
server.use(express.static('public'));
server.use('/', router)

server.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`)
})