'use strict'

const crypto = require('crypto')
let nonce = Date.now()

const genAuthSig = (secret, payload = '') => {
  if (payload.length === 0) {
    payload = `AUTH${nonce}${nonce}`
  }

  const sig = crypto
    .createHmac('sha384', secret)
    .update(payload)
    .digest('hex')

  return {
    payload,
    sig,
    nonce: nonce++
  }
}

module.exports = genAuthSig
