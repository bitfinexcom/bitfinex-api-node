'use strict'

const { RESTv2 } = require('bfx-api-node-rest')
const { args: { apiKey, apiSecret }, debug } = require('../util/setup')

async function execute () {
  const rest = new RESTv2({
    apiKey,
    apiSecret,
    transform: true
  })
  debug('Submitting new order...')

  // get new deposit address
  const address = await rest.getDepositAddress({
    wallet: 'exchange',
    method: 'bitcoin',
    opRenew: 0
  })

  debug(`new wallet address ${address}`)

  // transfer between accounts
  const transferConfirmation = await rest.transfer({
    from: 'exchange',
    to: 'margin',
    amount: 10,
    currency: 'BTC',
    currencyTo: 'BTC'
  })

  debug('transfer confirmed: %j', transferConfirmation)

  // withdraw
  const withdrawalConfirmation = await rest.withdraw({
    wallet: 'exchange',
    method: 'bitcoin',
    amount: 2,
    address: '1MUz4VMYui5qY1mxUiG8BQ1Luv6tqkvaiL'
  })

  debug('withdraw confirmed: %j', withdrawalConfirmation)
}

execute()
