'use strict'

const _isFunction = require('lodash/isFunction')

const isClass = (f) => {
  return (
    (_isFunction(f)) &&
    (/^class\s/.test(Function.prototype.toString.call(f)))
  )
}

module.exports = isClass
