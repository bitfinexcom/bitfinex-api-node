'use strict'

const isSnapshot = msg => msg[0] && Array.isArray(msg[0])

module.exports = isSnapshot
