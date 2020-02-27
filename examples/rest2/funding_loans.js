'use strict'

const { prepareAmount } = require('bfx-api-node-util')
const argFromCLI = require('../util/arg_from_cli')
const runExample = require('../util/run_example')

module.exports = runExample({
  name: 'rest-get-funding-loans',
  rest: { env: true },
  params: {
    symbol: argFromCLI(0, 'fUSD')
  }
}, async ({ rest, debug, debugTable, params }) => {
  const { symbol } = params

  debug('fetching funding loans for %s', symbol)

  const fls = await rest.fundingLoans(symbol)

  if (fls.length === 0) {
    debug('none available')
  } else {
    debugTable({
      headers: ['Symbol', 'Amount', 'Status', 'Rate', 'Period', 'Renew'],
      rows: fls.map(fl => [
        fl.symbol, prepareAmount(fl.amount), fl.status, fl.rate * 100,
        fl.period, fl.renew ? 'Y' : 'N'
      ])
    })
  }
})
