/**
 * backend/controllers/savePhrase.js
 *
 * Reads phrase to be updated/added from req.body
 * Creates a new Phrase record in the given list, if _id is a
 * number not a string id. Otherwise updates the current Phrase
 * record.
 * 
 * Responds with { _id, text, hint, old_id }, where `old_id` may
 * be the number used as the key for a new phrase, and _id is
 * always the _id of the Phrase record that was updated or created.
 */


const { mongoose, Phrase } = require('../database')


function savePhrase(req, res) {
  // The list_id will be linked to a given user, and _id (if it
  // is not a number, will already be linked to that list.)
  const { list_id, _id, text, hint } = req.body


  let status = 0
  let message = {}


  // New phrase to add
  if (_id === Number(_id)) {
    return addPhrase({list_id, _id, text, hint })
      .then(treatSuccess)
      .catch(treatError)
      .finally(proceed)
  }

  function addPhrase({ list_id, _id: old_id, text, hint }) {
    const created = new Date()
    // Convert string list_id to Object.Id
    list_id = new mongoose.Types.ObjectId(list_id)
    const lists = [ list_id ]

    return new Promise(( resolve, reject ) => {
      new Phrase({ text, hint, created, lists })
        .save()
        .then(treatSuccess)
        .catch(reject)
          
      function treatSuccess(phrase) {
        const { _id, text, hint } = phrase
        resolve({ old_id, _id, text, hint })
      }
    })
  }


  // Update existing phrase
  Phrase.findByIdAndUpdate(
    _id,
    { $set: { text, hint } },
    { new: true } // returns the updated document
  )
    .then(treatSuccess)
    .catch(treatError)
    .finally(proceed)



  // Handle response
  function treatSuccess(phrase) {
    const { _id, text, hint, old_id } = phrase
    Object.assign(message, { _id, text, hint, old_id } )
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