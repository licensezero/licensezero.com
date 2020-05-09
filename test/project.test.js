var LICENSOR = require('./licensor')
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
var writeTestLicensor = require('./write-test-licensor')

tape('offer', function (test) {
  server(function (port, close) {
    var projectID
    runSeries([
      writeTestLicensor.bind(null),
      function offer (done) {
        apiRequest(port, Object.assign(clone(OFFER), {
          licensorID: LICENSOR.id,
          token: LICENSOR.token
        }), function (error, response) {
          if (error) return done(error)
          test.equal(response.error, false, 'error false')
          projectID = response.projectID
          done()
        })
      },
      function requestProject (done) {
        apiRequest(port, {
          action: 'project',
          projectID
        }, function (error, response) {
          if (error) return done(error)
          test.assert(
            !has(response, 'stripe'),
            'no Stripe data'
          )
          test.deepEqual(
            response, {
              projectID,
              homepage: OFFER.homepage,
              pricing: OFFER.pricing,
              licensor: {
                licensorID: LICENSOR.id,
                name: LICENSOR.name,
                jurisdiction: LICENSOR.jurisdiction,
                publicKey: LICENSOR.publicKey
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
      action: 'project',
      projectID: uuid()
    }, function (error, response) {
      if (error) {
        test.ifError(error)
      } else {
        test.equal(response.error, 'no such project')
      }
      test.end()
      close()
    })
  })
})

tape('/offers/{id}', function (test) {
  server(function (port, close) {
    var projectID
    runSeries([
      writeTestLicensor.bind(null),
      function offer (done) {
        apiRequest(port, Object.assign(clone(OFFER), {
          licensorID: LICENSOR.id,
          token: LICENSOR.token
        }), function (error, response) {
          if (error) return done(error)
          test.equal(response.error, false, 'error false')
          projectID = response.projectID
          done()
        })
      },
      function browse (done) {
        var browser
        require('./webdriver')()
          .then((loaded) => { browser = loaded })
          .then(() => browser.url('http://localhost:' + port + '/offers/' + projectID))
          .then(() => browser.$('.projectID'))
          .then((element) => element.getText())
          .then(function (text) {
            test.equal(
              text, projectID,
              'project ID'
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
    var projectID
    runSeries([
      writeTestLicensor.bind(null),
      function offer (done) {
        apiRequest(port, Object.assign(clone(OFFER), {
          licensorID: LICENSOR.id,
          token: LICENSOR.token
        }), function (error, response) {
          if (error) return done(error)
          test.equal(response.error, false, 'error false')
          projectID = response.projectID
          done()
        })
      },
      function browse (done) {
        http.request({
          port,
          path: 'http://localhost:' + port + '/offers/' + projectID + '/badge.svg'
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

tape('/ids/{projectID}', function (test) {
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

tape('/ids/{projectID}/badge.svg', function (test) {
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

tape('/projects/{projectID}', function (test) {
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

tape('/projects/{projectID}/badge.svg', function (test) {
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
