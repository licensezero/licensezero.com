#!/usr/bin/env node
var npmAuthorsContributors = require('npm-authors-contributors')

npmAuthorsContributors({}, process.cwd(), function (error, people) {
  if (error) {
    console.error(error)
    process.exit(1)
  }
  var names = []
  people.forEach(function (person) {
    try {
      var newName = person.name
      if (newName) {
        if (!names.some(function (otherName) {
          return otherName.toLowerCase() === newName.toLowerCase()
        })) names.push(newName)
      }
    } catch (e) {
      /* pass */
    }
  })
  names.sort(function (a, b) {
    return sortName(a).localeCompare(sortName(b))
  })
  console.log(
    [
      'See https://licensezero.com/thanks for non-code contributors',
      'deserving special mention.',
      '',
      'License Zero uses open software from the following npm package',
      'authors and contributors:',
      '',
      names.join('\n')
    ].join('\n')
  )
})

function sortName (name) {
  if (/^[a-zA-Z]/.test(name)) return name.toLowerCase()
  return name.slice(1).toLowerCase()
}
