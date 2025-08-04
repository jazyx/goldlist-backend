/**
 * backend/server.js
 */

require('dotenv').config()

// Connect to the database or process.exit() if it's not possible
require('./database')

const path = require('path');
const PUBLIC = path.join(__dirname, 'public')

const HTTP = process.env.HTTP
const PROD_REGEX = /^(production|prod|staging|release|deploy)$/i
const is_dev = !PROD_REGEX.test(process.env.NODE_ENV)
process.env.IS_DEV = is_dev

const express = require('express')
const cookieSession = require('cookie-session')
const { serveCookie } = require('./middleware')
const { userCookie } = require('./middleware')
const router = require('./router')

const PORT = process.env.PORT || 3000
const COOKIE_SECRET = process.env.COOKIE_SECRET || "string needed"


const server = express()
server.set('trust proxy', 1)

if (is_dev) {
  // Accept all requests from localhost, or 192.168.0.X,
  // but only in dev mode
  console.log("🤚 USING CORS FOR DEVELOPMENT")
  const options = {
    origin: /http:\/\/(localhost|192\.168\.0\.\d{1,3}):\d+?/,
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE"
  }
  server.use(require('cors')(options))
}

server.use(express.urlencoded({ extended: false }));
server.use(express.json());

const cookieOptions = {
  name: "session",
  keys: [ COOKIE_SECRET ],
  httpOnly: true,
  sameSite: is_dev ? false : true,
  secure: !HTTP
}
server.use(cookieSession(cookieOptions))

server.use(serveCookie)
server.use(userCookie)
server.use(express.static(PUBLIC));
server.use('/', router)

server.listen(PORT, logHostsToConsole)

function logHostsToConsole() {
  // Check what IP addresses are used by this computer
  const nets = require("os").networkInterfaces()
  const ips = Object.values(nets)
  .flat()
  .filter(({ family }) => (
    family === "IPv4")
  )
  .map(({ address }) => address)

  // ips will include `127.0.0.1` which is the "loopback" address
  // for your computer. This address is not accessible from other
  // computers on your network. The host name  "localhost" can be
  // used as an alias for `127.0.0.1`, so you can add that, too.
  ips.unshift("localhost")

  // Log in the Terminal which URLs can connect to your server
  const hosts = ips.map( ip => (
    `http://${ip}:${PORT}`)
  )

  // /private/etc/hosts defines app.org as running at 127.0.0.1
  // and /opt/homebrew/etc/nginx/servers/app.conf creates...
  //
  //   proxy_pass http://127.0.0.1:8888
  //
  // ... so we can connect through http://app.local, too.

  hosts.push("\n  http://app.local")

  console.log(`Express server listening at:
  ${hosts.join("\n  ")}
`);
}