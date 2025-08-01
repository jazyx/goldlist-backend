/**
 * backend/router.js
 */


const router = require('express').Router()
const { checkPass } = require('./middleware')
const { 
  getUserData, 
  savePhrase,
  addList,
  submitReview
} = require('./controllers')


// Ensure that the call came from a client that has already
// connected and received a token.
router.use(checkPass)


router.post("/getUserData", getUserData)
router.post("/savePhrase", savePhrase)
router.post("/addList", addList)
router.post("/submitReview", submitReview)


module.exports = router