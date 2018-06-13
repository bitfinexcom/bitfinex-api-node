'use strict'

process.env.DEBUG = 'bfx:examples:*'

const args = process.argv
const debug = require('debug')('bfx:examples:rest2-movements')
const Table = require('cli-table2')
const bfx = require('../bfx')
const rest = bfx.rest(2, { transform: true })
const ccy = args.length < 3 ? null : String(args[2])

const table = new Table({
  colWidths: [12, 12, 20, 20, 20, 14, 14, 20, 20],
  head: [
    'ID', 'Currency', 'Started', 'Updated', 'Status', 'Amount', 'Fees',
    'Destination', 'Tx ID'
  ]
})

debug('fetching movements for %s...', ccy || 'all currencies')

rest.movements(ccy).then(movements => {
  let m

  for (let i = 0; i < movements.length; i += 1) {
    m = movements[i]

    const status = `${m.status[0].toUpperCase()}${m.status.substring(1).toLowerCase()}`
    const started = new Date(m.mtsStarted).toLocaleString()
    const updated = new Date(m.mtsUpdated).toLocaleString()

    table.push([
      m.id, m.currency, started, updated, status, m.amount, m.fees,
      m.destinationAddress, m.transactionId
    ])
  }

  console.log(table.toString())
}).catch(err => {
  debug('error: %j', err)
})
