/**
 * backend/controllers/setPreferences.js
 *
 * 1. Creates a new list with the given user_id
 * 2. Sets the value of User.lists to the index of the new list
 * 3. Responds with details of the new List record
 */


const { mongoose, User, List, Phrase } = require('../database')
const { addNewList } = require('./addList')


function savePreferences(req, res) {
  const { _id: user_id , preferences = {} } = req.body
  const _id = new mongoose.Types.ObjectId(user_id)

  return User.findByIdAndUpdate(
    _id,
    { $set: preferences },
    { new: true }
  )
    .then(confirmPreferences)
    .then(checkForChangedPhraseCount)
    .catch(treatError)


  function confirmPreferences(user) {
    if (!user) {
      return treatError()
    }

    const data = {
      _id: user._id,
      phraseCount: user.phraseCount,
      lists: user.lists,
      preferences
    }

    return Promise.resolve(data)
  }


  /**
   * Update List record if preferences.phraseCount has changed
   */
  function checkForChangedPhraseCount(data) {
    // data = { 
    //   _id, 
    //   lists, 
    //   phraseCount, // current value for User
    //   preferences: {key: value, ...} // may contain phraseCount
    // }
    const { phraseCount } = data.preferences
    if (!phraseCount) {
      // if undefined: phraseCount has not changed, no action
      return Promise.resolve(data)

    } else {
      // Update current list and add lists [] to data before
      // returning data
      return treatIncompleteList(data)      
    }
  }


  function treatIncompleteList(data) {
    // data = {
    //   _id: (User),
    //   lists: 5,
    //   preferences: { phraseCount: 15 }
    // }

    // Get list `index` for this user: _id, total (, remain)
    const { _id: user_id, lists: index, preferences } = data
    const query = { user_id, index }

    return List.findOne(query)
      .then(list => countNonEmptyPhrases(
        { ...query, list, preferences })
      )
      // Set list.total and .remain to max(count, phraseCount)
      .then(updateTotalAndRemain)
      .catch(treatError)
  }
    


  function countNonEmptyPhrases(data) {
    // data = {
    //   "user_id": "68a001b34044bf6788545fc4",
    //   "index": 5,
    //   "list" (model): {
    //     "_id": "68a001b34044bf6788545fcb",
    //     "user_id": "68a001b34044bf6788545fc4",
    //     "index": 5,
    //     "created": "2025-08-16T03:57:39.860Z",
    //     "reviews": 1,
    //     "total": 21,
    //     "remain": 21,
    //     "__v": 0
    //   },
    //   preferences: { phraseCount: 15}
    // }

    const { user_id, index, list } = data
    const { _id: list_id } = (list || {})

    const query = { 
      lists: { $elemMatch: { $eq: list_id }},
      text: { $ne: "" }
    }

    return Phrase.countDocuments( query )
      .then(count => ({ count, ...data }))
      .catch(treatError)
  }
    


  function updateTotalAndRemain(data) {
    // data = {
    //   "count": 20,
    //   "user_id": "68a001b34044bf6788545fc4",
    //   "index": 5,
    //   "list" (model): {
    //     "_id": "68a001b34044bf6788545fcb",
    //     "user_id": "68a001b34044bf6788545fc4",
    //     "index": 5,
    //     "created": "2025-08-16T03:57:39.860Z",
    //     "reviews": 1,
    //     "total": 21,
    //     "remain": 21,
    //     "__v": 0
    //   },
    //   preferences: { phraseCount: 15 }
    // }
    const { count, user_id, list, preferences } = data
    const { _id: list_id, total } = list
    const { phraseCount } = preferences

    // Increase or decrease total and remain in current list
    const newTotal = Math.max(phraseCount, count)
    list.total = newTotal
    list.remain = newTotal
    list.save()

    // Add data about the modified list to the response
    const {
      index,
      created,
      // total, // already known from newTotal
      remain
    } = list
    data.lists = [{
      _id: list_id,
      index,
      created,
      total: newTotal,
      remain
    }]
    // Replace user_id with the user _id
    data._id = user_id

    // Not wanted on voyage
    delete data.user_id
    delete data.list
    delete data.count

    // {
    //   "_id": "68a0040d6bafea8edb84d561", // user
    //   "index": 5,
    //   "lists": [
    //     {
    //       "_id": "68a0040d6bafea8edb84d568",
    //       "index": 5,
    //       "created": "2025-08-16T04:07:41.489Z",
    //       "total": 20,
    //       "remain": 20
    //     },
    //     preferences: { phraseCount: 15 }
    //   ]
    // }

    if (total > phraseCount) {
      // The number of phrases per list is to be reduced
      if (count < phraseCount) {
        // It's enough to simply reduce total and remain.
        // No new list is needed
        return Promise.resolve(data)

      } else {
        // Complete the current list by creating a new one
        return startNewList()
      }
    } else {
      // The number of phrases per list is to be increased
      // It's enough to simply reduce total and remain.
      return Promise.resolve(data)
    }


    function startNewList() {
      // Updates data. addNewList receives {
      //   _id,               \\ used by addList
      //   index, // current  //
      //   lists // details of modified list
      //   preferences: { phraseCount: 15 }
      // }
      // and resolves with {
      //   _id,   // new list _id
      //   index, // will have been incremented for user(_id)
      //   created,
      //   total,
      //   remain,
      //   length,
      //   phrases
      // }
      data.index += 1 // index for the list that will be created
      const req = { body: data }
      return addNewList(req)
        .then(wrapUpNewList)
        .catch(treatError)
    }

    function wrapUpNewList(listData) {
      data.lists.unshift(listData)
      return data
    }    
  }
  


  function treatError(info) {
    const error = {
      reason: `Preferences for user ${_id} not updated`,
      fail: true,
      info,
      preferences,
      status: 422 // Unprocessable Content
    }

    return Promise.resolve(error)
  }
}


module.exports = {
  savePreferences
}