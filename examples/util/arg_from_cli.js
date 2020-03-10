'use strict'

const _isEmpty = require('lodash/isEmpty')
const _isFunction = require('lodash/isFunction')

/**
 * Grabs an argument from the arguments list if we've been executed via node or
 * npm
 *
 * @param {number} index - starting after invocation (2)
 * @param {string} def - fallback value if none found/not supported
 * @param {Function?} parser - optional, used to process value if provided
 * @returns {string} value
 */
module.exports = (index, def, parser) => {
  const val = /node/.test(process.argv[0]) || /npm/.test(process.argv[0])
    ? _isEmpty(process.argv[2 + index]) ? def : process.argv[2 + index]
    : def

  return _isFunction(parser)
    ? parser(val)
    : val
}
