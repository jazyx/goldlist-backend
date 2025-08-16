/**
 * server/database/models/phrase.js
 *
 * To create an array of all Phrases in a given list:
 *
 *   const query = { lists: { $elemMatch: { $eq: list._id } } }
 *   const selection = ["text", "hint", "retained" ]
 *   Phrase.find(query).select(selection)
 *
 * (Also includes _id.)
 */

const { Schema, model } = require('mongoose')

const schema = new Schema({
  lists:    { type: [{
              type: Schema.Types.ObjectId,
              ref: "List",
              required: true
            }] },
  key:      { type: Number, required: true},
  text:     {
    type: String,
    // required: true, // won't allow empty stringl
    // validate: {
    //   validator: value => typeof value === "string",
    //   message: 'text field is required but may be empty'
    // },
    default: ""
  },
  hint:     { type: String },
  created:  { type: Date, default: new Date() },
  retained: { type: Date },
  limit:    { type: Boolean } // is this set per phrase?
});

const Phrase = model("Phrase", schema);

module.exports = {
  Phrase
}