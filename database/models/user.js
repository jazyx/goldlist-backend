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
const bcrypt = require('bcryptjs');
const { SALT } = require('../../constants')


const schema = new Schema({
  user_id:     { type: String },
  user_name:   { type: String, trim: true },
  lowercase:   { type: String, lowercase: true },
  email:       { type: String },
  hash:        { type: String },
  start_date:  { type: Date, default: new Date() },
  last_access: { type: Date, default: new Date() },
  lists:       { type: Number, default: 0 },
  knots:       { type: Number, default: 0 }
});


// Store user_name case-sensitive, with a lowercase version
schema.pre("save", function(next) {
  const hasUser_name = this.user_name
  const user_nameHasChanged = this.isModified('user_name') // ""?
  if (hasUser_name || user_nameHasChanged) {
    this.lowercase = this.user_name.toLowerCase();
  }
  next();
});


// Store email always in lowercase
schema.pre("save", function(next) {
  const hasEmail = this.email
  const emailHasChanged = this.isModified('email') // ""?
  if (hasEmail || emailHasChanged) {
    this.email = this.email.toLowerCase();
  }
  next();
});


// Hash password before saving the user, if it is modified or new
schema.pre('save', async function(next) {
  const hasChanged = this.isModified('hash')
  if (hasChanged) {
    try {
      // Salt rounds, higher number = more secure but slower
      const salt = await bcrypt.genSalt(SALT);
      this.hash = await bcrypt.hash(this.hash, salt);
    } catch (error) {
      return next(error); // Handle errors
    }
  }
  next();
});


const User = model("User", schema);


module.exports = {
  User
}