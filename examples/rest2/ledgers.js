'use strict'

process.env.DEBUG = 'bfx:examples:*'

const args = process.argv
const debug = require('debug')('bfx:examples:rest2-ledgers')
const Table = require('cli-table2')
const bfx = require('../bfx')
const rest = bfx.rest(2, { transform: true })
const ccy = args.length < 3 ? null : String(args[2])

const table = new Table({
  colWidths: [12, 12, 20, 14, 14, 80],
  head: [
    'Entry ID', 'Currency', 'Timestamp', 'Amount', 'Balance', 'Description'
  ]
})

debug('fetching ledger entries for %s...', ccy || 'all currencies')

rest.ledgers(ccy).then(entries => {
  let e

  for (let i = 0; i < entries.length; i += 1) {
    e = entries[i]

    table.push([
      e.id, e.currency, new Date(e.mts).toLocaleString(), e.amount, e.balance,
      e.description
    ])
  }

  console.log(table.toString())
}).catch(err => {
  debug('error: %j', err)
})
