/**
 * server/database/index.js
 */


const MONGO_DB = process.env.MONGO_DB

const mongoose = require("mongoose");
const {
  User,
  Phrases
} = require("./models")

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


const db = {
  mongoose,
  User,
  Phrases
}


module.exports = db