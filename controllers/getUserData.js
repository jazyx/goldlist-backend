/**
 * backend/controllers/ping.js
 */


module.exports = function getUserData(req, res) {
  const user_id = req.session?.user_id
  const { userName } = req.body
  
  if (res) {
    res.json({ user_id, userName })
  }
}