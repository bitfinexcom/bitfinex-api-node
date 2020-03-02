'use strict'

const runExample = require('../util/run_example')

module.exports = runExample({
  name: 'rest-transfer',
  rest: { env: true, transform: true },
  params: {
    fromType: 'deposit',
    fromCCY: 'USD',
    toType: 'trading',
    toCCY: 'USD',
    amount: 1
  }
}, async ({ debug, rest, params }) => {
  const { fromType, fromCCY, toType, toCCY, amount } = params

  debug(
    'transferring %f from %s %s to %s %s',
    amount, fromType, fromCCY, toType, toCCY
  )

  await rest.transfer({
    amount: `${amount}`,
    from: fromType,
    currency: fromCCY,
    to: toType,
    currencyTo: toCCY
  })

  debug('done!')
})
