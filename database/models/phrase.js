/**
 * server/database/models/user.js
 */

const { Schema, model } = require('mongoose')

const schema = new Schema({
  user_id: { type: Schema.Types.ObjectId },
  text:    { type: String, required: true },
  comment: { type: String },
  tatoeba: { type: String },
  wiktionary: { type: String },
  date_1:  { type: Date },
  date_2:  { type: Date },
  date_3:  { type: Date },
  date_4:  { type: Date }
});

const Phrase = model("Phrase", schema);

module.exports = {
  Phrase
}