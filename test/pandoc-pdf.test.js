var tape = require('tape')
var pandocPDF = require('../util/pandoc-pdf')

tape('pandoc', function (test) {
  pandocPDF('This is a test.', function (error, buffer) {
    test.ifError(error)
    test.assert(Buffer.isBuffer(buffer), 'buffer')
    test.assert(buffer.byteLength > 0, 'length > 0')
    test.end()
  })
})
