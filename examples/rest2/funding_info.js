'use strict'

const { prepareAmount } = require('bfx-api-node-util')
const argFromCLI = require('../util/arg_from_cli')
const runExample = require('../util/run_example')

module.exports = runExample({
  name: 'rest-get-funding-info',
  rest: { env: true },
  params: {
    symbol: argFromCLI(0, 'fUSD')
  }
}, async ({ rest, debug, debugTable, params }) => {
  const { symbol } = params

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
})
