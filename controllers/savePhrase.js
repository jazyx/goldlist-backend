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


const { mongoose, Phrase, List } = require('../database')


function saveOrAddPhrase(req, res) {
  // The list_id will be linked to a given user, and _id (if it
  // is not a number,) will already be linked to that list.
  const { list_id: listID, _id, text, hint } = req.body
  // Convert string list_id to ObjectId
  const list_id = new mongoose.Types.ObjectId(listID)


  const phrasePromise = (_id === Number(_id))
    ? addPhrase()
    : updateExistingPhrase()


  return phrasePromise
    .then(checkCreationDate)


  function addPhrase() {
    const lists = [ list_id ]
    const created = new Date()
    // Use the integer _id as the key. A new _id will be used.
    const data = { key: _id, text, hint, lists, created }

    return new Phrase(data)
      .save()
      .then(filterFields)
      .catch(treatError)
  }


  function updateExistingPhrase() {
    const $set = { text, hint }

    return Phrase.findByIdAndUpdate(
      _id,
      { $set },
      { new: true } // returns the updated document
    )
      .then(filterFields)
      .catch(treatError)
  }


  function filterFields(phrase) {
    const { _id, key, text, hint } = phrase
    const data = { list_id, _id, key, text, hint }

    return Promise.resolve(data)
  }


  ////////////////////// COMPLETING A LIST //////////////////////


  // Counts non-empty phrases in the list, and resets the
  // creation date if there are now 21
  function checkCreationDate(phrase) {
    const query = {
      lists: { $elemMatch: { $eq: list_id } },
      text: { $ne: "" }
    }

    Phrase.countDocuments(query)
      .then(resetCreationDateIfNeeded) // output ignored
      .catch(treatError)

    // Always resolve with updated phrase, even if there
    // is a counting error
    return Promise.resolve(phrase)


    function resetCreationDateIfNeeded(count) {
      if (count < 21) {
        return Promise.resolve() // nothing to do
      }

      const $set = { created: new Date() }
      return List.findByIdAndUpdate(
        list_id,
        { $set },
        { new: true }
      )
        .then(() => Promise.resolve()) // just resolve
        .catch(treatError)
    }
  }


  function treatError(reason) {
    const error = {
      reason,
      input: { list_id, _id, text, hint },
      status: 400 // Bad Request
    }

    console.log(
      "Error in savePhrase:\n",
      JSON.stringify(error, null, '  ')
    );

    return Promise.resolve(error)
  }
}


module.exports = {
  saveOrAddPhrase
}