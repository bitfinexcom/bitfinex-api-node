'use strict'

const _isEmpty = require('lodash/isEmpty')

/**
 * Grabs an argument from the arguments list if we've been executed via node or
 * npm
 *
 * @param {number} index - starting after invocation (2)
 * @param {string} default - fallback value if none found/not supported
 * @return {string} value
 */
module.exports = (index, def) => (
  /node/.test(process.argv[0]) || /npm/.test(process.argv[0])
    ? _isEmpty(process.argv[2 + index]) ? def : process.argv[2 + index]
    : def
)
