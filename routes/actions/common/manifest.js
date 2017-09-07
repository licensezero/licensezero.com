var projectProperties = {
  projectID: require('./project-id'),
  repository: require('./repository'),
  description: require('./description')
}

var properties = {
  FORM: {const: 'private license'},
  VERSION: {enum: ['0.0.0']},
  date: {
    type: 'string',
    format: 'date-time'
  },
  tier: require('./tier'),
  project: {
    type: 'object',
    properties: projectProperties,
    required: Object.keys(projectProperties),
    additionalProperties: false
  },
  licensee: {
    name: require('./name'),
    jurisdiction: require('./jurisdiction')
  },
  licensor: {
    name: require('./name'),
    jurisdiction: require('./jurisdiction')
  },
  price: require('./price')
}

module.exports = {
  type: 'object',
  properties: properties,
  required: Object.keys(properties),
  additionalProperties: false
}
