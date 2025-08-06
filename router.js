/**
 * backend/router.js
 */


const router = require('express').Router()
const { checkPass } = require('./middleware')
const { 
  getUserData, 
  savePhrase,
  addList,
  submitList,
  submitReview,
  checkCookie
} = require('./controllers')


// Ensure that the call came from a client that has already
// connected and received a token.
router.use(checkPass)


router.get("/checkCookie", checkCookie)
router.post("/getUserData", getUserData)
router.post("/savePhrase", savePhrase)
router.post("/addList", addList)
router.post("/submitList", submitList)
router.post("/submitReview", submitReview)


module.exports = router