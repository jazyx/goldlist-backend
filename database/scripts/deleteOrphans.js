/**
 * backend/database/scripts/deleteOrphans.js
 * 
 * This script stops running after one second. If there are
 * many orphaned lists and phrases, then it may not have time
 * to delete them all, and should be run again, just to check.
 */


MONGO_DB = "mongodb://localhost:27017/goldlist" // in .env
const mongoose = require("mongoose");
const {
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



const listOrphanPromise = (() => {
  return List.aggregate([
    {
      $lookup: {
        from: 'users', // collection name not model name
        localField: 'user_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $match: { user: { $size: 0 } }
    },
    {
      $group: {
        _id: '$user_id' // to get distinct values
      }
    }
  ])
})()


listOrphanPromise
  // .then(result => {
  //   result = result.map( item => item._id )
  //   console.log("missing user_ids:", result)
  //   return result
  // })
  .then(deleteOrphanLists)


function deleteOrphanLists(user_ids) {
  const query = { user_id: { $in: user_ids }}
  List.deleteMany(query)
    .then(result => {
      console.log("deleted lists:", result)
    })
}



const phraseOrphanPromise = (() => {
  return Phrase.aggregate([
    { $unwind: "$lists" },
    {
      $lookup: {
        from: 'lists', // collection name not model name
        localField: 'lists',
        foreignField: '_id',
        as: 'list'
      }
    },
    {
      $match: { list: { $size: 0 } }
    },
    {
      $group: {
        _id: '$lists' // to get distinct values
      }
    }
  ])
})()


phraseOrphanPromise
  // .then(result => {
  //   result = result.map( item => item._id )
  //   // console.log("missing list_ids:", result)
  //   return result
  // })
    .then(deleteOrphanPhrases)
    .then(delayedFinish)


function deleteOrphanPhrases(list_ids) {
  const query = { lists: { $in: list_ids }}
  return Phrase.deleteMany(query)
    .then(result => {
      console.log("deleted phrases:", result)
      return result
    })
    .catch(error => console.log("error:", error))
}



function delayedFinish() {
  setTimeout(() =>  process.exit(), 1000)
}