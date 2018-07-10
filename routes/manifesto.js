var BLOG_POST = 'https://blog.licensezero.com/2017/09/12/manifesto.html'

module.exports = function (request, response) {
  response.statusCode = 301
  response.setHeader('Location', BLOG_POST)
  response.end()
}
