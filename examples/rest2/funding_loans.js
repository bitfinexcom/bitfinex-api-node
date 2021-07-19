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
}

execute()
