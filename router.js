/**
 * backend/router.js
 */


const router = require('express').Router()
const { checkPass } = require('./middleware')
const {
  checkCookie,
  guest,
  register,
  login,
  savePhrase,
  addList,
  submitList,
  submitReview,
  setPreferences
} = require('./controllers')


// Ensure that the call came from a client that has already
// connected and received a token.
router.use(checkPass)


router.get("/checkCookie", checkCookie)
router.post("/guest", guest)
router.post("/register", register)
router.post("/login", login)
router.post("/savePhrase", savePhrase)
router.post("/addList", addList)
router.post("/submitList", submitList)
router.post("/submitReview", submitReview)
router.post("/setPreferences", setPreferences)


module.exports = router