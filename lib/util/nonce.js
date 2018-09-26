'use strict'

let nonce = null

module.exports = () => {
  let now = 1000 * new Date()
  nonce = (nonce < now) ? now : nonce + 1
  return nonce
}
