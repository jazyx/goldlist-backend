/**
 * server/database/models/user.js
 */

const { Schema, model } = require('mongoose')

const schema = new Schema({
  user_id:     { type: String },
  user_name:   { type: String, required: true },
  email:       { type: String },
  hash:        { type: String },
  start_date:  { type: Date, required: true },
  last_access: { type: Date, default: new Date() },
  lists:       { type: Number, default: 0 },
  redos:       { type: Number, default: 10000 }
});

const User = model("User", schema);

module.exports = {
  User
}