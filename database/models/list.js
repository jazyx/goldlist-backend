/**
 * server/database/models/user.js
 * 
 * To get an array of lists which
 * + belong to a given user
 * + still have more than 7 unretained elements
 * + are overdue for review by DELAY days:
 * 
 * const DELAY = 3
 * const now = new Date()
 * 
 * List.aggregate([
 *   {
 *     $match: {
 *       user_id,
 *       remain: { $gt: 7 },
 *       $expr: {
 *         $lt: [
 *           "$created",
 *           {
 *             $dateSubtract: {
 *               startDate: now,
 *               unit: "day",
 *               amount: { $multiply: ["$reviews", DELAY] },
 *             }
 *           }
 *         ]
 *       }
 *     }
 *   }
 * ]).then(lists => doStuff(lists))
 */

const { Schema, model } = require('mongoose')

const schema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  index:   { type: Number, default: 0 },
  created: { type: Date, default: new Date() },
  reviews: { type: Number, default: 1 },
  remain:  { type: Number, default: 21 }
});

const List = model("List", schema);

module.exports = {
  List
}