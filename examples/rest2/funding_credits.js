'use strict'

const { prepareAmount } = require('bfx-api-node-util')
const argFromCLI = require('../util/arg_from_cli')
const runExample = require('../util/run_example')

module.exports = runExample({
  name: 'rest-get-funding-credits',
  rest: { env: true },
  params: {
    symbol: argFromCLI(0, 'fUSD')
  }
}, async ({ rest, debug, debugTable, params }) => {
  const { symbol } = params

  debug('fetching funding credits for %s', symbol)

  const fcs = await rest.fundingCredits(symbol)

  if (fcs.length === 0) {
    debug('none available')
  } else {
    debugTable({
      headers: ['Symbol', 'Amount', 'Status', 'Rate', 'Period', 'Renew'],
      rows: fcs.map(fc => [
        fc.symbol, prepareAmount(fc.amount), fc.status, fc.rate * 100,
        fc.period, fc.renew ? 'Y' : 'N'
      ])
    })
  }
})
