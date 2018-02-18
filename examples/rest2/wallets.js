'use strict'

process.env.DEBUG = 'bfx:examples:*'

const debug = require('debug')('bfx:examples:rest2_wallets')
const bfx = require('../bfx')
const rest = bfx.rest(2)

debug('fetching wallets...')

rest.wallets((err, wallets) => {
  if (err) {
    return debug('error: %s', err.message)
  }

  console.log(JSON.stringify({ wallets }, null, 2))
}).catch((err) => {
  debug('error: %j', err)
})
