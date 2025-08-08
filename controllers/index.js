/**
 * backend/controllers/endpoints.js
 * 
 * - checkCookie
 * - register
 * - guest
 * - savePhrase
 * - addList
 * - submitList
 * - submitReview
 */


const { cookieCheck } = require('./checkCookie')
const { getDataByUserId } = require('./guest')
const { registerUser } = require('./register')
const { logUserIn } = require('./login')
const { saveOrAddPhrase } = require('./savePhrase')
const { addNewList } = require('./addList')
const { submitCompletedList} = require('./submitList')
const { completeReview } = require('./submitReview')


function checkCookie(req, res) {
  cookieCheck(req, res)
}


function guest(req, res) {
  console.log("getUser called with:", req.body, req.session.user_id)
  getDataByUserId(req, res)
    .then(result => {
      respond(req, res, "/guest", result)
    })
}


function register(req, res) {
  // result should be { user, lists, redos }
  // error might be { reason, status }
  console.log("register called req.body:", req.body)
  registerUser(req, res)
  .then(result => {
    respond(req, res, "/register", result)
  })
}


function login(req, res) {
  // result should be { user, lists, redos }
  // error might be { reason, status }
  console.log("login called req.body:", req.body)
  logUserIn(req, res)
  .then(result => {
    respond(req, res, "/login", result)
  })
}


function savePhrase(req, res) {
  console.log("savePhrase called with:", req.body, req.session.user_id)
  saveOrAddPhrase(req, res)
    .then(result => {
      respond(req, res, "/savePhrase", result)
    })
}


function addList(req, res) {
  console.log("addList called with:", req.body, req.session.user_id)
  addNewList(req, res)
    .then(result => {
      respond(req, res, "/addList", result)
    })
}


function submitList(req, res) {
  console.log("submitList called with:", req.body, req.session.user_id)
  submitCompletedList(req, res)
    .then(result => {
      respond(req, res, "/submitList", result)
    })
}


function submitReview(req, res) {
  console.log("submitReview called with:", req.body, req.session.user_id)
  completeReview(req, res)
    .then(result => {
      respond(req, res, "/submitReview", result)
    })
}


// Handle response
function respond(req, res, endpoint, result) {
  const { status } = result // undefined if no error
  const message = {}

  if (result.status) {
     treatError(result)
  } else {
    treatSuccess(result)
  }
  proceed()


  function treatError(error) {
    console.log(`Error in ${endpoint}:\n`, req.body, error);
    message.fail = error
  }


  function treatSuccess(phrase) {
    Object.assign(message, phrase )
  }


  function proceed() {
    if (status) {
      res.status(status)
    }

    res.json(message)
  }
}


module.exports = {
  checkCookie,
  guest,
  login,
  register,
  savePhrase,
  addList,
  submitList,
  submitReview
}
