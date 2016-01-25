/*
 *  Generic require login routing middleware
 */

exports.requiresLogin = function (req, res, next) {
  console.log("Cookies: ", req.cookies)
  if (req.cookies.apikey != null && req.cookies.apikey != '') return next()
  res.redirect('/login')
}
