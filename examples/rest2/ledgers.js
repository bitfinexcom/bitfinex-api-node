'use strict'

const { prepareAmount } = require('bfx-api-node-util')
const runExample = require('../util/run_example')
const argFromCLI = require('../util/arg_from_cli')

module.exports = runExample({
  name: 'rest-get-ledgers',
  rest: { env: true, transform: true },
  params: {
    ccy: argFromCLI(0, 'all')
  }
}, async ({ debug, debugTable, rest, params }) => {
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
})
