module.exports = function (argument) {
  return argument
    .replace(/ISO 8601/g, '<a href=https://en.wikipedia.org/wiki/ISO_8601 target=_blank>ISO 8601</a>')
    .replace(/ISO 3166-2/g, '<a href=https://en.wikipedia.org/wiki/ISO_3166-2 target=_blank>ISO 3166-2</a>')
    .replace(/Ed25519/g, '<a href=https://ed25519.cr.yp.to/ target=_blank>Ed25519</a>')
}
