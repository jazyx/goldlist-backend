/**
 * server/database/models/phrase.js
 *
 * To create an array of all Phrases in a given list for a given
 * user:
 *
 *   const filter = {
 *     user_id: <>,
 *     lists: { $elemMatch: <> }
 *   }
 *   const select = ["text", "hint", "retained" ]
 *   Phrase.find(filter).select(select)
 */

const { Schema, model } = require('mongoose')

const schema = new Schema({
  user_id:  {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  lists:    { type: [Number], required: true },
  text:     { type: String, required: true },
  hint:     { type: String },
  created:  { type: Date, default: new Date() },
  retained: { type: Date }
});

const Phrase = model("Phrase", schema);

module.exports = {
  Phrase
}