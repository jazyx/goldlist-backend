/**
 * backend/controllers/combineLists.js
 *
 * Find all lists for the given user where `remain` < 8. If the
 * total number of phrases in these lists is > 14:
 * 1. Decrement the value of User.knots
 * 2. Create a new list with an index of User.knots (decremented)
 * 3. Add the _id of this new list to the `lists` field of each
 *    of the unretained phrases
 * 4. Set `remain` for the original parent list to 0
 */


const { mongoose, User, List, Phrase } = require('../database')


function combineLists(user_id) {
  console.log("combineLists user_id:", user_id, typeof user_id)
  const query = {
    user_id,
    remain: { $gt: 0, $lt: 8 }
  }
  // const selection = [ _id ]

  return List.find(query)
    .then(checkKnottyPhrases)
    .then(treatSuccess)
    .catch(treatError)


  function checkKnottyPhrases(lists) {
    console.log(
      "findPhrases lists",
      JSON.stringify(lists, null, '  ')
    );

    const list_ids = lists.map( list => list._id )
    const query = {
      lists: { $in: list_ids },
      retained: { $eq: null }
    }

    console.log("list_ids", JSON.stringify(list_ids, null, '  '));
    
    console.log(
      "findPhrases query:",
      JSON.stringify(query, null, '  ')
    )

    return Phrase.find(query)
      .then(phrases => {
        console.log(
          "KNOTTY phrases",
          JSON.stringify(phrases.map( phrase => phrase.text ))
        );
        
        return phrases
      })
      .then(phrases => countPhrases({ lists, phrases }))
      .catch(error => Promise.reject(error))
  }


  function countPhrases({ lists, phrases }) {
    const remain = phrases.length

    console.log(
      "countPhrases remain:", remain, 
      ", phrases:", JSON.stringify(phrases, null, '  ')
    )

    if ( remain > 14 ) {
      return getUserKnots({ lists, phrases})
    } else {
      return Promise.reject(
        `Only ${remain} knotty phrase${remain === 1 ? "" : "s"}`
      )
    }
  }


  function getUserKnots({ lists, phrases}) {
    const $inc = { knots: -1 }

    return User.findByIdAndUpdate(
      user_id,
      { $inc },
      { new: true }
    )
      .then(user => createNewList({ user, lists, phrases }))
      .catch(error => Promise.reject(error))
  }


  function createNewList({ user, lists, phrases }) {
    const { knots } = user

    console.log("createNewList knots:", knots)

    const data = {
      user_id,
      index: knots,
      remain: phrases.length
    }

    return new List(data)
      .save()
      .then(list => setRemainToZero({ lists, phrases, list }))
      .then(addListIdToPhrases)
      .catch(error => Promise.reject(error))
  }


  function  setRemainToZero({ lists, phrases, list }) {
    const promises = lists.map( list => {
      return new Promise(( resolve, reject ) => {
        list.remain = 0
        list.save()
          .then(resolve)
          .catch(reject)
      })
    })

    return Promise.all(promises)
      .then(lists => console.log(
        "ZEROED lists",
        JSON.stringify(lists.map( list => ({
          _id: list._id,
          remain: list.remain,
          created: list.created
        })), null, '  '))
       )
      .then(() => Promise.resolve({ phrases, list }))
      .catch(error => Promise.reject(error))
  }


  function addListIdToPhrases({ phrases, list }) {
    const { _id: list_id } = list

    console.log("addListIdToPhrases list_id:", JSON.stringify(list_id, null, '  '))
    console.log("phrases:", phrases.length)

    const promises = phrases.map( phrase => {
      return new Promise(( resolve, reject ) => {
        const { _id } = phrase

        Phrase.findByIdAndUpdate(
          _id,
          { $push: { lists: list_id } },
          { new: true }
        )
          .then(resolve)
          .catch(reject)
      })
    })

    return Promise.all(promises)
      .then(phrases => console.log(
        "UPDATED phrases",
        JSON.stringify( phrases.map(phrase => ({
          text: phrase.text,
          lists: phrase.lists,
        })), null, '  '))
      )
      .then(() => Promise.resolve({ phrases, list }))
      .catch(error => Promise.reject(error))
  }


  // Handle response
  function treatSuccess(result) {
    const swap = (key, value) => {
      if (key === "phrases") {
        return value.map(phrase => phrase.text)
      }
      return value
    }

    console.log("******************************")
    console.log("result", JSON.stringify(result, swap, '  '));
    console.log("******************************")

    return Promise.resolve(result.list)
  }


  function treatError(error) {
    console.log("Status for combineLists:\n", error);
    return Promise.reject()
  }
}


module.exports = {
  combineLists
}