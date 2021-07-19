'use strict'

const { prepareAmount } = require('bfx-api-node-util')
const argFromCLI = require('../util/arg_from_cli')
const { RESTv2 } = require('../../index')
const { args: { apiKey, apiSecret }, debug, debugTable } = require('../util/setup')

async function execute () {
  const rest = new RESTv2({
    apiKey,
    apiSecret,
    transform: true
  })
  const symbol = argFromCLI(0, 'fUSD')

  debug('fetching funding info for %s', symbol)

  const flu = await rest.fundingInfo(symbol)
  const [,, [yieldLoan, yieldLend, durationLoan, durationLend]] = flu

  debugTable({
    headers: [
      'Symbol', 'Yield Loan', 'Yield Lend', 'Duration Loan', 'Duration Lend'
    ],
    rows: [[
      symbol, prepareAmount(yieldLoan), prepareAmount(yieldLend), durationLoan,
      durationLend
    ]]
  })
}

execute()
