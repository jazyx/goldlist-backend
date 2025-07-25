/**
 * server/database/models/user.js
 */

const { Schema, model } = require('mongoose')

const schema = new Schema({
  user_name: { type: String, required: true },
  // email: { type: String },
  // hash: { type: String },
  start_date: { type: Date, required: true },
  last_access: { type: Date, default: new Date() },
  page: { type: Number, default: 0 }
});

const User = model("User", schema);

module.exports = {
  User
}