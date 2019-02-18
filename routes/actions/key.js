exports.handler = function (log, body, end, fail, lock) {
  end({ key: process.env.PUBLIC_KEY })
}
