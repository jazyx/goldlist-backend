/**
 * server/database/models/user.js
 * 
 * The frontend does not require all fields.
 * 
 *   const query = { user_name}
 *   const selection = [ "user_name", "lists", "knots" ]
 *   User.findOne(query).select(selection)
 * 
 * (Also includes _id.)
 */

const { Schema, model } = require('mongoose')

const schema = new Schema({
  user_id:     { type: String },
  user_name:   { type: String, required: true, unique: true },
  email:       { type: String },
  hash:        { type: String },
  start_date:  { type: Date, required: true },
  last_access: { type: Date, default: new Date() },
  lists:       { type: Number, default: 0 },
  knots:       { type: Number, default: 10000 }
});

const User = model("User", schema);

module.exports = {
  User
}