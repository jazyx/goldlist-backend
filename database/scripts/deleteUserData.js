/** 
 * Call like this...
 * 
 *   node deleteUserData.js George Ringo
 * 
 * ... or with no user_names to delete all unregistered users
 */
 

MONGO_DB = "mongodb://localhost:27017/goldlist" // in .env
const mongoose = require("mongoose");
const {
  User,
  List,
  Phrase
} = require("../models")

mongoose.set("strictQuery", true); // false by default > v6


mongoose
  .connect(MONGO_DB)
  .then(() => {
    console.log(`Connected to ${MONGO_DB}`)
  })

  .catch( error => {
    console.log("DB connection ERROR:\n", error);
    process.exit()
  })

/////

const names = process.argv
  .slice(2)
  .map( name => name.toLowerCase())
console.log("names:", names || "[\"\"]")

let query
if (names.length) {
  query = { lowercase: { $in: names } }
} else {
  // Delete all unregistered users (with no usernames)
  query = { lowercase: { $eq: null }}
}


User.find(query)
  .then(extractUserIds)
  .then(findListIdsForUser)
  .then(deletePhrasesInLists)
  .then(deleteLists)
  .then(deleteUser)
  .then(finish)

function extractUserIds(users) {
  return { user_ids: users.map( user => user._id ) }
}

function findListIdsForUser(data) {
  const { user_ids } = data
  const query = { user_id: { $in: user_ids } }
  return List.find(query)
    .then(extractListIds)
    .then(list_ids => ({ ...data, list_ids }))
}

function extractListIds(lists) {
  return lists.map( list => list._id )
}

function deletePhrasesInLists(data) {
  const list_ids = data.list_ids
  const query = { lists: { $in: list_ids }}

  if ( list_ids && list_ids.length) {
    return Phrase.deleteMany(query)
      .then(result => console.log("Phrases deleted:", result))
      .then(() => data)
  }

  return data
}

function deleteLists(data) {
  const { list_ids } = data
  const query = { _id: { $in: list_ids }}
  return List.deleteMany(query)
    .then(result => console.log("Lists deleted:", result))
    .then(() => data.user_ids)
}

function deleteUser(user_ids) {
  const query = { _id: { $in: user_ids }}
  return User.deleteMany(query)
    .then(result => console.log("Users deleted:", result))
    .then(() => user_ids)
}

function finish(user_ids) {
  console.log("Deleted all records for users data", JSON.stringify(user_ids, null, '  '));
  process.exit()
}