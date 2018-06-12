'use strict'

process.env.DEBUG = 'bfx:examples:*'

const args = process.argv
const debug = require('debug')('bfx:examples:rest2-ledgers')

if (args.length < 3) {
  debug('error: symbol required (i.e: npm run ledgers ETH')
  process.exit(1)
}

const Table = require('cli-table2')
const bfx = require('../bfx')
const rest = bfx.rest(2, { transform: true })
const ccy = String(args[2])

const table = new Table({
  colWidths: [12, 12, 20, 14, 14, 80],
  head: [
    'Entry ID', 'Currency', 'Timestamp', 'Amount', 'Balance', 'Description'
  ]
})

debug('fetching ledger entries for %s...', ccy)

rest.ledgers(ccy).then(entries => {
  let o

  for (let i = 0; i < entries.length; i += 1) {
    o = entries[i]

    table.push([
      o[0], o[1], new Date(o[3]).toLocaleString(), o[5], o[6], o[8]
    ])
  }

  console.log(table.toString())
}).catch(err => {
  debug('error: %j', err)
})
