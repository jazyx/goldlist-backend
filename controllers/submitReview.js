/**
 * backend/controllers/submitReview.js
 */


function submitReview (req, res, next) {
  const { list_id, reviewed } = req.body
  console.log("list_id:", list_id)
  console.log("reviewed:", reviewed)


  let status = 0
  let message = {}
  
  // {"list_id":"6887a2639bfb4c75b41073fd","reviewed":[{"_id":"6887a2709bfb4c75b4107403","retain":true},{"_id":"6887a2729bfb4c75b4107407","retain":true},{"_id":"6887a2739bfb4c75b410740b","retain":true},{"_id":"6887a2749bfb4c75b410740f","retain":true},{"_id":"6887a2769bfb4c75b4107413","retain":true},{"_id":"6887a2779bfb4c75b4107417","retain":true,"limit":true},{"_id":"6887a2789bfb4c75b410741b","limit":true}]}

  // Simply echo the incoming message
  res.json(req.body)
}


module.exports = {
  submitReview
}