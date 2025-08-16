/**
 * backend/controllers/formatUserData.js
 * 
 * formatUserData is called by initializeUserData()
 */


const { DAYS, DELAY } = require('../constants')


function formatUserData({ user, redos }) {
  // Get highest index in redos
  const max = redos.reduce(( max, redo ) => {
    if (redo.index > max) {
      max = redo.index
    }
    return max
  }, 0)

  // Update user.lists to max
  user.lists = max
  const result = user.save()
    .then(separateListsFromRedos)
    .catch(treatError)
  
  return result // should be a Promise


  function separateListsFromRedos(user) {
    // Move "redo" with highest index to lists
    const activeIndex = redos.findIndex( list => (
      list.index === max
    ))

    const active = redos.splice(activeIndex, 1)
    // The first list and only list in lists should have only
    // 1 non-empty phrase, so set its `reviews` to 0, if this
    // is in fact the case. This will tell the front end to treat
    // this list as an Add item.
    const hasEmpty = active.map( list => {
      return list.phrases.reduce(
        ( sum, phrase ) => sum + !phrase.text,
        0
      )
    })
    const todoIndex = hasEmpty.findIndex( empty => empty )
    if (todoIndex > -1) {
      active[todoIndex].reviews = 0
    }

    // Ignore user_id, last_access, knots and administrivia
    const {
      _id,
      user_name,
      email,
      start_date,
      lists,
      limitState,
      daysDelay,
      phraseCount
    } = user

    // Filter redos where .created is less than .reviews days ago
    // and .remain is greater than .total / 3
    const now = new Date().getTime()
    redos = redos.filter(({ created, reviews, name, remain, total }) => (
        (now - created.getTime()) > (reviews * DAYS * DELAY )
      && (remain > total / 3)
    ))

    const data = {
      user: {
        _id,
        user_name,
        email,
        start_date,
        lists,
        limitState,
        daysDelay,
        phraseCount
      },
      lists: active,
      redos
    }
  
    // const swap = (key, value) => {
    //   if (key === "phrases") {
    //     const texts = value.map( phrase => phrase.text )
    //     const trimTo = 3
    //     const more = texts.length - trimTo
    //     texts.length = trimTo
    //     const summary = texts.join(", ")
    //       + `... and ${more} more`
    //     return summary
    //   }
    //   return value
    // }

    // console.log(
    //   "Newly-registered user data:",
    //   JSON.stringify(data, swap, '  ')
    // )

    const result = Promise.resolve(data)
    return result // should be a Promise
  }


  function treatError(error) { 
    const errorData = {
      reason: error,
      status: 405 // Method Not Allowed
    }

    console.log("FORMULATE_USER_DATA error", JSON.stringify(errorData, null, '  '))

    return Promise.resolve(errorData)
  }
}


module.exports = {
  formatUserData
}