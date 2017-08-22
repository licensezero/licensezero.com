var encode = require('../data/encode')

exports.handler = function (body, service, end, fail, lock) {
  end({key: encode(service.publicKey)})
}
