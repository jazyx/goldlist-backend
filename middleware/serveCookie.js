/**
 * backend/middleware/serveCookie.js
 * 
 * In production, create a cookie to confirm that the user first
 * visited the root of the site. This prevents requests being made
 * directly to an API endpoint from any site other than the
 * official one.
 * 
 * During development, this cookie may not exist, and all API
 * requests will be respected anyway.
 */




const { getToken } = require('./jwToken')


const serveCookie = (req, res, next) => {
  const { path } = req
  
  if ( path === "/" || path === "index.html" ) {
    // The request is for the static index.html page at the origin
    const host = req.headers.host // includes the port
    const regex = `^https?:\/\/${host}/`
    
    // Create a token to record the origin that was requested...
    const pass = getToken(regex)

    // console.log("pass:", pass) // will be something like...
    // eyJhbGciOiJIUzI1NiJ9.Xmh0dHBzPzovL2xvY2FsaG9zdDozMDAwLw.JxY0tdcIptUaU_wr2DoaFwIFU5j0EXByJAzBF5IyNvA
    // ...which decodes as:
    // ^https?://localhost:3000/

    // ... and serve it as session cookie.
    req.session.pass = pass

    // All API requests need a token with this origin as referer
  }

  next()
}


module.exports = serveCookie