/**
 * backend/controllers/savePhrase.js
 *
 * Reads phrase to be updated/added from req.body
 * Creates a new Phrase record in the given list, if _id is a
 * number not a string id. Otherwise updates the current Phrase
 * record.
 *
 * Responds with { _id, text, hint, key, length }, where
 * + _id is always the _id of the Phrase record that was updated *   or created.
 * + `key` may be the number used as the key for a new phrase
 * + length may be undefined, or the number of items in the List
 *
 * If a new Phrase is created for a given List, then the length
 * of the list will be incremented by 1.
 */


const { mongoose, Phrase } = require('../database')


function savePhrase(req, res) {
  // The list_id will be linked to a given user, and _id (if it
  // is not a number, will already be linked to that list.)
  const { list_id, _id, text, hint } = req.body


  let status = 0
  let message = {}


  // New phrase to add. Use the integer _id as the key.
  if (_id === Number(_id)) {
    return addPhrase({list_id, key: _id, text, hint })
      .then(treatSuccess)
      .catch(treatError)
      .finally(proceed)
  }

  function addPhrase({ list_id, key, text, hint }) {
    const created = new Date()
    // Convert string list_id to Object.Id
    list_id = new mongoose.Types.ObjectId(list_id)
    const lists = [ list_id ]

    return new Promise(( resolve, reject ) => {
      // Check if a phrase with this key already exists in
      // this list
      const query = {
        lists: { $elemMatch: { $eq: list_id } },
        key
      }
      Phrase.findOne(query)
        .then(checkPhrase)
        .catch(reject)

      function checkPhrase(phrase) {
        if (phrase) {
          // Pretend this existing phrase was just created
          treatPhrase(phrase)

        } else {
          // Create a new phrase with the given key
          new Phrase({ key, text, hint, created, lists })
            .save()
            .then(treatPhrase)
            // .then(recountPhrases)
            .catch(reject)
        }

        function treatPhrase(phrase) {
          // Filter out fields that are not necessary
          const { _id, key, text, hint } = phrase
          const data = { list_id, key, _id, text, hint }

          return resolve(data)
        }
      }
    })
  }


  // Update existing phrase
  Phrase.findByIdAndUpdate(
    _id,
    { $set: { text, hint } },
    { new: true } // returns the updated document
  )
    .then(treatUpdate)
    .then(treatSuccess)
    .catch(treatError)
    .finally(proceed)


  function treatUpdate(phrase) {
    const { _id, key, text, hint } = phrase
    const data = { list_id, _id, key, text, hint }

    // If phrase has no text tell frontend to decrement List.length
    if (!text) {
      data.length = -1
    }

    return Promise.resolve(data)
  }


  // Handle response
  function treatSuccess(phrase) {
    Object.assign(message, phrase )
  }


  function treatError(error) {
    console.log("Error in savePhrase:\n", req.body, error);
    status = 500 // Server error
    message.fail = error
  }


  function proceed() {
    if (status) {
      res.status(status)
    }

    res.json(message)
  }
}


module.exports = {
  savePhrase
}