/**
 * server/database/models/user.js
 */

const { Schema, model } = require('mongoose')

const schema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  page:    { type: Number, default: 0 },
  text:    { type: String, required: true },
  comment: { type: String },
  // tatoeba: { type: String },
  // wiktionary: { type: String },
  created: { type: Date, default: new Date() },
  rev_1:   { type: String },
  rev_2:   { type: String },
  rev_3:   { type: String }
});

const Phrase = model("Phrase", schema);

module.exports = {
  Phrase
}