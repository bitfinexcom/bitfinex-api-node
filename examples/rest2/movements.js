'use strict'

const { prepareAmount, preparePrice } = require('bfx-api-node-util')
const { RESTv2 } = require('../../index')
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
}

execute()
