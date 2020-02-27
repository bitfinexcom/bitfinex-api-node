'use strict'

const runExample = require('../util/run_example')

module.exports = runExample({
  name: 'rest-wallet',
  rest: { env: true, transform: true }
}, async ({ rest, debug }) => {
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
})
