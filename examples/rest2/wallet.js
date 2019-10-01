'use strict'

process.env.DEBUG = 'bfx:examples:*'

const debug = require('debug')('bfx:examples:submit_order')
const bfx = require('../bfx')
const rest = bfx.rest(2, { transform: true })

debug('Submitting new order...')

// get new deposit address
rest.getDepositAddress({
  wallet: 'exchange',
  method: 'bitcoin',
  opRenew: 0
})
  .then((address) => {
    debug(`New wallet address ${address}`)
  })

// transfer between accounts
rest.transfer({
  from: 'exchange',
  to: 'margin',
  amount: 10,
  currency: 'BTC',
  currencyTo: 'BTC'
})
  .then((res) => {
    debug(`transfer confirmed: ${res}`)
  })

// withdraw
rest.withdraw({
  wallet: 'exchange',
  method: 'bitcoin',
  amount: 2,
  address: '1MUz4VMYui5qY1mxUiG8BQ1Luv6tqkvaiL'
})
  .then((res) => {
    debug(`withdraw confirmed: ${res}`)
  })
