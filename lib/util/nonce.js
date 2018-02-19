'use strict'

let last = Date.now() * 10000000

module.exports = () => {
  last = Math.max(Date.now() * 10000000, ++last)

  return last
}
