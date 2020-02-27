'use strict'

// Proxy to allow external stubbing
const debug = require('debug')
module.exports = { get: () => debug }
