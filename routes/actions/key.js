exports.handler = function (body, service, end, fail, lock) {
  end({key: service.publicKey.toString('hex')})
}
