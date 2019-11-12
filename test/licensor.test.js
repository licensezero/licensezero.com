var LICENSOR = require('./licensor')
var OFFER = require('./offer')
var apiRequest = require('./api-request')
var clone = require('../data/clone')
var runSeries = require('run-series')
var server = require('./server')
var tape = require('tape')
var writeTestLicensor = require('./write-test-licensor')

tape('licensor', function (test) {
  server(function (port, close) {
    writeTestLicensor(function (error) {
      test.error(error)
      apiRequest(port, {
        action: 'licensor',
        licensorID: LICENSOR.id
      }, function (error, response) {
        if (error) {
          test.error(error)
        } else {
          test.equal(
            response.error, false,
            'error false'
          )
          test.equal(
            response.name, LICENSOR.name,
            'name'
          )
          test.equal(
            response.jurisdiction, LICENSOR.jurisdiction,
            'jurisdiction'
          )
          test.assert(
            /^[0-9a-f]{64}$/.test(response.publicKey),
            'publicKey'
          )
          test.deepEqual(
            response.projects, [],
            'projects'
          )
        }
        test.end()
        close()
      })
    })
  })
})

tape('licensor w/ invalid id', function (test) {
  server(function (port, close) {
    apiRequest(port, {
      action: 'licensor',
      licensorID: LICENSOR.id
    }, function (error, response) {
      if (error) {
        test.error(error)
      } else {
        test.equal(
          response.error, 'no such licensor',
          'no such licensor'
        )
      }
      test.end()
      close()
    })
  })
})

tape('licensor w/ project', function (test) {
  server(function (port, close) {
    var offerID
    runSeries([
      writeTestLicensor.bind(null),
      function offerProject (done) {
        apiRequest(port, Object.assign(clone(OFFER), {
          licensorID: LICENSOR.id,
          token: LICENSOR.token
        }), function (error, response) {
          if (error) return done(error)
          offerID = response.offerID
          done()
        })
      },
      function (done) {
        apiRequest(port, {
          action: 'licensor',
          licensorID: LICENSOR.id
        }, function (error, response) {
          if (error) return done(error)
          test.equal(
            response.projects.length, 1,
            'one project'
          )
          test.equal(
            response.projects[0].offerID, offerID,
            'offered project'
          )
          done()
        })
      }
    ], function (error) {
      test.error(error, 'no error')
      test.end()
      close()
    })
  })
})

tape('licensor w/ retracted project', function (test) {
  server(function (port, close) {
    var offerID
    runSeries([
      writeTestLicensor.bind(null),
      function offerProject (done) {
        apiRequest(port, Object.assign(clone(OFFER), {
          licensorID: LICENSOR.id,
          token: LICENSOR.token
        }), function (error, response) {
          if (error) return done(error)
          offerID = response.offerID
          done()
        })
      },
      function retractProject (done) {
        apiRequest(port, {
          action: 'retract',
          licensorID: LICENSOR.id,
          token: LICENSOR.token,
          offerID
        }, function (error, response) {
          if (error) return done(error)
          test.equal(response.error, false, 'false error')
          done()
        })
      },
      function listLicensorProjects (done) {
        apiRequest(port, {
          action: 'licensor',
          licensorID: LICENSOR.id
        }, function (error, response) {
          if (error) return done(error)
          test.equal(
            response.projects.length, 1,
            'one project listed'
          )
          test.notEqual(
            response.projects[0].retracted, null,
            'project retracted'
          )
          done()
        })
      }
    ], function (error) {
      test.error(error, 'no error')
      test.end()
      close()
    })
  })
})

tape('licensor w/ retracted project', function (test) {
  server(function (port, close) {
    var firstProject
    var secondProject
    runSeries([
      writeTestLicensor.bind(null),
      function offerFirstProject (done) {
        apiRequest(port, Object.assign(clone(OFFER), {
          licensorID: LICENSOR.id,
          token: LICENSOR.token,
          homepage: 'http://example.com/first'
        }), function (error, response) {
          if (error) return done(error)
          test.equal(response.error, false, 'false error')
          firstProject = response.offerID
          done()
        })
      },
      function offerSecondProject (done) {
        apiRequest(port, Object.assign(clone(OFFER), {
          licensorID: LICENSOR.id,
          token: LICENSOR.token,
          homepage: 'http://example.com/second'
        }), function (error, response) {
          if (error) return done(error)
          test.equal(response.error, false, 'false error')
          secondProject = response.offerID
          done()
        })
      },
      function retractFirstProject (done) {
        apiRequest(port, {
          action: 'retract',
          licensorID: LICENSOR.id,
          token: LICENSOR.token,
          offerID: firstProject
        }, function (error, response) {
          if (error) return done(error)
          test.equal(response.error, false, 'false error')
          done()
        })
      },
      function listLicensorProjects (done) {
        apiRequest(port, {
          action: 'licensor',
          licensorID: LICENSOR.id
        }, function (error, response) {
          if (error) return done(error)
          var projects = response.projects
          test.equal(
            projects.length, 2,
            'two projects'
          )
          test.notEqual(
            projects
              .find(function (element) {
                return element.offerID === firstProject
              })
              .retracted,
            null,
            'first project retracted'
          )
          test.equal(
            projects
              .find(function (element) {
                return element.offerID === secondProject
              })
              .retracted,
            null,
            'second project not retracted'
          )
          done()
        })
      }
    ], function (error) {
      test.error(error, 'no error')
      test.end()
      close()
    })
  })
})
