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
}

execute()
