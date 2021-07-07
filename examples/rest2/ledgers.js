'use strict'

const { prepareAmount } = require('bfx-api-node-util')
const { RESTv2 } = require('bfx-api-node-rest')
const { args: { apiKey, apiSecret }, debug, debugTable } = require('../util/setup')
const argFromCLI = require('../util/arg_from_cli')

async function execute () {
  const rest = new RESTv2({
    apiKey,
    apiSecret,
    transform: true
  })
  const params = {
    ccy: argFromCLI(0, 'all')
  }
  const ccy = params.ccy === 'all' ? null : params.ccy

  debug('fetching ledger entries for %s...', ccy || 'all currencies')

  const entries = await rest.ledgers(ccy)
  const rows = entries.map(e => [
    e.id, e.currency, new Date(e.mts).toLocaleString(), prepareAmount(e.amount),
    prepareAmount(e.balance), e.description
  ])

  debugTable({
    rows,
    headers: [
      'Entry ID', 'Currency', 'Timestamp', 'Amount', 'Balance', 'Description'
    ]
  })
}

execute()
