'use strict'

const isClass = (f) => {
  return (
    (typeof f === 'function') &&
    (/^class\s/.test(Function.prototype.toString.call(f)))
  )
}

module.exports = isClass
