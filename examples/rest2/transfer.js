'use strict'

const { RESTv2 } = require('../../index')
const { args: { apiKey, apiSecret }, debug } = require('../util/setup')

async function execute () {
  const rest = new RESTv2({
    apiKey,
    apiSecret,
    transform: true
  })
  const { fromType, fromCCY, toType, toCCY, amount } = {
    fromType: 'deposit',
    fromCCY: 'USD',
    toType: 'trading',
    toCCY: 'USD',
    amount: 1
  }

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
}

execute()
