'use strict'

const _findLast = require('lodash/findLast')

/**
 * Resolves the message payload; useful for getting around sequence numbers
 *
 * @param {*[]} msg
 * @return {Array} payload - undefined if not found
 */
module.exports = (msg = []) => {
  return _findLast(msg, i => Array.isArray(i))
}
