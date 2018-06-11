'use strict'

process.env.DEBUG = 'bfx:examples:*'

const args = process.argv
const debug = require('debug')('bfx:examples:rest2-movements')

if (args.length < 3) {
  debug('error: symbol required (i.e: npm run movements ETH')
  process.exit(1)
}

const Table = require('cli-table2')
const bfx = require('../bfx')
const rest = bfx.rest(2, { transform: true })
const ccy = String(args[2])

const table = new Table({
  colWidths: [12, 12, 20, 20, 20, 14, 14, 20, 20],
  head: [
    'ID', 'Currency', 'Started', 'Updated', 'Status', 'Amount', 'Fees',
    'Destination', 'Tx ID'
  ]
})

debug('fetching movements for %s...', ccy)

rest.movements(ccy).then(movements => {
  let o

  for (let i = 0; i < movements.length; i += 1) {
    o = movements[i]

    const status = `${o[9][0].toUpperCase()}${o[9].substring(1).toLowerCase()}`
    const started = new Date(o[5]).toLocaleString()
    const updated = new Date(o[6]).toLocaleString()

    table.push([
      o[0], o[2], started, updated, status, o[12], o[13], o[16], o[20]
    ])
  }

  console.log(table.toString())
}).catch(err => {
  debug('error: %j', err)
})
