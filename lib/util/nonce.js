'use strict'

let last = Date.now() * 1000

module.exports = () => {
  last = Math.max(Date.now(), ++last)

  return last
}
