'use strict'

const { prepareAmount } = require('bfx-api-node-util')
const argFromCLI = require('../util/arg_from_cli')
const runExample = require('../util/run_example')

module.exports = runExample({
  name: 'rest-get-funding-offers',
  rest: { env: true },
  params: {
    symbol: argFromCLI(0, 'fUSD')
  }
}, async ({ rest, debug, debugTable, params }) => {
  const { symbol } = params

  debug('fetching funding offers for %s', symbol)

  const fos = await rest.fundingOffers(symbol)

  if (fos.length === 0) {
    debug('none available')
  } else {
    debugTable({
      headers: ['Symbol', 'Amount', 'Status', 'Rate', 'Period', 'Renew'],
      rows: fos.map(fo => [
        fo.symbol, prepareAmount(fo.amount), fo.status, fo.rate * 100,
        fo.period, fo.renew ? 'Y' : 'N'
      ])
    })
  }
})
