'use strict'

process.env.DEBUG = 'bfx:examples:*'

const Table = require('cli-table2')
const debug = require('debug')('bfx:examples:rest2_positions')
const bfx = require('../bfx')
const rest = bfx.rest(2, { transform: true })

debug('fetching positions...')

rest.positions((err, data) => {
  if (err) {
    return debug('error: %s', err.message)
  }

  const t = new Table({
    colWidths: [20, 10, 20, 20, 20],
    head: [
      'Symbol', 'Status', 'Amount', 'Base Price', 'Funding Cost', 'Base Value'
    ],
  })

  const entries = Object.values(data)
  let e

  for (let i = 0; i < entries.length; i += 1) {
    e = entries[i]
    e.status = e.status.toLowerCase()
    e.status = `${e.status[0].toUpperCase()}${e.status.substring(1)}`

    t.push([
      e.symbol, e.status, e.amount, e.basePrice, e.marginFunding,
      Number(e.marginFunding) + (Number(e.amount) * Number(e.basePrice))
    ])
  }

  console.log(t.toString())
}).catch(err => {
  debug('error: %j', err)
})