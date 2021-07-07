'use strict'

const { prepareAmount } = require('bfx-api-node-util')
const argFromCLI = require('../util/arg_from_cli')
const { RESTv2 } = require('bfx-api-node-rest')
const { args: { apiKey, apiSecret }, debug, debugTable } = require('../util/setup')

async function execute () {
  const rest = new RESTv2({
    apiKey,
    apiSecret,
    transform: true
  })
  const symbol = argFromCLI(0, 'fUSD')

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
}

execute()
