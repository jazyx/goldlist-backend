/**
 * backend/controllers/endpoints.js
 * 
 * - checkCookie
 * - register
 * - getUserData
 * - savePhrase
 * - addList
 * - submitList
 * - submitReview
 */


const { cookieCheck } = require('./checkCookie')
const { registerUser } = require('./register')


function checkCookie(req, res) {
  cookieCheck(req, res)
}


function register(req, res) {
  // result should be { user, lists, redos }
  // error might be { reason, status }
  console.log("register called req.body:", req.body)
  registerUser(req, res)
  .then(result => {
    // result should be a Promise
    respond(req, res, "/register", result)
  })
}


function getUserData(req, res) {

}


function savePhrase(req, res) {

}


function addList(req, res) {

}


function submitList(req, res) {

}


function submitReview(req, res) {

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
  register,
  getUserData,
  savePhrase,
  addList,
  submitList,
  submitReview
}
