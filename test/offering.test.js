var developer = require('./developer')
var OFFER = require('./offer')
var apiRequest = require('./api-request')
var clone = require('../data/clone')
var has = require('has')
var http = require('http')
var runSeries = require('run-series')
var server = require('./server')
var simpleConcat = require('simple-concat')
var tape = require('tape')
var uuid = require('uuid').v4
var writeTestDeveloper = require('./write-test-developer')

tape('offering', function (test) {
  server(function (port, close) {
    var offerID
    runSeries([
      writeTestDeveloper.bind(null),
      function offer (done) {
        apiRequest(port, Object.assign(clone(OFFER), {
          developerID: developer.id,
          token: developer.token
        }), function (error, response) {
          if (error) return done(error)
          test.equal(response.error, false, 'error false')
          offerID = response.offerID
          done()
        })
      },
      function requestOffer (done) {
        apiRequest(port, {
          action: 'offering',
          offerID
        }, function (error, response) {
          if (error) return done(error)
          test.assert(
            !has(response, 'stripe'),
            'no Stripe data'
          )
          test.deepEqual(
            response, {
              offerID,
              homepage: OFFER.homepage,
              pricing: OFFER.pricing,
              developer: {
                developerID: developer.id,
                name: developer.name,
                jurisdiction: developer.jurisdiction
              },
              description: OFFER.description,
              commission: parseInt(process.env.COMMISSION),
              error: false
            },
            'response'
          )
          done()
        })
      }
    ], function (error) {
      test.ifError(error, 'no error')
      test.end()
      close()
    })
  })
})

tape('nonexistent offer', function (test) {
  server(function (port, close) {
    apiRequest(port, {
      action: 'offering',
      offerID: uuid()
    }, function (error, response) {
      if (error) {
        test.ifError(error)
      } else {
        test.equal(response.error, 'no such offer')
      }
      test.end()
      close()
    })
  })
})

tape('/offers/{id}', function (test) {
  server(function (port, close) {
    var offerID
    runSeries([
      writeTestDeveloper.bind(null),
      function offer (done) {
        apiRequest(port, Object.assign(clone(OFFER), {
          developerID: developer.id,
          token: developer.token
        }), function (error, response) {
          if (error) return done(error)
          test.equal(response.error, false, 'error false')
          offerID = response.offerID
          done()
        })
      },
      function browse (done) {
        var browser
        require('./webdriver')()
          .then((loaded) => { browser = loaded })
          .then(() => browser.url('http://localhost:' + port + '/offers/' + offerID))
          .then(() => browser.$('.offerID'))
          .then((element) => element.getText())
          .then(function (text) {
            test.equal(
              text, offerID,
              'offer ID'
            )
            browser.deleteSession()
            done()
          })
          .catch(function (error) {
            browser.deleteSession()
            done(error)
          })
      }
    ], function (error) {
      test.ifError(error, 'no error')
      test.end()
      close()
    })
  })
})

tape('/offers/{id}/badge.svg', function (test) {
  server(function (port, close) {
    var offerID
    runSeries([
      writeTestDeveloper.bind(null),
      function offer (done) {
        apiRequest(port, Object.assign(clone(OFFER), {
          developerID: developer.id,
          token: developer.token
        }), function (error, response) {
          if (error) return done(error)
          test.equal(response.error, false, 'error false')
          offerID = response.offerID
          done()
        })
      },
      function browse (done) {
        http.request({
          port,
          path: 'http://localhost:' + port + '/offers/' + offerID + '/badge.svg'
        })
          .once('error', function (error) {
            done(error)
          })
          .once('response', function (response) {
            test.equal(response.statusCode, 200, '200')
            simpleConcat(response, function (error, body) {
              test.ifError(error, 'no body error')
              test.equal(
                response.headers['content-type'],
                'image/svg+xml',
                'SVG'
              )
              done()
            })
          })
          .end()
      }
    ], function (error) {
      test.ifError(error, 'no error')
      test.end()
      close()
    })
  })
})

tape('/ids/{offerID}', function (test) {
  server(function (port, close) {
    var id = uuid()
    http.request({
      port,
      path: 'http://localhost:' + port + '/ids/' + id
    })
      .once('response', function (response) {
        test.equal(response.statusCode, 301, '301')
        test.equal(response.headers.location, '/offers/' + id, 'Location')
        close()
        test.end()
      })
      .end()
  })
})

tape('/ids/{offerID}/badge.svg', function (test) {
  server(function (port, close) {
    var id = uuid()
    http.request({
      port,
      path: 'http://localhost:' + port + '/ids/' + id + '/badge.svg'
    })
      .once('response', function (response) {
        test.equal(response.statusCode, 301, '301')
        test.equal(
          response.headers.location,
          '/offers/' + id + '/badge.svg',
          'Location'
        )
        close()
        test.end()
      })
      .end()
  })
})

tape('/projects/{offerID}', function (test) {
  server(function (port, close) {
    var id = uuid()
    http.request({
      port,
      path: 'http://localhost:' + port + '/projects/' + id
    })
      .once('response', function (response) {
        test.equal(response.statusCode, 301, '301')
        test.equal(response.headers.location, '/offers/' + id, 'Location')
        close()
        test.end()
      })
      .end()
  })
})

tape('/projects/{offerID}/badge.svg', function (test) {
  server(function (port, close) {
    var id = uuid()
    http.request({
      port,
      path: 'http://localhost:' + port + '/projects/' + id + '/badge.svg'
    })
      .once('response', function (response) {
        test.equal(response.statusCode, 301, '301')
        test.equal(
          response.headers.location,
          '/offers/' + id + '/badge.svg',
          'Location'
        )
        close()
        test.end()
      })
      .end()
  })
})
