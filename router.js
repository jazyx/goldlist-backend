/**
 * backend/router.js
 */


const router = require('express').Router()
const { checkPass } = require('./middleware')
const { ping } = require('./controllers')


// Ensure that the call came from a client that has already
// connected and received a token.
router.use(checkPass)


router.get("/ping", ping)


module.exports = router