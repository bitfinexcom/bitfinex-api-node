'use strict'

const { prepareAmount, preparePrice } = require('bfx-api-node-util')
const runExample = require('../util/run_example')
const argFromCLI = require('../util/arg_from_cli')

module.exports = runExample({
  name: 'rest-get-movements',
  rest: { env: true, transform: true },
  params: {
    ccy: argFromCLI(0, 'all')
  }
}, async ({ debug, debugTable, rest, params }) => {
  const ccy = params.ccy === 'all' ? null : params.ccy

  debug('fetching movements for %s...', ccy || 'all currencies')

  const movements = await rest.movements(ccy)

  if (movements.length === 0) {
    return debug('no movements found')
  }

  debugTable({
    headers: [
      'ID', 'Currency', 'Started', 'Updated', 'Status', 'Amount', 'Fees'
    ],

    rows: movements.map((m) => {
      const status = `${m.status[0].toUpperCase()}${m.status.substring(1).toLowerCase()}`
      const started = new Date(m.mtsStarted).toLocaleString()
      const updated = new Date(m.mtsUpdated).toLocaleString()

      return [
        m.id, m.currency, started, updated, status, prepareAmount(m.amount),
        preparePrice(m.fees)
      ]
    })
  })
})
