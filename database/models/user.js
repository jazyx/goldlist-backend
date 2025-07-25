/**
 * server/database/models/user.js
 */

const { Schema, model } = require('mongoose')

const schema = new Schema({
  user_name: { type: String, required: true },
  email: { type: String },
  hash: { type: String },
  start_date: { type: Date, required: true },
  last_date: { type: Date, required: true }
});

const User = model("User", schema);

module.exports = {
  User
}