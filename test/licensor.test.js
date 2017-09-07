var LICENSOR = require('./licensor')
var OFFER = require('./offer')
var apiRequest = require('./api-request')
var clone = require('../data/clone')
var runSeries = require('run-series')
var server = require('./server')
var tape = require('tape')
var writeTestLicensor = require('./write-test-licensor')

tape('licensor', function (test) {
  server(function (port, service, close) {
    writeTestLicensor(service, function (error) {
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
  server(function (port, service, close) {
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
  server(function (port, service, close) {
    var project
    runSeries([
      writeTestLicensor.bind(null, service),
      function offerProject (done) {
        apiRequest(port, Object.assign(clone(OFFER), {
          licensorID: LICENSOR.id,
          password: LICENSOR.password
        }), function (error, response) {
          if (error) return done(error)
          project = response.project
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
            response.projects[0].project, project,
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
  server(function (port, service, close) {
    var project
    runSeries([
      writeTestLicensor.bind(null, service),
      function offerProject (done) {
        apiRequest(port, Object.assign(clone(OFFER), {
          licensorID: LICENSOR.id,
          password: LICENSOR.password
        }), function (error, response) {
          if (error) return done(error)
          project = response.project
          done()
        })
      },
      function retractProject (done) {
        apiRequest(port, {
          action: 'retract',
          licensorID: LICENSOR.id,
          password: LICENSOR.password,
          projectID: project
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
  server(function (port, service, close) {
    var firstProject
    var secondProject
    runSeries([
      writeTestLicensor.bind(null, service),
      function offerFirstProject (done) {
        apiRequest(port, Object.assign(clone(OFFER), {
          licensorID: LICENSOR.id,
          password: LICENSOR.password,
          repository: 'http://example.com/first'
        }), function (error, response) {
          if (error) return done(error)
          test.equal(response.error, false, 'false error')
          firstProject = response.project
          done()
        })
      },
      function offerSecondProject (done) {
        apiRequest(port, Object.assign(clone(OFFER), {
          licensorID: LICENSOR.id,
          password: LICENSOR.password,
          repository: 'http://example.com/second'
        }), function (error, response) {
          if (error) return done(error)
          test.equal(response.error, false, 'false error')
          secondProject = response.project
          done()
        })
      },
      function retractFirstProject (done) {
        apiRequest(port, {
          action: 'retract',
          licensorID: LICENSOR.id,
          password: LICENSOR.password,
          projectID: firstProject
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
                return element.project === firstProject
              })
              .retracted,
            null,
            'first project retracted'
          )
          test.equal(
            projects
              .find(function (element) {
                return element.project === secondProject
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
