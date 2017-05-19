'use strict'

exports.isSnapshot = isSnapshot
function isSnapshot (msg) {
  if (!msg[0]) return false

  if (Array.isArray(msg[0])) return true

  return false
}
